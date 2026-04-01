const https = require('https');
const crypto = require('crypto');

const BASE_URL = 'common-ui.lemonhc.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10 multiTenant lemonhc:com.lemonhc.mcare.paik';

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fetchPublicKey(hospitalCd) {
  const res = await httpsRequest({
    hostname: BASE_URL,
    path: `/mobile-ui/login?hospitalCd=${hospitalCd}&menuName=%EB%A1%9C%EA%B7%B8%EC%9D%B8`,
    method: 'GET',
    headers: {
      'User-Agent': UA,
      'hospitalCd': hospitalCd,
      'Cookie': 'lang=ko',
    },
    rejectUnauthorized: false,
  });

  const match = res.body.match(/rsaPublicKey\s*:\s*"([\s\S]+?)"/);
  if (!match) {
    const err = new Error('RSA public key not found for hospitalCd: ' + hospitalCd);
    err.code = 'PUBLIC_KEY_NOT_FOUND';
    throw err;
  }
  return match[1].split('\\/').join('/');
}

function encryptRsa(text, publicKeyBase64) {
  const pem =
    '-----BEGIN PUBLIC KEY-----\n' +
    publicKeyBase64.match(/.{1,64}/g).join('\n') +
    '\n-----END PUBLIC KEY-----';
  return crypto
    .publicEncrypt({ key: pem, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(text))
    .toString('base64');
}

async function login({ hospitalCd, username, password }) {
  const publicKey = await fetchPublicKey(hospitalCd);
  const encUsername = encryptRsa(username, publicKey);
  const encPassword = encryptRsa(password, publicKey);

  const body = new URLSearchParams({
    hospitalCd,
    appType: 'IOS',
    client_id: 'MCARE',
    grant_type: 'password',
    username: encUsername,
    password: encPassword,
    remember: 'true',
    isBio: 'N',
    returnUrl: '',
    isInactive: '',
    name: '',
    ci: '',
    birthday: '',
  }).toString();

  const res = await httpsRequest({
    hostname: BASE_URL,
    path: '/mobile-ui/refresh/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': UA,
      'hospitalCd': hospitalCd,
      'signupType': 'MCARE',
      'Cookie': 'lang=ko',
      'Accept': 'application/json',
    },
    rejectUnauthorized: false,
  }, body);

  if (res.status !== 200) {
    const err = new Error('Login failed: ' + res.body);
    err.code = 'LOGIN_FAILED';
    throw err;
  }

  const data = JSON.parse(res.body);
  const refreshToken = (res.headers['set-cookie'] || [])
    .join(';')
    .match(/refreshToken=([^;]+)/)?.[1] || null;

  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    hospitalCd,
    clientId: 'MCARE',
  };
}

async function refreshAccessToken({ hospitalCd, refreshToken }) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: 'MCARE',
  }).toString();

  const res = await httpsRequest({
    hostname: BASE_URL,
    path: '/mobile-ui/refresh/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': UA,
      'hospitalCd': hospitalCd,
      'signupType': 'MCARE',
      'Cookie': `refreshToken=${refreshToken}; lang=ko`,
      'Accept': 'application/json',
    },
    rejectUnauthorized: false,
  }, body);

  if (res.status !== 200) {
    const err = new Error('Token refresh failed: ' + res.body);
    err.code = 'REFRESH_FAILED';
    throw err;
  }

  const data = JSON.parse(res.body);
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
}

module.exports = { login, refreshAccessToken, fetchPublicKey };
