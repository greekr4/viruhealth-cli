const https = require('https');

const BASE_URL = 'common-ui.lemonhc.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10 multiTenant lemonhc:com.lemonhc.mcare.paik';

function createApiClient({ getToken, hospitalCd }) {
  function request(path) {
    return new Promise(async (resolve, reject) => {
      const token = await getToken();
      const req = https.request({
        hostname: BASE_URL,
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `accessToken=${token}; lang=ko`,
          'hospitalCd': hospitalCd,
          'signupType': 'MCARE',
          'Content-Type': 'application/json;charset=utf-8',
          'User-Agent': UA,
          'Accept': 'application/json',
        },
        rejectUnauthorized: false,
      }, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          if (res.statusCode === 401) {
            const err = new Error('Unauthorized — token expired');
            err.code = 'UNAUTHORIZED';
            return reject(err);
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  return {
    // 로그인된 유저 정보 조회 (환자번호 포함)
    // GET /mobile-ui/admin/api/users/v1
    // 응답: body.patients[].patientId, body.fullname, body.birthday
    getUserInfo() {
      return request(`/mobile-ui/admin/api/users/v1`);
    },

    // 검사결과 조회
    getLabResults({ patientId, startDt, endDt }) {
      return request(
        `/mobile-ui/user/api/labResult/v1/${hospitalCd}/${patientId}?startDt=${startDt}&endDt=${endDt}`
      );
    },

    // 진료이력 조회
    // GET /mobile-ui/user/api/treat/v1/{hospitalCd}/{patientId}?startDt=&endDt=&treatCls=
    // treatCls: O=외래, I=입원, E=응급
    getTreatHistory({ patientId, startDt, endDt, treatCls }) {
      return request(
        `/mobile-ui/user/api/treat/v1/${hospitalCd}/${patientId}?startDt=${startDt}&endDt=${endDt}&treatCls=${treatCls || 'O'}`
      );
    },

    // 예약일정 확인 (방문 예정 일정 — 진료/검사 포함)
    // GET /mobile-ui/user/api/information/v1/{hospitalCd}/{patientId}?startDt=&endDt=
    getSchedule({ patientId, startDt, endDt }) {
      return request(
        `/mobile-ui/user/api/information/v1/${hospitalCd}/${patientId}?startDt=${startDt}&endDt=${endDt}`
      );
    },

    // 예약 목록 조회 (예약가능 진료과)
    // GET /mobile-ui/user/api/reservation/dept/v1/{hospitalCd}/{patientId}
    getReservationDepts({ patientId }) {
      return request(`/mobile-ui/user/api/reservation/dept/v1/${hospitalCd}/${patientId}`);
    },

    // 진료예약 내역 조회
    // GET /mobile-ui/user/api/reservation/list/v2/{hospitalCd}/{patientId}?startDt=&endDt=
    getReservations({ patientId, startDt, endDt }) {
      return request(`/mobile-ui/user/api/reservation/list/v2/${hospitalCd}/${patientId}?startDt=${startDt||''}&endDt=${endDt||''}`);
    },

    // 메뉴 목록 조회
    getMenus() {
      return request(`/mobile-ui/user/api/menus/v1/${hospitalCd}`);
    },
  };
}

module.exports = { createApiClient };
