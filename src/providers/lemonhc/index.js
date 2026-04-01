const { login, refreshAccessToken } = require('./auth');
const { createApiClient } = require('./apiClient');
const { loadSession, saveSession, clearSession } = require('../../storage/sessionStore');
const { listHospitals, findHospital } = require('./hospitals');

const PROVIDER = 'lemonhc';

function createLemonhcProvider() {
  async function getValidToken() {
    let session = loadSession(PROVIDER);
    if (!session) {
      const err = new Error('Not logged in.');
      err.code = 'NOT_LOGGED_IN';
      err.hint = 'Run: health-cli list-hospitals → pick a hospitalCd → health-cli login --hospital-cd <cd> --username <u> --password <p>';
      throw err;
    }

    if (Date.now() >= session.expiresAt) {
      if (!session.refreshToken) {
        const err = new Error('Session expired.');
        err.code = 'SESSION_EXPIRED';
        err.hint = `Run: health-cli login --hospital-cd ${session.hospitalCd} --username <u> --password <p>`;
        throw err;
      }
      const refreshed = await refreshAccessToken({
        hospitalCd: session.hospitalCd,
        refreshToken: session.refreshToken,
      });
      session = { ...session, ...refreshed };
      saveSession(PROVIDER, session);
    }

    return session.accessToken;
  }

  function getClient(hospitalCd) {
    const session = loadSession(PROVIDER);
    const hCd = hospitalCd || session?.hospitalCd;
    if (!hCd) {
      const err = new Error('hospitalCd is required but not set in session.');
      err.code = 'MISSING_HOSPITAL_CD';
      err.hint = 'Run: health-cli list-hospitals to see available hospitalCd values';
      throw err;
    }
    return createApiClient({ getToken: getValidToken, hospitalCd: hCd });
  }

  return {
    id: PROVIDER,
    name: 'LemonHealthCare (mcare)',

    async authStatus() {
      const session = loadSession(PROVIDER);
      if (!session) {
        return {
          loggedIn: false,
          nextStep: 'health-cli list-hospitals → health-cli login --hospital-cd <cd> --username <u> --password <p>',
        };
      }
      const expired = Date.now() >= session.expiresAt;
      const hospital = findHospital(session.hospitalCd);
      return {
        loggedIn: true,
        expired,
        canAutoRefresh: !!session.refreshToken,
        hospital: hospital ? hospital.hospitalNm : session.hospitalCd,
        expiresAt: new Date(session.expiresAt).toISOString(),
        ...(expired && {
          nextStep: `health-cli login --hospital-cd ${session.hospitalCd} --username <u> --password <p>`,
        }),
      };
    },

    async login({ hospitalCd, username, password }) {
      // hospitalCd 없으면 에러 대신 병원 목록 반환
      if (!hospitalCd) {
        const err = new Error('--hospital-cd is required.');
        err.code = 'MISSING_HOSPITAL_CD';
        err.hint = 'Run: health-cli list-hospitals to see available hospitalCd values';
        err.hospitals = listHospitals();
        throw err;
      }
      if (!username || !password) {
        const err = new Error(!username ? '--username is required.' : '--password is required.');
        err.code = 'MISSING_PARAMS';
        throw err;
      }
      const session = await login({ hospitalCd, username, password });
      saveSession(PROVIDER, session);
      const hospital = findHospital(hospitalCd);
      return {
        success: true,
        hospital: hospital ? hospital.hospitalNm : hospitalCd,
        expiresAt: new Date(session.expiresAt).toISOString(),
        nextStep: 'health-cli get-lab-results --patient-id <id>',
      };
    },

    async logout() {
      clearSession(PROVIDER);
      return { success: true };
    },

    async getUserInfo() {
      const client = getClient();
      const res = await client.getUserInfo();
      if (res.status !== 'OK') {
        const err = new Error(res.message || 'API error');
        err.code = 'API_ERROR';
        throw err;
      }
      const { fullname, birthday, patients } = res.body;
      const mine = patients.find(p => p.hospitalCd === (loadSession(PROVIDER)?.hospitalCd));
      return { fullname, birthday, patientId: mine?.patientId || null, patients };
    },

    async getLabResults({ hospitalCd, patientId, startDt, endDt }) {
      // 환자번호 없으면 loginUserInfo로 자동 조회
      if (!patientId) {
        const client = getClient(hospitalCd);
        const userRes = await client.getUserInfo();
        if (userRes.status !== 'OK') {
          const err = new Error('환자번호 자동 조회 실패');
          err.code = 'PATIENT_ID_LOOKUP_FAILED';
          throw err;
        }
        const session = loadSession(PROVIDER);
        const mine = userRes.body.patients.find(p => p.hospitalCd === (hospitalCd || session?.hospitalCd));
        if (!mine?.patientId) {
          const err = new Error('환자번호를 찾을 수 없습니다. --patient-id로 직접 입력하세요.');
          err.code = 'PATIENT_ID_NOT_FOUND';
          throw err;
        }
        patientId = mine.patientId;
      }
      const now = new Date();
      const defaultEnd = now.toISOString().slice(0, 10).replace(/-/g, '');
      const defaultStart = new Date(now.setFullYear(now.getFullYear() - 1))
        .toISOString().slice(0, 10).replace(/-/g, '');

      const client = getClient(hospitalCd);
      const res = await client.getLabResults({
        patientId,
        startDt: startDt || defaultStart,
        endDt: endDt || defaultEnd,
      });

      if (res.status !== 'OK') {
        const err = new Error(res.message || 'API error');
        err.code = 'API_ERROR';
        throw err;
      }
      return res.body;
    },

    async getSchedule({ hospitalCd, patientId, startDt, endDt } = {}) {
      if (!patientId) {
        const client = getClient(hospitalCd);
        const userRes = await client.getUserInfo();
        const session = loadSession(PROVIDER);
        const mine = userRes.body?.patients?.find(p => p.hospitalCd === (hospitalCd || session?.hospitalCd));
        if (!mine?.patientId) {
          const err = new Error('환자번호를 찾을 수 없습니다. --patient-id로 직접 입력하세요.');
          err.code = 'PATIENT_ID_NOT_FOUND';
          throw err;
        }
        patientId = mine.patientId;
      }
      const now = new Date();
      const defaultEnd = new Date(now.setFullYear(now.getFullYear() + 1))
        .toISOString().slice(0, 10).replace(/-/g, '');
      const defaultStart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const client = getClient(hospitalCd);
      return client.getSchedule({ patientId, startDt: startDt || defaultStart, endDt: endDt || defaultEnd });
    },

    async getTreatHistory({ hospitalCd, patientId, startDt, endDt, treatCls } = {}) {
      if (!patientId) {
        const client = getClient(hospitalCd);
        const userRes = await client.getUserInfo();
        const session = loadSession(PROVIDER);
        const mine = userRes.body?.patients?.find(p => p.hospitalCd === (hospitalCd || session?.hospitalCd));
        if (!mine?.patientId) {
          const err = new Error('환자번호를 찾을 수 없습니다. --patient-id로 직접 입력하세요.');
          err.code = 'PATIENT_ID_NOT_FOUND';
          throw err;
        }
        patientId = mine.patientId;
      }
      const now = new Date();
      const defaultEnd = now.toISOString().slice(0, 10).replace(/-/g, '');
      const defaultStart = new Date(now.setFullYear(now.getFullYear() - 1))
        .toISOString().slice(0, 10).replace(/-/g, '');
      const client = getClient(hospitalCd);
      return client.getTreatHistory({
        patientId,
        startDt: startDt || defaultStart,
        endDt: endDt || defaultEnd,
        treatCls: treatCls || 'O',
      });
    },

    async getReservations({ hospitalCd, patientId, startDt, endDt } = {}) {
      if (!patientId) {
        const client = getClient(hospitalCd);
        const userRes = await client.getUserInfo();
        const session = loadSession(PROVIDER);
        const mine = userRes.body?.patients?.find(p => p.hospitalCd === (hospitalCd || session?.hospitalCd));
        if (!mine?.patientId) {
          const err = new Error('환자번호를 찾을 수 없습니다. --patient-id로 직접 입력하세요.');
          err.code = 'PATIENT_ID_NOT_FOUND';
          throw err;
        }
        patientId = mine.patientId;
      }
      const now = new Date();
      const defaultEnd = now.toISOString().slice(0, 10).replace(/-/g, '');
      const defaultStart = new Date(now.setFullYear(now.getFullYear() - 1))
        .toISOString().slice(0, 10).replace(/-/g, '');
      const client = getClient(hospitalCd);
      return client.getReservations({ patientId, startDt: startDt || defaultStart, endDt: endDt || defaultEnd });
    },

    async getMenus({ hospitalCd } = {}) {
      const client = getClient(hospitalCd);
      return client.getMenus();
    },

    async listHospitals({ groupCd } = {}) {
      return listHospitals(groupCd);
    },
  };
}

module.exports = { createLemonhcProvider };
