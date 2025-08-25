# Xbowl CLI PRD (Product Requirements Document)

## 📋 프로젝트 개요

### 목적

Xbowl 워크플로우 캔버스에서 설계된 에이전트와 태스크를 Claude Code의 Sub-Agent 및 Slash Command 형식으로 변환하여 터미널 환경에서 활용할 수 있는 CLI 도구 개발

### 핵심 가치 제안

- **설계-실행 연결**: 시각적 워크플로우 설계를 터미널 기반 실행 환경으로 자동 변환
- **실시간 동기화**: DB의 실제 상태와 로컬 사이의 지속적인 동기화 및 검증
- **산출물 관리**: 에이전트 수행 결과(PRD, IA, UserFlow 등)를 체계적으로 수집
- **표준 호환성**: Claude Code 생태계와 완벽 호환되는 형식 제공

## 🎯 기술 분석 결과

### 1. Xbowl 블록 시스템 분석

**현재 블록 타입**:

- `AGENT`: AI 에이전트 (role, identity, focus, core_principles)
- `TASK`: 개별 작업 (instructions)
- `WORKFLOW`: 비즈니스 프로세스
- `DATA`: 데이터 소스
- `CHECKLIST`: 품질 보증 체크리스트
- `ARTIFACT_TEMPLATE`: 문서 템플릿
- `ARTIFACT_CLASS`: 구조화된 아티팩트

**메타데이터 구조**:

```typescript
interface AgentMetadata {
  name: string;
  slug: string;
  description?: string;
  role: string;
  style?: string;
  identity?: string;
  focus?: string;
  core_principles?: string;
}

interface TaskMetadata {
  name: string;
  slug: string;
  description?: string;
  instructions: string;
}
```

### 2. Claude Code 표준 분석

**Sub-Agent 형식**:

```markdown
---
name: agent-slug
description: When this subagent should be invoked
tools: tool1, tool2, tool3
---

System prompt with role and capabilities
```

**Slash Command 형식**:

```markdown
---
allowed-tools: Bash(specific commands)
argument-hint: [optional argument format]
description: Brief command purpose
model: opus/sonnet/haiku
---

Task instructions with $ARGUMENTS placeholder
```

### 3. 경쟁 분석

**유사 프로젝트**: Claude Task Master

- AI 기반 태스크 관리 시스템
- 다중 모델 지원 (Claude, OpenAI, Google, Perplexity)
- MCP (Model Control Protocol) 통합
- PRD 기반 태스크 생성

**시장 동향 (2025)**:

- CLI 기반 코딩 에이전트 급성장
- 터미널 네이티브 AI 도구 선호도 증가
- IDE 통합보다 경량화된 솔루션 선호

## 🏗️ 기술 아키텍처

### 1. 시스템 구성도

```
Xbowl Canvas Blocks → Xbowl CLI → Local Files → Claude Code
     ↓                    ↓              ↓              ↓
Block Metadata    →   Format Conversion → .xbowl/     → .claude/
- Agent Blocks   →   - Sub-Agent MD   → Registry     → agents/
- Task Blocks    →   - Slash Command  → Templates    → commands/
- Data Blocks    →   - Data Files     → Artifacts    → Execution
```

### 2. 핵심 워크플로우

**초기화 프로세스**:

1. `xbowl init` 명령어 실행
2. 현재 디렉토리에 `.xbowl/` 폴더 생성
3. 기본 템플릿 및 설정 파일 생성
4. 원격 DB에서 블록 데이터 pull

**동기화 프로세스**:

1. `xbowl pull` - DB에서 최신 설계 스냅샷 가져오기
2. `xbowl sync` - 로컬에서 Claude Code 파일 생성
3. `xbowl collect` - 산출물을 DB에 업서트
4. `xbowl status` - 현재 상태 및 불일치 보고

**블록 변환 매핑**:

| Xbowl Block    | 변환 결과                 | 파일 위치                                                  |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| AGENT          | Sub-Agent MD              | `.claude/agents/{slug}.md`                                 |
| TASK           | Slash Command MD          | `.claude/commands/{slug}.md`                               |
| DATA           | Data File + Command       | `.xbowl/data/{slug}.*` + `.claude/commands/load-{slug}.md` |
| WORKFLOW       | Multi-Agent Orchestration | `.claude/agents/workflow-{slug}.md`                        |
| ARTIFACT_CLASS | Collection Command        | `.claude/commands/collect-{slug}.md`                       |

### 3. 파일 구조

```
project-root/
├── .xbowl/
│   ├── config.json              # 환경/원격/동기화 정책
│   ├── block-registry.json      # 설계 스냅샷(에이전트/태스크/워크플로우/엣지)
│   ├── state.json               # 머신 상태(체크섬/마지막 동기화 등) [Git ignore]
│   ├── templates/               # Claude 템플릿 오버라이드(필수 문구 포함)
│   │   ├── claude/
│   │   │   ├── agent.md         # Sub-Agent 기본 템플릿
│   │   │   ├── command.md       # Slash Command 기본 템플릿
│   │   │   └── workflow.md      # Workflow Agent 템플릿
│   │   └── data/
│   │       └── load-data.md     # 데이터 로드 명령 템플릿
│   ├── data/                    # 데이터 블록 페이로드
│   ├── artifacts/               # 에이전트 수행 산출물(Artifact Class 인스턴스)
│   │   ├── prd/
│   │   ├── ia/
│   │   └── userflow/
│   ├── sessions/                # 실행 세션 로그/추적 [Git ignore]
│   ├── cache/                   # 캐시 파일 [Git ignore]
│   └── locks/                   # 동시 실행 방지 [Git ignore]
├── .claude/                     # Claude Code 실행 환경
│   ├── agents/                  # Sub-Agent md (생성물)
│   └── commands/                # Slash Command md (생성물)
└── .gitignore                   # .xbowl/state.json, .xbowl/cache/, .xbowl/sessions/ 등
```

## 🔧 구현 계획

### Phase 1: 핵심 구조 (1주)

- [x] CLI 프로젝트 초기화 및 기본 구조
- [x] 기본 명령어 (`init`, `sync`, `status`)
- [ ] 폴더 구조 생성 (`init` 명령)
- [ ] 기본 템플릿 시스템
- [ ] `block-registry.json` 스키마 정의

### Phase 2: 변환 엔진 (2주)

- [ ] Agent → Sub-Agent 변환
- [ ] Task → Slash Command 변환
- [ ] Data → Load Command 변환
- [ ] `sync` 명령 구현
- [ ] 템플릿 시스템 통합

### Phase 3: 동기화 시스템 (2주)

- [ ] `pull` 명령 (DB → 로컬)
- [ ] `collect` 명령 (로컬 → DB)
- [ ] `diff`/`validate` 명령
- [ ] `status` 명령
- [ ] 설정 관리 시스템

### Phase 4: 고급 기능 (1주)

- [ ] Workflow 오케스트레이션
- [ ] Artifact Class 관리
- [ ] 템플릿 커스터마이징
- [ ] CI/CD 통합

## 💡 혁신적 특장점

### 1. 시각적-텍스트 브리지

- 시각적 워크플로우 설계를 텍스트 기반 실행 환경으로 seamless 변환
- 디자이너와 개발자 간 협업 가교 역할

### 2. 실시간 동기화

- DB의 실제 상태와 로컬 파일 간 지속적인 동기화
- 산출물 자동 수집 및 관리

### 3. 표준 호환성

- Claude Code 생태계 완벽 지원
- 기존 터미널 워크플로우와 자연스러운 통합

### 4. 자동화된 설정 관리

- 복잡한 에이전트 설정을 시각적 인터페이스로 단순화
- 블록 기반 재사용 가능한 구성 요소

### 5. 확장성

- 플러그인 아키텍처로 새로운 블록 타입 지원
- 다양한 AI 모델 백엔드 지원

## 📊 예상 효과

### 개발 생산성

- 에이전트 설정 시간 **80% 단축**
- 워크플로우 설정 자동화로 **반복 작업 제거**
- 산출물 관리 자동화로 **품질 향상**

### 사용자 경험

- **시각적 설계 → 실행** 워크플로우 일관성
- **Learning Curve 최소화** (Claude Code 표준 사용)
- **실시간 피드백**으로 즉시 검증 가능

### 생태계 확장

- Claude Code 커뮤니티와의 상호 운용성
- 오픈소스 기여를 통한 생태계 성장

## 🚀 실행 로드맵

### 1단계: MVP 개발 (현재 + 1주)

- [x] 기본 CLI 구조 및 명령어
- [ ] 기본 AGENT, TASK 블록 변환
- [ ] 템플릿 시스템 구현

### 2단계: 동기화 시스템 (+ 2주)

- [ ] DB 연결 및 pull 명령
- [ ] 산출물 수집 및 collect 명령
- [ ] 상태 검증 및 diff 명령

### 3단계: 고도화 (+ 2주)

- [ ] 복합 워크플로우 변환
- [ ] 데이터 블록 통합
- [ ] Artifact Class 관리

### 4단계: 생태계 통합 (+ 1주)

- [ ] CI/CD 통합
- [ ] 커뮤니티 템플릿 저장소
- [ ] 문서화 및 예제

## 🔍 기술적 고려사항

### 보안

- 민감한 데이터 블록 암호화
- API 키 안전한 관리
- 샌드박스 실행 환경

## 🔐 CLI 인증 요구사항

### 목표

- CLI가 웹 백엔드 API에 접근하기 위한 안전한 인증 절차 제공
- 웹에서 사용자 승인을 거친 후, CLI가 1회성 코드로 장기 비밀키를 교환

### 사용자 시나리오

1. 사용자는 `xbowl init` 실행 → 브라우저에서 "CLI 인증" 페이지 자동 오픈
2. 로그인 후 코드 승인 → CLI가 자동으로 비밀키를 수신 및 로컬 저장
3. 이후 모든 CLI API 호출은 헤더로 비밀키 포함, 서버에서 검증 후 처리

### API/백엔드

- `POST /api/cli-auth/start`: 코드 생성, `{ code, verificationUrl, expiresAt }` 반환
- `POST /api/cli-auth/exchange`: 코드 ↔ 비밀키 교환, 1회성 `{ secret, workspaceId, userId }` 반환
- 인증 헬퍼: `requireCliAuth(req)` → 헤더 `x-xbowl-cli-key` 검증, 사용자/워크스페이스 식별

### DB 스키마

- `cli_auth_codes(id, code, user_id, workspace_id, status, expires_at, approved_at, exchanged_at, created_at, updated_at)`
- `cli_secrets(id, user_id, workspace_id, secret_hash, label, last_used_at, revoked_at, created_at, updated_at)`

### 로컬 상태 파일(.xbowl/state.json)

```json
{
  "credentials": {
    "apiBaseUrl": "https://app.xbowl.dev/api",
    "workspaceId": "...",
    "userId": "...",
    "secret": "base64..."
  }
}
```

### 보안

- 코드 TTL 5분, 최대 시도 제한, 교환 후 즉시 무효화
- 비밀키 DB 해시 저장(평문 금지), 재노출 금지, 회수/회전 지원
- 로컬 파일 Git ignore 및 권한 최소화

### 성능

- 대규모 블록 시스템 처리 최적화
- 증분 동기화 지원
- 캐시 전략

### 호환성

- Node.js, Python, Go 등 다양한 런타임 지원
- 크로스 플랫폼 동작 보장
- 버전 관리 및 마이그레이션

## 📝 결론

Xbowl CLI는 시각적 워크플로우 설계와 터미널 기반 실행 환경을 연결하는 혁신적인 도구입니다. Claude Code 생태계의 표준을 준수하면서도 Xbowl의 고유한 블록 시스템의 장점을 최대한 활용하여, 개발자들이 보다 효율적으로 AI 에이전트와 작업할 수 있는 환경을 제공합니다.

본 프로젝트는 단순한 변환 도구를 넘어서, **설계와 실행 사이의 갭을 메우는 브리지 역할**을 수행하며, **실시간 동기화와 산출물 관리**를 통해 향후 AI 기반 개발 도구의 새로운 패러다임을 제시할 것으로 기대됩니다.
