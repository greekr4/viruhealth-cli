const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_DIR = path.join(os.homedir(), '.health-cli', 'sessions');

function getSessionPath(provider) {
  return path.join(BASE_DIR, `${provider}-session.json`);
}

function loadSession(provider) {
  const p = getSessionPath(provider);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function saveSession(provider, data) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
  fs.writeFileSync(getSessionPath(provider), JSON.stringify(data, null, 2), 'utf-8');
}

function clearSession(provider) {
  const p = getSessionPath(provider);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

module.exports = { loadSession, saveSession, clearSession };
