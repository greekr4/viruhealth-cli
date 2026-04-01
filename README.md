# viruhealth-cli

> AI-agent-optimized CLI for querying personal hospital health records.

Built for use inside AI agents (Claude Code, MCP tools, etc.) where structured JSON output and zero-interaction flows are required. All output is machine-readable JSON.

## Supported Hospitals

| 병원명 | 위치 |
|--------|------|
| 인제대학교 부산백병원 | 부산광역시 부산진구 |
| 인제대학교 상계백병원 | 서울시 노원구 |
| 인제대학교 일산백병원 | 경기도 고양시 |
| 인제대학교 해운대백병원 | 부산광역시 해운대구 |

## Prerequisites

- Node.js >= 18
- An active account linked to a supported hospital

## Installation

```bash
cd viruhealth-cli
npm install
```

Run directly:

```bash
node bin/index.js <command> [options]
```

Or link globally:

```bash
npm link
viruhealth <command> [options]
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
| `get-treat-history` | Treatment history — `--treat-cls O\|I\|E` (외래/입원/응급) |
| `get-schedule` | Upcoming appointments (진료 + 검사) |
| `get-reservations` | Reservation history |
| `list-hospitals` | List known hospitals |

All data commands auto-resolve patient ID from session — `--patient-id` is optional.

### Options common to all data commands

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
