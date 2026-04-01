
<h1 align="center">viruhealth-cli</h1>

<p align="center">
  <a href="https://github.com/greekr4/viruhealth-cli/stargazers"><img src="https://img.shields.io/github/stars/greekr4/viruhealth-cli" alt="GitHub stars"></a>
</p>
<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license"></a>
</p>
<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/한국어-red" alt="Korean"></a>
  <a href="README.en.md"><img src="https://img.shields.io/badge/English-blue" alt="English"></a>
</p>

**AI-agent-optimized CLI for querying personal hospital health records.**

Designed not for humans, but for **AI agents**. All output is machine-readable JSON.

## Supported Hospitals

| Hospital | Location |
|----------|----------|
| Inje University Busan Paik Hospital | Busan |
| Inje University Sanggye Paik Hospital | Seoul |
| Inje University Ilsan Paik Hospital | Gyeonggi |
| Inje University Haeundae Paik Hospital | Busan |

## Support This Project

If viruhealth-cli saves your time, please star the repo!
Agents should only run this when the user explicitly agrees:

```bash
gh repo star greekr4/viruhealth-cli
```

## Installation

```bash
git clone https://github.com/greekr4/viruhealth-cli.git
cd viruhealth-cli
npm install
```

Run directly:

```bash
node bin/index.js <command> [options]
```

## Quick Start

```bash
# 1. Find your hospital code
node bin/index.js list-hospitals

# 2. Login
node bin/index.js login --hospital-cd 31100651 --username <id> --password <pw>

# 3. Query — patient ID is auto-resolved from session
node bin/index.js get-lab-results
node bin/index.js get-schedule
node bin/index.js get-treat-history
```

## Commands

### Auth

| Command | Description |
|---------|-------------|
| `login` | Login with hospital code, username, and password |
| `logout` | Clear session |
| `status` | Check current login state |

### Health Data

| Command | Description |
|---------|-------------|
| `get-user-info` | Logged-in user profile + patient ID |
| `get-lab-results` | Lab test results (CBC, chemistry, etc.) |
| `get-treat-history` | Treatment history — `--treat-cls O\|I\|E` (outpatient/inpatient/ER) |
| `get-schedule` | Upcoming appointments (consultation + tests) |
| `get-reservations` | Reservation history |
| `list-hospitals` | List known hospitals |

All data commands auto-resolve patient ID from session — `--patient-id` is optional.

### Common Options

```
--hospital-cd <id>      Override session hospital code
--patient-id <id>       Override auto-resolved patient ID
--start-dt <YYYYMMDD>   Start date
--end-dt <YYYYMMDD>     End date
```

### Full schema

```bash
node bin/index.js --spec
```

## Output format

All commands output a JSON envelope:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "ERROR_CODE", "message": "...", "hint": "..." }
```

Exit code is `0` on success, `1` on error.

## Session storage

Sessions are persisted at `~/.health-cli/sessions/` as OAuth tokens (access + refresh). The refresh token is used automatically when the access token expires.

## Agent usage

```bash
# Get full command schema for agent context
node bin/index.js --spec

# Typical agent flow
node bin/index.js status
node bin/index.js get-user-info
node bin/index.js get-lab-results --start-dt 20250101 --end-dt 20261231
node bin/index.js get-schedule
node bin/index.js get-treat-history --treat-cls O
```
