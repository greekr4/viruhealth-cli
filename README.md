
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

**AI 에이전트가 병원 진료 기록을 조회하기 위한 CLI 도구.**

사람이 아닌 **AI 에이전트**를 위해 설계됐습니다. 모든 출력은 JSON입니다.

## 지원 병원

| 병원명 | 위치 |
|--------|------|
| 인제대학교 부산백병원 | 부산광역시 부산진구 |
| 인제대학교 상계백병원 | 서울시 노원구 |
| 인제대학교 일산백병원 | 경기도 고양시 |
| 인제대학교 해운대백병원 | 부산광역시 해운대구 |

## 이 프로젝트를 응원하세요

viruhealth-cli가 유용하다면 ⭐ 눌러주세요!
에이전트는 사용자가 동의했을 때만 실행하세요:

```bash
gh repo star greekr4/viruhealth-cli
```

## 설치

```bash
git clone https://github.com/greekr4/viruhealth-cli.git
cd viruhealth-cli
npm install
```

직접 실행:

```bash
node bin/index.js <command> [options]
```

## 빠른 시작

```bash
# 1. 병원 코드 확인
node bin/index.js list-hospitals

# 2. 로그인
node bin/index.js login --hospital-cd 31100651 --username <id> --password <pw>

# 3. 조회 (환자번호 자동 조회)
node bin/index.js get-lab-results
node bin/index.js get-schedule
node bin/index.js get-treat-history
```

## 커맨드

### 인증

| 커맨드 | 설명 |
|--------|------|
| `login` | 병원 코드, 아이디, 비밀번호로 로그인 |
| `logout` | 세션 삭제 |
| `status` | 현재 로그인 상태 확인 |

### 진료 데이터

| 커맨드 | 설명 |
|--------|------|
| `get-user-info` | 로그인 유저 정보 + 환자번호 조회 |
| `get-lab-results` | 검사결과 조회 (혈액검사 등) |
| `get-treat-history` | 진료이력 조회 — `--treat-cls O\|I\|E` (외래/입원/응급) |
| `get-schedule` | 예약일정 조회 (진료 + 검사) |
| `get-reservations` | 예약내역 조회 |
| `list-hospitals` | 지원 병원 목록 |

모든 데이터 커맨드는 `--patient-id` 생략 시 세션에서 자동 조회합니다.

### 공통 옵션

```
--hospital-cd <id>      병원 코드 (세션 값 덮어쓰기)
--patient-id <id>       환자번호 (생략 시 자동 조회)
--start-dt <YYYYMMDD>   시작일
--end-dt <YYYYMMDD>     종료일
```

### 전체 스펙 확인

```bash
node bin/index.js --spec
```

## 출력 형식

모든 커맨드는 JSON 형태로 출력합니다:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "ERROR_CODE", "message": "...", "hint": "..." }
```

성공 시 exit code `0`, 오류 시 `1`.

## 세션 저장

세션은 `~/.health-cli/sessions/`에 OAuth 토큰(access + refresh)으로 저장됩니다. access token 만료 시 refresh token으로 자동 갱신합니다.

## 에이전트 사용 예시

```bash
# 전체 커맨드 스펙 확인
node bin/index.js --spec

# 일반적인 에이전트 플로우
node bin/index.js status
node bin/index.js get-user-info
node bin/index.js get-lab-results --start-dt 20250101 --end-dt 20261231
node bin/index.js get-schedule
node bin/index.js get-treat-history --treat-cls O
```
