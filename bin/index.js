#!/usr/bin/env node

const { Command } = require('commander');
const { runCommand } = require('../src/runner');
const VERSION = require('../package.json').version;

const program = new Command();

program
  .name('viruhealth')
  .description('AI-agent-optimized CLI for personal health data')
  .version(VERSION);

program.option('--spec', 'Output full command schema as JSON');

// --- Auth ---

program
  .command('login')
  .description('Login to a health provider')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code (e.g. 31100651)')
  .option('--username <id>', 'Account username / ID')
  .option('--password <pw>', 'Account password')
  .option('--dry-run', 'Validate params without executing', false)
  .action((opts) => execute('login', opts));

program
  .command('logout')
  .description('Logout from a health provider')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .action((opts) => execute('logout', opts));

program
  .command('status')
  .description('Check login status')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .action((opts) => execute('status', opts));

// --- Health data ---

program
  .command('get-user-info')
  .description('Fetch logged-in user info including patient ID')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .action((opts) => execute('get-user-info', opts));

program
  .command('get-lab-results')
  .description('Fetch lab test results (patient ID auto-resolved if omitted)')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code (overrides session value)')
  .option('--patient-id <id>', 'Patient ID (auto-resolved from session if omitted)')
  .option('--start-dt <YYYYMMDD>', 'Start date (default: 1 year ago)')
  .option('--end-dt <YYYYMMDD>', 'End date (default: today)')
  .action((opts) => execute('get-lab-results', opts));

program
  .command('get-schedule')
  .description('Fetch upcoming appointment schedule (진료/검사 예약일정)')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code (overrides session value)')
  .option('--patient-id <id>', 'Patient ID (auto-resolved if omitted)')
  .option('--start-dt <YYYYMMDD>', 'Start date (default: today)')
  .option('--end-dt <YYYYMMDD>', 'End date (default: 1 year from now)')
  .action((opts) => execute('get-schedule', opts));

program
  .command('get-treat-history')
  .description('Fetch treatment history (O=외래, I=입원, E=응급)')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code (overrides session value)')
  .option('--patient-id <id>', 'Patient ID (auto-resolved if omitted)')
  .option('--start-dt <YYYYMMDD>', 'Start date (default: 1 year ago)')
  .option('--end-dt <YYYYMMDD>', 'End date (default: today)')
  .option('--treat-cls <cls>', 'Treatment class: O=외래, I=입원, E=응급 (default: O)', 'O')
  .action((opts) => execute('get-treat-history', opts));

program
  .command('get-reservations')
  .description('Fetch reservation history (patient ID auto-resolved if omitted)')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code (overrides session value)')
  .option('--patient-id <id>', 'Patient ID (auto-resolved from session if omitted)')
  .option('--start-dt <YYYYMMDD>', 'Start date (default: 1 year ago)')
  .option('--end-dt <YYYYMMDD>', 'End date (default: today)')
  .action((opts) => execute('get-reservations', opts));

program
  .command('get-menus')
  .description('Fetch available hospital menus')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--hospital-cd <id>', 'Hospital code')
  .action((opts) => execute('get-menus', opts));

program
  .command('list-hospitals')
  .description('List known hospitals (currently supports: paik group)')
  .option('--provider <name>', 'Provider name', 'lemonhc')
  .option('--group-cd <code>', 'Filter by group code (e.g. paik)')
  .action((opts) => execute('list-hospitals', opts));

// --- Spec ---

function extractSpec(cmd) {
  return {
    name: cmd.name(),
    description: cmd.description(),
    options: cmd.options
      .filter((o) => o.long !== '--version' && o.long !== '--spec')
      .map((o) => ({
        flags: o.flags,
        description: o.description,
        default: o.defaultValue,
      })),
  };
}

function generateFullSpec() {
  return {
    name: program.name(),
    version: VERSION,
    description: program.description(),
    commands: Object.fromEntries(program.commands.map((c) => [c.name(), extractSpec(c)])),
  };
}

// --- Execution ---

function output(obj, exitCode = 0) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  process.exit(exitCode);
}

async function execute(command, opts) {
  try {
    const result = await runCommand(command, opts);
    output({ ok: true, data: result });
  } catch (err) {
    const response = { ok: false, error: err.code || 'UNKNOWN_ERROR', message: err.message };
    if (err.hint) response.hint = err.hint;
    if (err.hospitals) response.hospitals = err.hospitals;
    output(response, 1);
  }
}

// Handle --spec
const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--spec')) {
  output({ ok: true, data: generateFullSpec() });
}

program.exitOverride();
program.configureOutput({ writeOut: () => {}, writeErr: () => {} });

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.unknownCommand') {
    const cmd = rawArgs.find((a) => !a.startsWith('-'));
    output({ ok: false, error: 'UNKNOWN_COMMAND', message: `Unknown command: ${cmd}`, hint: 'health-cli --spec' }, 1);
  } else if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0);
  } else {
    output({ ok: false, error: 'INVALID_ARGS', message: err.message, hint: 'health-cli --spec' }, 1);
  }
}

if (!rawArgs.length) {
  output({ ok: false, error: 'MISSING_COMMAND', message: 'No command provided', hint: 'health-cli --spec' }, 1);
}
