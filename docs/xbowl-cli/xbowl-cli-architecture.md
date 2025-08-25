# Xbowl CLI 아키텍처 설계

## 🎯 목표 재정의

- **웹 캔버스 → CLI 변환**: 2차원 캔버스에서 설계된 에이전트/태스크/워크플로우를 표준화된 템플릿으로 Claude Code agents/commands로 생성
- **실시간 동기화**: 매 실행 시 DB의 실제 상태(artifact class, data 등)와 로컬 사이의 동기화 검증 및 보정
- **산출물 관리**: 에이전트 수행 결과(PRD, IA, UserFlow 등)를 체계적으로 수집하고 관리

## 📁 제안 폴더 구조

```
project-root/
├── .xbowl/
│   ├── config.json              # 환경/원격/동기화 정책
│   ├── block-registry.json      # 설계 스냅샷(에이전트/태스크/워크플로우/엣지)
│   ├── state.json               # 머신 상태(체크섬/마지막 동기화 등) [Git ignore 권장]
│   ├── templates/               # Claude 템플릿 오버라이드(필수 문구 포함)
│   │   ├── claude/
│   │   │   ├── agent.md         # Sub-Agent 기본 템플릿
│   │   │   ├── command.md       # Slash Command 기본 템플릿
│   │   │   └── workflow.md      # Workflow Agent 템플릿
│   │   └── data/
│   │       └── load-data.md     # 데이터 로드 명령 템플릿
│   ├── data/                    # 데이터 블록 페이로드(대용량은 ignore 권장)
│   │   ├── user-data.json
│   │   └── requirements.md
│   ├── artifacts/               # 에이전트 수행 산출물(Artifact Class 인스턴스)
│   │   ├── prd/
│   │   │   ├── feature-a.md
│   │   │   └── feature-b.md
│   │   ├── ia/
│   │   └── userflow/
│   ├── sessions/                # 실행 세션 로그/추적 [ignore 권장]
│   ├── cache/                   # 캐시 파일 [ignore 권장]
│   └── locks/                   # 동시 실행 방지 [ignore 권장]
├── .claude/                     # Claude Code 실행 환경
│   ├── agents/                  # Sub-Agent md (생성물)
│   │   ├── po-agent.md
│   │   ├── ux-designer.md
│   │   └── workflow-coordinator.md
│   └── commands/                # Slash Command md (생성물)
│       ├── analyze-requirements.md
│       ├── create-wireframe.md
│       └── load-user-data.md
└── .gitignore                   # .xbowl/state.json, .xbowl/cache/, .xbowl/sessions/ 등
```

### 구조 설계 원칙

- **로컬 구성(.xbowl)과 실행 산출물(.claude) 분리**
- **스냅샷(block-registry.json)과 머신 상태(state.json) 분리**로 Git 충돌/잡음 최소화
- **템플릿을 버전 관리**하면서 "필수 문구"를 유연하게 강제 가능
- **대용량 데이터와 임시 파일은 Git ignore**로 저장소 크기 관리

## 📋 메타데이터 설계

### 1. block-registry.json: "설계 스냅샷"이자 코드 생성 소스

```json
{
  "version": "1",
  "workspace": {
    "id": "uuid",
    "name": "Team A"
  },
  "updatedAt": "2025-08-08T00:00:00Z",
  "blocks": [
    {
      "id": "uuid",
      "block_type": "agent|task|workflow|data|checklist|artifact_template|artifact_class",
      "slug": "po-agent",
      "name": "PO Agent",
      "metadata": {
        "name": "PO Agent",
        "slug": "po-agent",
        "description": "Product Owner Agent",
        "role": "Product Owner responsible for...",
        "identity": "Experienced PO with 5+ years...",
        "focus": "User needs, business value, and technical feasibility",
        "core_principles": "User-centric design, data-driven decisions..."
      },
      "checksum": "sha256:...",
      "updatedAt": "2025-08-08T00:00:00Z",
      "source": "db|local",
      "version": 3
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "edge_type": "contains|next|input|output|accesses|used_by",
      "source_block_id": "uuid",
      "target_block_id": "uuid",
      "metadata": {}
    }
  ]
}
```

### 2. config.json: 환경/원격/동기화 정책

```json
{
  "$schema": "https://schema.xbowl.dev/config",
  "version": "1",
  "workspace": {
    "id": "uuid",
    "name": "Team A"
  },
  "remote": {
    "apiBaseUrl": "https://app.xbowl.dev/api",
    "auth": {
      "method": "clerk",
      "tokenEnv": "CLERK_API_KEY"
    }
  },
  "sync": {
    "trackGenerated": true,
    "commitGenerated": true,
    "include": ["agents", "tasks", "workflows", "data", "artifact_class"],
    "exclude": []
  },
  "paths": {
    "claudeAgents": ".claude/agents",
    "claudeCommands": ".claude/commands",
    "data": ".xbowl/data",
    "artifacts": ".xbowl/artifacts",
    "templates": ".xbowl/templates"
  },
  "templates": {
    "requiredPhrases": [
      "Always consider user needs first",
      "Validate assumptions with data",
      "Document decisions and rationale"
    ],
    "securityWarnings": [
      "Never expose sensitive data in outputs",
      "Validate all user inputs",
      "Use secure practices for file operations"
    ]
  }
}
```

### 3. state.json: 증분 동기화를 위한 머신 상태(Commit X)

```json
{
  "lastSyncAt": "2025-08-08T00:00:00Z",
  "fileMap": {
    "blockId-uuid": {
      "agentFile": ".claude/agents/po-agent.md",
      "commandFile": null,
      "dataFile": null,
      "lastChecksum": "sha256:...",
      "lastGeneratedAt": "2025-08-08T00:00:00Z"
    }
  },
  "remote": {
    "workspaceEtag": "W/\"abcdef\""
  }
}
```

## 🔄 동기화 전략

### 소스 오브 트루스

- **설계(에이전트/태스크/워크플로우/엣지)**: DB가 1차, `block-registry.json`은 로컬 스냅샷
- **산출물(artifact class 인스턴스, data 파일)**: 로컬 생성 → DB 반영(push) or DB → 로컬 pull

### 명령어 흐름

| 명령어     | 기능        | 설명                                                                               |
| ---------- | ----------- | ---------------------------------------------------------------------------------- |
| `init`     | 초기화      | 디렉토리/기본 파일 생성                                                            |
| `pull`     | 원격 동기화 | DB → `block-registry.json` 동기화, `state.json` 반영, diff 요약                    |
| `sync`     | 로컬 생성   | `block-registry.json` → `.claude/*`/`.xbowl/data` 생성(필수 문구 포함 템플릿 반영) |
| `status`   | 상태 보고   | 설계 수/생성물 수/불일치 보고                                                      |
| `diff`     | 차이 분석   | 로컬 스냅샷 vs 원격 DB 차이 보고                                                   |
| `validate` | 유효성 검사 | slug 규칙/필수 메타데이터/참조 무결성 검사                                         |
| `collect`  | 산출물 수집 | `.xbowl/artifacts/**` 스캔 → DB에 artifact class 인스턴스 업서트                   |
| `doctor`   | 진단        | 토큰/권한/네트워크 점검                                                            |

### 불일치 검증 포인트

- **설계**: 블록 존재/체크섬 비교
- **산출물**: 정의된 artifact class 대비 인스턴스 존재/스키마 적합성(zod)/개수/최신성
- **데이터**: `data/` 파일 해시와 DB 메타데이터 일치 여부

## 🔐 CLI 인증 설계 (Web ↔ CLI)

### 목표

- CLI가 안전하게 웹 백엔드 API에 접근할 수 있도록 단순·안전한 인증 흐름 제공
- 사용자(Web) → CLI 권한 위임: 일회용 인증 코드 + 장기 비밀키 발급
- 비밀키는 로컬에 저장(.xbowl/state.json)되고 모든 CLI API 요청에 포함됨

### 구성요소

- 웹앱 UI: `/(auth)/cli` 인증 페이지(코드 입력/승인) + 성공 페이지
- Next.js 15 API Routes: `/api/cli-auth/start`, `/api/cli-auth/exchange`, (내부) `/api/cli-auth/complete`
- DB 스키마(Drizzle):
  - `cli_auth_codes`
    - `id` (uuid, pk)
    - `code` (varchar, unique): 6~8자 대문자/숫자
    - `user_id` (uuid, nullable until 승인)
    - `workspace_id` (uuid, nullable)
    - `status` (enum: pending|approved|exchanged|expired|revoked)
    - `expires_at` (timestamptz)
    - `approved_at` (timestamptz, nullable)
    - `exchanged_at` (timestamptz, nullable)
    - `created_at`/`updated_at`
  - `cli_secrets`
    - `id` (uuid, pk)
    - `user_id` (uuid)
    - `workspace_id` (uuid)
    - `secret_hash` (varchar): `sha256(salt + secret)`
    - `label` (varchar, optional)
    - `last_used_at` (timestamptz, nullable)
    - `revoked_at` (timestamptz, nullable)
    - `created_at`/`updated_at`

### 헤더 규격

- CLI → API 모든 요청에 헤더 포함: `x-xbowl-cli-key: <secret>`
- 대안: `Authorization: Bearer <secret>` (충돌 방지를 위해 커스텀 헤더 권장)

### 시퀀스 (브라우저 연동/자동 폴링)

1. CLI `init` 실행 → 서버에 Start 요청
   - `POST /api/cli-auth/start`
   - 입력: `{ client: "@xbowl/cli", version, workspaceId? }`
   - 반환: `{ code, verificationUrl, expiresAt }`
2. CLI는 기본 브라우저로 `verificationUrl` 오픈(또는 URL 출력)
3. 사용자는 웹 로그인(Clerk) 후 `/(auth)/cli`에서 코드 승인
   - 승인 시 서버가:
     - `cli_auth_codes.status = approved`
     - 비밀키(랜덤 32바이트 Base64) 생성 → `cli_secrets.secret_hash`로 저장
     - 코드와 비밀키를 내부적으로 링크(코드 row에 secret_id 참조 또는 임시 저장)
4. CLI는 `code`로 교환 폴링
   - `POST /api/cli-auth/exchange` `{ code }`
   - 조건: status=approved, 미교환, 미만료
   - 응답: `{ secret, workspaceId, userId }` (단 1회 노출) → 즉시 `status=exchanged`
5. CLI는 수신한 `secret`을 로컬 저장
   - 파일: `.xbowl/state.json` (Git ignore 권장)
   - 예시 구조:
   ```json
   {
     "lastSyncAt": null,
     "credentials": {
       "apiBaseUrl": "https://app.xbowl.dev/api",
       "workspaceId": "...",
       "userId": "...",
       "secret": "base64..."
     }
   }
   ```
6. 이후 CLI 모든 API 호출 시 헤더 포함: `x-xbowl-cli-key`
7. API Route 인증 미들웨어/헬퍼가 검증 후 처리

### API 설계 상세

- `POST /api/cli-auth/start`
  - 200: `{ code, verificationUrl, expiresAt }`
  - 400/429: 생성 제한 또는 요청 형식 오류
- `POST /api/cli-auth/exchange`
  - 입력: `{ code }`
  - 200: `{ secret, workspaceId, userId }` (1회성)
  - 400/410: 코드 미승인/만료/이미 교환됨

### 인증 헬퍼 (서버)

- 함수: `requireCliAuth(req)`
  - 헤더 추출: `x-xbowl-cli-key`
  - `sha256(salt + secret)` 후 `cli_secrets.secret_hash` 매칭
  - `revoked_at` null 확인, rate-limit, last_used_at 갱신
  - 성공 시 `{ userId, workspaceId }` 반환

### 보안 고려

- 코드 TTL: 5분, 시도 횟수 제한(예: 10회)
- 비밀키는 평문 DB 저장 금지(해시만 저장)
- 비밀키는 서버/웹 UI에서 재노출 금지(교환 1회 후 폐기)
- 로컬 저장 파일은 Git ignore + 최소 권한
- 비밀키 회수/재발급(추후 `/api/cli-auth/revoke`, `/api/cli-auth/rotate`)

### 실패/예외 플로우

- 코드 만료: 웹 UI와 CLI에 만료 메시지, 재생성 유도
- 중복 교환 시도: 410 Gone
- 잘못된 헤더: 401 Unauthorized

### UX 노트

- CLI: 브라우저 자동 오픈 실패 시 URL 복사 출력
- 웹: 승인 완료 시 "CLI로 돌아가세요" 안내 및 성공 체크 표시(폴링 중이라고 안내)

## 🎨 Claude 템플릿과 "필수 문구"

### 템플릿 구조

```
.xbowl/templates/
├── claude/
│   ├── agent.md          # Sub-Agent 기본 템플릿
│   ├── command.md        # Slash Command 기본 템플릿
│   ├── workflow.md       # Workflow Agent 템플릿
│   └── data-load.md      # 데이터 로드 명령 템플릿
└── data/
    └── load-data.md      # 데이터 로드 명령 템플릿
```

### 템플릿 예시

#### agent.md (Sub-Agent 템플릿)

```markdown
---
name: { { slug } }
description: { { description } }
tools: Bash
---

{{role}}

{{#if identity}}
Identity: {{identity}}
{{/if}}

{{#if focus}}
Focus: {{focus}}
{{/if}}

{{#if core_principles}}
Core Principles:
{{core_principles}}
{{/if}}

{{#each requiredPhrases}}
{{this}}
{{/each}}

{{#each securityWarnings}}
⚠️ {{this}}
{{/each}}
```

#### command.md (Slash Command 템플릿)

```markdown
---
allowed-tools: Bash
argument-hint: [args]
description: { { description } }
model: sonnet
---

{{instructions}}

{{#each requiredPhrases}}
{{this}}
{{/each}}

{{#each securityWarnings}}
⚠️ {{this}}
{{/each}}
```

### 장점

- **정책 변경 시 템플릿만 갱신**하면 전체 재생성 가능
- **프로젝트별 필수 문구**를 템플릿에 포함하여 일관성 보장
- **CLI `sync` 시 템플릿 + 블록 메타데이터로 합성 생성**

## 🔗 Git/GitHub 운영

### 커밋 권장

- `.xbowl/config.json`, `.xbowl/block-registry.json`, `.xbowl/templates/**`
- `.claude/agents/**`, `.claude/commands/**`(실사용/리뷰/PR diff 가시성 ↑)

### ignore 권장

- `.xbowl/state.json`, `.xbowl/cache/**`, `.xbowl/locks/**`, `.xbowl/sessions/**`
- `.xbowl/data/**`(대용량이면), 필요 시 샘플만 커밋
- 대규모 산출물 `.xbowl/artifacts/**`는 정책에 따라 선택 커밋

### CI/CD

- PR 시 `pnpm -w build --filter @xbowl/cli && node apps/xbowl-cli/dist/index.js sync --dry-run --check`(미반영 생성물 있으면 fail)
- `validate`/`diff`로 스키마/동기화 검사 → 규칙 어긴 slug/필드 PR 차단

## 🌐 DB/웹과의 연결 방식

### 선호 방식: REST/GraphQL "export endpoints"

- `GET /api/workspaces/{id}/export/registry` → `block-registry.json` 모양
- `GET /api/workspaces/{id}/artifacts?class=...` → 현황
- Clerk 인증 헤더로 접근

### 비권장: CLI에서 DB 직접 접근

- 보안/네트워킹/드라이버 이슈
- 증분: ETag/If-None-Match로 변경만 pull

## 📏 네이밍/제약 통일

- **slug 정규식**: DB 제약(`^[a-z0-9가-힣-]+$`)과 동일 적용
- **필수 필드**: `block-definition-policy.ts` 타입 가드와 동일하게 CLI zod 검증
- **워크플로우 오케스트레이션**: edges `contains/next/input/output/...` 포함하면, workflow-\* agent에 반영(점진 확장)

## 📦 아티팩트/데이터 동기화

### 에이전트 수행 결과 관리

- 에이전트 수행 결과는 `.xbowl/artifacts/{class}/{slug}.md|json`으로 저장
- `collect` 명령으로 DB 업서트(필드/스키마 검증 후)
- 데이터 블록은 `.xbowl/data/*`로 관리하며, 필요 시 `load-*` command 자동 생성

### 산출물 예시

```
.xbowl/artifacts/
├── prd/
│   ├── feature-a.md          # PO Agent 산출물
│   └── feature-b.md
├── ia/
│   └── user-interface.md     # UX Designer 산출물
└── userflow/
    └── onboarding-flow.md    # UserFlow 산출물
```

## 🚀 구현 우선순위

### Phase 1: 핵심 구조 (1주)

- [ ] 폴더 구조 생성 (`init` 명령)
- [ ] 기본 템플릿 시스템
- [ ] `block-registry.json` 스키마 정의

### Phase 2: 변환 엔진 (2주)

- [ ] Agent → Sub-Agent 변환
- [ ] Task → Slash Command 변환
- [ ] Data → Load Command 변환
- [ ] `sync` 명령 구현

### Phase 3: 동기화 시스템 (2주)

- [ ] `pull` 명령 (DB → 로컬)
- [ ] `collect` 명령 (로컬 → DB)
- [ ] `diff`/`validate` 명령
- [ ] `status` 명령

### Phase 4: 고급 기능 (1주)

- [ ] Workflow 오케스트레이션
- [ ] Artifact Class 관리
- [ ] 템플릿 커스터마이징
- [ ] CI/CD 통합

## 📝 결론

이 아키텍처는 **설계와 실행 사이의 갭을 메우는 브리지 역할**을 수행하며, 시각적 워크플로우 설계를 터미널 기반 실행 환경으로 seamless하게 변환합니다.

핵심은 **표준화된 템플릿 시스템**과 **실시간 동기화 메커니즘**을 통해, 개발자들이 보다 효율적으로 AI 에이전트와 작업할 수 있는 환경을 제공하는 것입니다.
