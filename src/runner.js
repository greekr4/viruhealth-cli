const { createLemonhcProvider } = require('./providers/lemonhc');

const createError = (code, message, hint) => {
  const err = new Error(message);
  err.code = code;
  if (hint) err.hint = hint;
  return err;
};

const getProvider = (name) => {
  if (name === 'lemonhc') return createLemonhcProvider();
  throw createError('UNKNOWN_PROVIDER', `Unknown provider: ${name}`, 'Supported: lemonhc');
};

const runCommand = async (command, opts = {}) => {
  if (opts.dryRun) {
    return { dryRun: true, command, params: { ...opts, dryRun: undefined } };
  }

  const provider = getProvider(opts.provider || 'lemonhc');

  switch (command) {
    case 'login':
      return provider.login({
        hospitalCd: opts.hospitalCd,
        username: opts.username,
        password: opts.password,
      });

    case 'logout':
      return provider.logout();

    case 'status':
      return provider.authStatus();

    case 'get-lab-results':
      return provider.getLabResults({
        hospitalCd: opts.hospitalCd,
        patientId: opts.patientId,
        startDt: opts.startDt,
        endDt: opts.endDt,
      });

    case 'get-user-info':
      return provider.getUserInfo();

    case 'get-schedule':
      return provider.getSchedule({
        hospitalCd: opts.hospitalCd,
        patientId: opts.patientId,
        startDt: opts.startDt,
        endDt: opts.endDt,
      });

    case 'get-treat-history':
      return provider.getTreatHistory({
        hospitalCd: opts.hospitalCd,
        patientId: opts.patientId,
        startDt: opts.startDt,
        endDt: opts.endDt,
        treatCls: opts.treatCls,
      });

    case 'get-reservations':
      return provider.getReservations({
        hospitalCd: opts.hospitalCd,
        patientId: opts.patientId,
        startDt: opts.startDt,
        endDt: opts.endDt,
      });

    case 'get-menus':
      return provider.getMenus({ hospitalCd: opts.hospitalCd });

    case 'list-hospitals':
      return provider.listHospitals({ groupCd: opts.groupCd });

    default:
      throw createError('UNKNOWN_COMMAND', `Unknown command: ${command}`, 'health-cli --spec');
  }
};

module.exports = { runCommand };
