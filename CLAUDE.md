# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 목적

**Agent를 위한 병원 진료 기록 조회 CLI 도구.**
AI 에이전트가 lemonhc/mcare 플랫폼을 통해 병원 검사 결과를 조회할 수 있도록 설계된 CLI. 모든 출력은 JSON이다.

## 실행

```bash
node bin/index.js <command> [options]
# 또는
npm start -- <command> [options]
```

전체 커맨드/옵션 스펙 확인:
```bash
node bin/index.js --spec
```

## 주요 흐름

1. `list-hospitals` → 병원 코드 확인
2. `login --hospital-cd <cd> --username <u> --password <p>` → 세션 저장
3. `get-lab-results --patient-id <id>` → 검사 결과 조회

세션은 `~/.viruhealth/sessions/lemonhc-session.json`에 저장된다. 만료 시 refreshToken으로 자동 갱신.

## 구조

```
bin/index.js          # CLI 진입점 (commander)
src/runner.js         # command → provider 라우팅
src/providers/lemonhc/
  index.js            # provider 인터페이스 (login/logout/status/getLabResults 등)
  auth.js             # RSA 암호화 로그인, 토큰 갱신
  apiClient.js        # Bearer 토큰 기반 API 호출
  hospitals.js        # 알려진 병원 목록 (paik 그룹)
src/storage/
  sessionStore.js     # 세션 파일 읽기/쓰기/삭제
```

## 새 provider 추가 시

`src/providers/<name>/index.js`에서 `login / logout / authStatus / getLabResults` 인터페이스를 구현하고, `src/runner.js`의 `getProvider()`에 등록.
