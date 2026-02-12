# Sophie Agent 구현 계획

> Architecture.md의 아키텍처를 단계적으로 구현하기 위한 실행 계획.
> 핵심 원칙: **서브 에이전트가 없어도 메인 에이전트가 모든 작업을 수행할 수 있어야 한다.**

---

## 현재 상태 (Baseline)

### 구현 완료
- `/api/agent/v2/route.ts`: xAI Grok 모델 기반 스트리밍 에이전트, 동적 컨텍스트 주입
- `/api/agent/v2/context-builder.ts`: 동적 컨텍스트 조립 (visibleBlocks, selectedBlockIds 등)
- `/api/agent/v2/prompt.ts`: 정적 시스템 프롬프트 (캐싱 대상) + Tool 사용법
- `/api/agent/v2/tools.ts`: web_search, x_search(xAI 네이티브), renderCanvasdown, patchCanvasdown, **grepBlockContent**, **globBlocks**, **readBlockLines** 등록
- **Step 1-5 완료**: 블록 검색/읽기 — grepBlockContent, globBlocks, readBlockLines 서버사이드 구현 (ai-management 도메인). **소스 도메인 연동**: content_raw 외에 연결된 소스의 추출 본문(source_content), AI 요약(source_summary) 검색·읽기 지원.

### 현재 한계
- (Phase 1 미완료) editBlockLines, hopSearch/searchGroup/searchBySemantic, organizeLayout, createTodos, canvasAction, activeJobs/recentEvents 등 미구현
- 메인 에이전트가 서브에이전트 없이 핵심 작업 수행 가능한 상태까지는 Step 1-5까지 도달

---

## 구현 순서 총괄

```
Phase 1: 메인 에이전트 단독 구동        ← Block, Tool(Global), Context Layer, Canvasdown, Main Agent
  └─ 메인 에이전트가 서브에이전트·앱 없이 모든 핵심 작업을 수행할 수 있는 상태

Phase 2: 기본 서브 에이전트 추가        ← Sub Agent, Skill, Block Tool
  └─ 컨텍스트 분리를 통한 성능 최적화 (필수 인프라)

Phase 3: 기본 앱 연동                   ← App, App Tool
  └─ SSOTA 기본 제공 앱을 메인 에이전트·서브 에이전트가 조작

Phase 4: 커스텀 서브 에이전트 프레임워크  ← 스코프 위계, 사용자 정의 Skill/Tool 조합
  └─ 사용자가 직접 서브 에이전트를 정의하여 업무 자동화 (앱과 연동한 반복 작업 표준화 포함)

Phase 5: 커스텀 앱                      ← Custom Block, 커뮤니티 앱 개발
  └─ 사용자/커뮤니티가 직접 앱을 만들고, 커스텀 블록을 정의
```

---

## Phase 1: 메인 에이전트 단독 구동

> 목표: 서브 에이전트 없이 메인 에이전트만으로 캔버스의 모든 핵심 작업을 수행할 수 있는 상태.
> 이 Phase가 완료되면, 서브 에이전트는 순수하게 "성능 최적화 옵션"이 된다.

### Phase 1에서 다루는 개념

이 Phase에서는 에이전트 시스템의 **기초 개념**을 구현한다. 아직 서브 에이전트, 스킬, 앱은 등장하지 않는다.

#### Block (블록)

캔버스 위에 배치되는 **데이터의 최소 단위**. 저장하는 데이터의 타입에 따라 구분된다.

```
블록 분류:
├── 링크: 웹, 유튜브, X(트위터), 스레드
├── 문서: 마크다운, 독스, DOCX, 노션, 슬라이드, 시트
├── PDF: 이미지 PDF, 텍스트 PDF
├── 코드: 리액트 프리뷰, 디자인 컴포넌트, 파이썬 샌드박스
├── 데이터: 수치해석, 분석, 그래프
└── 미디어: 이미지, 비디오, 오디오, 3D
```

- 각 블록은 `blockMountId`로 식별된다 (하나의 블록이 여러 페이지에 마운트 가능).
- 블록은 **Read-Only**(유튜브, 링크 등)와 **Editable**(마크다운, 코드 등)로 나뉜다.
- 블록은 엣지(Edge)로 서로 연결되어 의미적 관계를 표현한다.

#### Main Agent (메인 에이전트)

사용자의 요청을 받아 **전체 작업 흐름을 조율(Orchestration)하는 중앙 에이전트**.

핵심 원칙:
1. **범용성**: 서브 에이전트 없이도 **모든 작업**을 수행할 수 있어야 한다.
2. **조율**: (Phase 2 이후) 적절한 서브 에이전트에 작업을 위임하여 효율을 높인다.
3. **컨텍스트 보존**: 무거운 작업은 서브 에이전트에 위임하여 메인의 컨텍스트를 보존한다.

> Phase 1에서는 원칙 1번(범용성)에 집중한다. 메인 에이전트가 모든 Tool을 직접 사용한다.

#### Tool (도구) — Global Tool 분류

Tool은 에이전트가 **세상과 상호작용할 수 있는 능력**이다.

Phase 1에서는 **Global Tool**만 다룬다. 전체 Tool 4계층은 다음과 같다:

| 분류 | 범위 | 설명 | Phase 1 해당 여부 |
|------|------|------|-----------------|
| **Global Tool** | 전역 | 어디서든 사용 가능한 기본 도구 | **Phase 1에서 구현** |
| **Block Tool** | 블록 단위 | 기존 블록의 데이터를 조회/조작 | Phase 2에서 서브에이전트와 함께 |
| **Sub Agent** | 위임 단위 | 서브 에이전트도 Tool처럼 호출 가능 | Phase 2에서 구현 |
| **App Tool** | 앱 단위 | 앱을 직접 조작하는 도구 | Phase 3에서 기본 앱과 함께 |

Global Tool은 코드로 정의되며, Zod Schema로 입력을 검증한다.
실행 위치에 따라 **Server-side**(DB 접근, 외부 API)와 **Client-side**(DOM 조작, React Flow 업데이트)로 나뉜다.

#### Context Layer (컨텍스트 레이어)

에이전트가 매 요청마다 참조하는 **상황 정보의 계층 구조**. 두 가지로 분리된다:

| 종류 | 위치 | 특징 | 예시 |
|------|------|------|------|
| **정적 컨텍스트** | system prompt | 변하지 않음, 프롬프트 캐싱 대상 (비용 90% 절감) | Sophie 캐릭터, Tool 사용법, 작업 규칙 |
| **동적 컨텍스트** | user message metadata | 매 요청 갱신 | viewport 블록, 선택 블록, 활성 작업 상태, **이벤트 컨텍스트(recentEvents)**. (향후: 마우스, 음성 시간축) |

> 정적/동적 분리는 **프롬프트 캐싱 최적화**의 핵심이다.
> system prompt가 변하지 않으면 OpenAI의 prefix match 기반 캐싱이 항상 히트한다.

#### Canvasdown

캔버스 조작을 위한 **자체 DSL(Domain-Specific Language)**. 기존 5개 개별 도구를 하나의 선언적 언어로 통일한다.

| 모드 | 용도 | 예시 |
|------|------|------|
| **Full DSL** | 신규 블록 생성 + 레이아웃 + 엣지 | `canvas LR` + `@markdown r1 "제목" { content: "..." }` |
| **Patch DSL** | 기존 블록 수정/삭제/연결/이동 | `@update <id> { title: "..." }`, `@connect a -> b` |

핵심 가치:
- **툴콜 횟수 감소**: 블록 3개 생성 + 연결 = 기존 4~6회 → **1회**
- **비주얼 임팩트**: "한 번에 쫙 깔리는" 느낌

---

### Phase 1 원칙

1. **메인 에이전트 = 만능**: 검색, 캔버스 조작, 블록 읽기/쓰기, 레이아웃 등 모든 것을 직접 수행
2. **컨텍스트 레이어 점진적 확장**: 정적 → 동적 컨텍스트를 하나씩 추가
3. **Tool 점진적 확장**: Global Tool → Block Tool 순서로 추가
4. **프롬프트 캐싱 구조**: 처음부터 정적/동적 컨텍스트 분리 설계

---

### Step 1-1. 프롬프트 캐싱 구조 분리

**목적**: system prompt(정적)와 user message metadata(동적)를 분리하여, 이후 컨텍스트 추가 시 캐싱 효율을 보장.

**현재**: `SOPHI_V2_SYSTEM_PROMPT` 하나에 모든 것이 혼재
**목표**: 정적/동적 분리 구조 확립

```
변경 파일:
├── prompt.ts
│   └── 정적 system prompt 재구조화
│       ├── Sophie 캐릭터/성격
│       ├── SSOTA 핵심 개념 (Block, Edge, Canvas)
│       ├── Tool 사용법 (스키마별 규칙)
│       └── 작업 규칙 (커뮤니케이션, 에러 핸들링)
├── route.ts
│   └── user message에 동적 컨텍스트 주입 구조 추가
│       └── clientContext를 metadata로 파싱하여 전달
└── context-builder.ts (신규)
    └── 동적 컨텍스트 조립 함수
        └── 초기: 빈 컨텍스트 → Step별로 필드 추가
```

**정적 컨텍스트 (system prompt — 캐싱 대상)**:
| 항목 | 설명 |
|------|------|
| Sophie 캐릭터 | 성격, 말투, 규칙 |
| SSOTA 핵심 개념 | Block, Edge, Canvas, Page, Workspace |
| Tool 사용법 | 각 Tool의 스키마와 사용 규칙 |
| 작업 규칙 | 커뮤니케이션, 에러 핸들링, 언어 매칭 |

**동적 컨텍스트 (user message metadata — 매 요청 갱신)**:
| 항목 | 추가 시점 |
|------|----------|
| `selectedBlockIds` | Step 1-2 |
| `visibleBlocks` (메타데이터만) | Step 1-2 |
| `activeJobs` | Step 1-12 |
| `recentEvents` (이벤트 컨텍스트) | Step 1-13 |
| `defaultSubAgents` (기본 서브에이전트, **항상 포함**) | Phase 2 |
| `installedApps` (기본 앱, 메타데이터만) | Phase 3 |
| `userSubAgents` (사용자 추가 서브에이전트, 메타데이터만) | Phase 4 |
| `mouseContext` | **(향후 계획)** 호버/클릭된 블록 정보 |
| `voiceTimelineBlocks` | **(향후 계획)** 음성 입력 중 시간순 언급 블록, 대명사 해석 |

**완료 조건**: route.ts에서 clientContext를 user message metadata로 전달하는 구조가 동작.

---

### Step 1-2. 기본 컨텍스트 레이어 (Viewport + 선택 블록)

**목적**: 에이전트가 "지금 캔버스에 뭐가 있는지" 알 수 있게 한다.

```
변경/신규 파일:
├── context-builder.ts
│   └── + visibleBlocks: 현재 viewport에 보이는 블록들의 메타데이터 (연결 관계 포함)
│   └── + selectedBlockIds: 현재 선택된 블록 ID 목록
├── route.ts
│   └── clientContext에서 visibleBlocks, selectedBlockIds 파싱
├── prompt.ts
│   └── + 컨텍스트 해석 규칙 추가
│       └── "이 블록" = selectedBlockIds[0]
│       └── visibleBlocks에 메타데이터만 포함됨을 명시
│       └── visibleBlocks 내 연결(connectedTo/edges)로 viewport 내 관계 파악 가능
```

**Viewport 블록 메타데이터 형식**:
```typescript
interface VisibleBlockMeta {
  blockMountId: string;
  blockType: string;   // "markdown" | "youtube" | "link" | ...
  title: string;
  // content는 포함하지 않음 — 필요 시 read로 조회
  /** 이 블록에서 나가는 엣지로 연결된 블록 ID 목록 (viewports 내 한정 권장) */
  connectedTo?: string[];  // 또는 edges: { targetId, label? }[]
}

// viewport 전체의 연결 관계만 따로 넘길 수도 있음
interface VisibleEdgesMeta {
  sourceBlockMountId: string;
  targetBlockMountId: string;
  label?: string;
}
```
에이전트가 "이 블록이 뭐랑 연결돼 있어?"를 메타데이터만으로 파악할 수 있으면, hop 검색 전에 맥락을 더 잘 이해할 수 있다.

**프롬프트에 추가할 해석 규칙**:
```
## Context Interpretation
- visibleBlocks: 현재 화면에 보이는 블록들의 메타데이터 (content 미포함). 블록 간 연결(connectedTo 등) 포함.
- selectedBlockIds: 현재 선택된 블록 ID 목록
- "이 블록", "이거" → selectedBlockIds[0] 참조
- viewport 내 "어떤 블록이 뭐랑 연결돼 있어?"는 visibleBlocks의 연결 정보로 파악 가능. 상세/전체 그래프는 hopSearch로 조회.
- 블록의 상세 내용이 필요하면 readBlockLines로 조회하라
```

**완료 조건**: 에이전트가 "지금 캔버스에 뭐가 보여?" 질문에 viewport 블록 목록으로 답변 가능.

---

### Step 1-3. Global Tool — 웹 검색 (메인 에이전트 직접 수행)

**목적**: 메인 에이전트가 웹/X 검색을 직접 수행할 수 있게 한다. **커스텀 툴 정의 없이** xAI 네이티브 도구를 사용한다.

**목표**: 메인 에이전트의 tools에 xAI `webSearch` + `xSearch` 등록.

```
변경 파일:
├── route.ts
│   └── tools에 xai.tools.webSearch(), xai.tools.xSearch() 등록 (provider 네이티브 도구)
├── prompt.ts
│   └── + 웹/X 검색 사용 규칙 추가 (언제 webSearch vs xSearch 쓸지 등)
```

**구현**: xAI SDK의 **네이티브 도구**를 그대로 사용. 커스텀 툴 스키마/핸들러 없음.

```typescript
// route.ts 예시
import { xai } from '@ai-sdk/xai';

const result = streamText({
  model: xai.responses('grok-...'),
  tools: {
    web_search: xai.tools.webSearch(),
    x_search: xai.tools.xSearch(),
    // ... 다른 커스텀 툴
  },
});
```

**완료 조건**: 메인 에이전트가 웹 검색 및 X 검색을 직접 수행하고 결과를 텍스트로 응답.

---

### Step 1-4. Global Tool — Canvasdown (캔버스 조작): Full / Patch 두 도구

**목적**: 에이전트가 캔버스에 블록을 생성/수정/연결/이동할 수 있게 한다.
**Full 모드**와 **Patch 모드**를 **도구 2개**로 분리한다.

```
변경/신규 파일:
├── tools.ts
│   └── + renderCanvasdownTool (Full 전용, 클라이언트사이드)
│   └── + patchCanvasdownTool (Patch 전용, 클라이언트사이드)
├── route.ts
│   └── tools에 renderCanvasdown, patchCanvasdown 등록
├── prompt.ts
│   └── + Canvasdown DSL 문법
│       ├── renderCanvasdown → Full DSL (블록 생성 + 레이아웃 + 엣지)
│       └── patchCanvasdown → Patch DSL (수정, 삭제, 연결, 이동, 리사이즈)
└── 클라이언트:
    └── tool-handlers.ts
        └── + renderCanvasdown 핸들러 (Full, CanvasdownExecutor 연동)
        └── + patchCanvasdown 핸들러 (Patch, applyPatch 연동)
```

**Tool 스키마**:
```typescript
// 신규 블록 생성 + 레이아웃 + 엣지 (Full DSL)
renderCanvasdownTool = {
  description: '캔버스에 새 블록을 생성하고 레이아웃·엣지를 한 번에 배치. Full DSL만 사용.',
  inputSchema: z.object({
    dsl: z.string().describe('Canvasdown Full DSL 문자열'),
    anchorBlockMountId: z.string().optional(),
    position: z.enum(['right', 'below']).default('right').optional(),
  }),
};

// 기존 블록 수정/삭제/연결/이동/리사이즈 (Patch DSL)
patchCanvasdownTool = {
  description: '이미 존재하는 블록을 수정·삭제·연결·이동·리사이즈. Patch DSL만 사용.',
  inputSchema: z.object({
    dsl: z.string().describe('Canvasdown Patch DSL 문자열 (@update, @delete, @connect, @move, @resize 등)'),
  }),
}
```

**이 Step의 중요성**: 두 도구가 기존 5개 개별 도구(addBlocks, updateTitle, updateContent, updateProperties, connectBlocks)를 대체하는 **캔버스 조작 인터페이스**다. 에이전트가 "세상에 영향을 끼치는" 가장 중요한 도구.

**완료 조건**:
- "마크다운 블록 3개 만들어줘" → `renderCanvasdown`(Full DSL)로 3개 블록 한 번에 배치.
- "이 블록 제목 바꿔줘" / "이 둘 연결해줘" → `patchCanvasdown`(Patch DSL)로 수정.

---

### Step 1-5. Global Tool — 블록 검색/읽기 (grep + glob + read) — **구현 완료**

**목적**: 에이전트가 캔버스의 블록 내용을 검색하고 읽을 수 있게 한다.

#### 구현 완료 및 계획 대비 변경 사항

- **구현 위치**: 실행기는 `api/agent/v2/route.ts`에서 blockSearchRepo 주입 후 호출. 실제 로직은 **ai-management 도메인** (`repositories/interfaces/block-search.repository.interface.ts`, `repositories/implementations/drizzle-block-search.repository.ts`, `services/tools/*.service.ts`)에 구현됨. `api/agent/v2/tool-executors/` 디렉터리는 사용하지 않음.
- **소스 도메인 연동**: 블록 본문(content_raw)뿐 아니라 **연결된 소스(source-management)** 의 추출 본문·AI 요약을 검색·읽기 대상에 포함했다.
  - **grepBlockContent**: `sources` 옵션으로 `content_raw`(기본), `source_content`(sources.raw_content, e.g. 유튜브 스크립트), `source_summary`(source_summaries.summary) 중 선택 검색. `summaryLanguages`로 요약 언어 필터. 각 매칭에 `source` 필드 부여.
  - **globBlocks**: 제목 다중 패턴 지원. `query`를 `string | string[]`로, `queryMatchMode`로 `'any'`(OR) / `'all'`(AND). 메타데이터만 검색(소스 필터 없음).
  - **readBlockLines**: `source` 옵션으로 `content_raw`(기본), `source_content`, `source_summary` 중 하나를 라인 범위로 읽기. `source_summary` 시 `summaryLanguage`로 언어 지정 가능. 응답에 `source`, `summaryLanguage` 포함.
- **Repository**: 단일 블록용 `findSourceContentByBlockMountId`, `findSourceSummaryByBlockMountId` 추가. 기존 `findBySourceContentPattern`, `findBySourceSummaryPattern`과 함께 소스 도메인(sources, source_summaries) 조회.

#### 터미널 grep과의 비교

`grepBlockContent`는 "캔버스 블록용 grep"이다. 핵심 개념(패턴 검색 + 라인 단위 + 주변 N줄 컨텍스트)은 터미널 grep과 동일하지만, 검색 대상과 스코프 지정 방식이 다르다.

| | 터미널 `grep` | `grepBlockContent` |
|------|---------------|---------------------|
| **검색 대상** | 파일 시스템의 파일 | DB의 `blocks.content_raw` 및 (옵션) `sources.raw_content`, `source_summaries.summary` |
| **대상 지정** | 파일 경로/glob (`grep "x" src/*.ts`) | 블록 ID, 블록 타입, **페이지/워크스페이스** 스코프 |
| **패턴** | `pattern` (regex) | `pattern` (동일) |
| **주변 컨텍스트** | `-C 3` (앞뒤 3줄) | `contextLines: 3` (동일 개념) |
| **출력** | `파일경로:줄번호:내용` | `blockMountId + 줄번호 + 내용` |
| **재귀 탐색** | `-r` (디렉터리 재귀) | pageId/workspaceId로 스코프 제어 |

#### Supabase DB 기반이라 달라지는 점

터미널 grep은 디스크의 파일을 줄 단위로 스캔하지만, 우리는 content가 **Supabase DB의 text 컬럼**에 저장되어 있다. 따라서:

1. **DB 레벨 필터링 먼저, 라인 파싱은 서버에서**: Supabase `LIKE` / `~` (regex) / `ILIKE`로 대상 행을 먼저 좁힌 뒤, 매칭된 블록의 content를 서버에서 줄 단위로 split하여 라인 번호와 주변 컨텍스트를 계산한다. DB가 "줄 번호"를 직접 알지는 못하므로, **DB = 대상 블록 필터링, 서버 = 라인 파싱 + 컨텍스트** 역할 분담이 된다.
2. **정규식 지원 범위**: PostgreSQL의 `~` 연산자는 POSIX regex를 지원하지만, PCRE와는 다소 다르다. 복잡한 패턴은 서버 레벨에서 JS regex로 2차 매칭할 수 있다.
3. **성능**: 블록 수가 많아지면 content 전체를 스캔하는 것이 부담될 수 있다. **pageId/workspaceId 스코프 + blockTypes 필터**로 대상을 최대한 좁히는 것이 핵심이다.

#### block vs block_mount — 어떻게 구분하여 접근하는가

- **blocks 테이블**: 블록의 실체. `id`, `type`, `title`, `content_raw`, `properties`, `source_id` 등 **데이터 자체**를 저장. content 검색(grep)은 이 테이블의 `content_raw` 및 (소스 연동 시) `blocks.source_id` → `sources`, `source_summaries` JOIN 대상으로 한다.
- **block_mounts 테이블**: 블록의 **페이지별 배치 인스턴스**. `blockMountId`, `blockId`, `pageId`, `position`, `size` 등. 같은 블록이 여러 페이지에 마운트될 수 있다.

```
[grep 검색 흐름]
1. 스코프 결정 (pageId/workspaceId)
   → block_mounts에서 해당 페이지/워크스페이스에 마운트된 blockMountId 목록 추출
   → JOIN하여 대상 blocks 확정

2. content 검색
   → blocks.content에서 pattern 매칭 (DB LIKE/regex)

3. 결과 반환
   → blockMountId(어떤 페이지의 어떤 인스턴스인지) + block 정보 + 매칭 라인
   → 에이전트는 blockMountId로 후속 작업 (read, edit, canvasdown patch 등)
```

**핵심**: 에이전트가 다루는 식별자는 항상 **blockMountId** (페이지 위의 인스턴스)이고, 내부적으로 blockMountId → blockId로 JOIN하여 content를 검색한다. 같은 블록이 여러 페이지에 마운트되어 있으면, **현재 페이지(pageId) 스코프**로 좁혀서 "이 페이지에서의 인스턴스"를 반환한다.

#### grep vs glob — 역할 구분

Architecture.md에서 `grep`과 `glob`은 둘 다 **키워드 기반 검색**이지만 역할이 다르다.

| | `grep` (grepBlockContent) | `glob` (globBlocks) |
|------|---------------------------|---------------------|
| **검색 대상** | 블록의 **content 내부** 텍스트 | 블록의 **메타데이터** (title, type, properties) |
| **질문** | "이 키워드가 **내용 속 어디**에 있어?" | "이런 **이름/타입의 블록**이 어디에 있어?" |
| **비유** | 터미널 `grep` (파일 **안**의 텍스트 검색) | 터미널 `find` / `ls *.md` (파일 **이름/경로** 검색) |
| **반환** | 매칭 라인 + 주변 컨텍스트 + blockMountId | 매칭 블록 목록 (메타데이터) |
| **무거움** | content 전체를 스캔하므로 상대적으로 무거움 | 메타데이터만 조회하므로 가벼움 |

**사용 패턴**:
```
"마케팅 관련 블록 찾아줘"          → glob (title/type으로 블록 목록 검색)
"마케팅이라는 단어가 어디에 있어?"  → grep (content 안에서 라인 검색)
"그 블록 내용 보여줘"              → read (특정 블록의 라인 범위 읽기)
```

```
변경 파일:
├── tools.ts
│   └── + grepBlockContentTool (서버사이드)
│   └── + globBlocksTool (서버사이드)
│   └── + readBlockLinesTool (서버사이드)
├── route.ts
│   └── tools에 grepBlockContent, globBlocks, readBlockLines 등록
├── prompt.ts
│   └── + 검색/읽기 워크플로우 규칙
│       └── "어떤 블록이 있어?" → glob → "키워드가 어디에?" → grep → "뭐라고 써있어?" → read
```

**Tool 스키마**:
```typescript
grepBlockContentTool = {
  description: '블록 content에서 패턴 검색. 라인 단위 매칭 + ±N줄 컨텍스트 반환. '
    + '스코프: pageId(현재 페이지, 기본), workspaceId(전체 워크스페이스), 또는 특정 blockMountId 지정.',
  inputSchema: z.object({
    pattern: z.string().describe('검색 패턴 (regex 지원)'),
    // 스코프 (좁은 범위 → 넓은 범위, 하나만 지정)
    targetBlockMountIds: z.array(z.string()).optional().describe('특정 블록만 검색'),
    pageId: z.string().optional().describe('이 페이지에 마운트된 블록만 검색 (기본: 현재 페이지)'),
    workspaceId: z.string().optional().describe('워크스페이스 전체 검색'),
    // 추가 필터
    blockTypes: z.array(z.string()).optional().describe('블록 타입 필터 (예: ["markdown", "text"])'),
    contextLines: z.number().min(0).max(10).default(3).optional(),
  }),
}

// 블록 메타데이터 검색 (터미널의 find/ls에 해당)
globBlocksTool = {
  description: '블록의 메타데이터(title, type, properties)로 블록을 검색. '
    + 'content 안은 검색하지 않음 — content 검색은 grepBlockContent 사용. '
    + '스코프: pageId(기본), workspaceId.',
  inputSchema: z.object({
    query: z.string().optional().describe('title 패턴 (예: "마케팅*", "회의록")'),
    blockTypes: z.array(z.string()).optional().describe('블록 타입 필터 (예: ["markdown", "youtube"])'),
    pageId: z.string().optional().describe('이 페이지에서 검색 (기본: 현재 페이지)'),
    workspaceId: z.string().optional().describe('워크스페이스 전체에서 검색'),
  }),
}

readBlockLinesTool = {
  description: '블록 content의 특정 라인 범위 읽기. blockMountId로 대상 지정. source로 content_raw/source_content/source_summary 선택, summaryLanguage로 요약 언어 지정.',
  inputSchema: z.object({
    blockMountId: z.string(),
    startLine: z.number().min(1),
    endLine: z.number().optional(),
    source: z.enum(['content_raw', 'source_content', 'source_summary']).optional(),
    summaryLanguage: z.string().optional(),
  }),
}
```

실제 구현 스키마(patterns 배열, matchMode, sources, query 배열·queryMatchMode 등)는 **구현 완료 및 계획 대비 변경 사항** 참고.

**완료 조건**: "마케팅이라는 단어가 어디에 있어?" → grep으로 찾고, "거기 뭐라고 써있어?" → read로 내용 응답. 유튜브 블록의 스크립트/요약 검색·읽기도 source 옵션으로 가능.

---

### Step 1-6. Global Tool — 블록 수정 (editBlockLines)

**목적**: 에이전트가 기존 블록의 텍스트를 라인 단위로 수정할 수 있게 한다.

```
변경 파일:
├── tools.ts
│   └── + editBlockLinesTool (클라이언트사이드)
├── route.ts
│   └── tools에 editBlockLines 등록
└── 클라이언트:
    └── tool-handlers.ts
        └── + editBlockLines 핸들러 (React Flow 노드 업데이트)
```

**Tool 스키마**:
```typescript
editBlockLinesTool = {
  description: '블록 content의 특정 라인을 수정/삽입/삭제.',
  inputSchema: z.object({
    blockMountId: z.string(),
    operation: z.enum(['replace', 'insert', 'delete']),
    startLine: z.number().min(1),
    endLine: z.number().optional(),
    newContent: z.string().optional(),
  }),
}
```

**완료 조건**: "두 번째 문단을 한국어로 바꿔줘" → grep으로 위치 찾기 → editBlockLines로 수정.

---

### Step 1-7. Global Tool — 연결 검색 (hop + group) + 의미 검색 (semantic)

**목적**: 에이전트가 블록 간 연결 관계를 탐색하고, 의미 기반으로도 블록을 검색할 수 있게 한다.

```
변경 파일:
├── tools.ts
│   └── + hopSearchTool (서버사이드, 기존 searchByHop 래핑)
│   └── + searchGroupTool (서버사이드)
│   └── + searchBySemanticTool (서버사이드, 기존 searchBySemantic 래핑)
├── route.ts
│   └── tools에 hopSearch, searchGroup, searchBySemantic 등록
```

**역할 구분**:
| 도구 | 용도 |
|------|------|
| **hopSearch** | 특정 블록에서 엣지를 따라 N홉 이내 연결된 블록 탐색 |
| **searchGroup** | 그룹/존 내부 블록 조회, 또는 블록이 속한 그룹 조회 |
| **searchBySemantic** | 자연어/쿼리와 의미적으로 유사한 블록 검색 (임베딩 기반) |

**기존 서버사이드 도구** `searchByHop`, `searchBySemantic`을 래핑하여 메인 에이전트에 노출.

**완료 조건**:
- "이 블록에 연결된 거 뭐가 있어?" → hopSearch로 연결 블록 목록 반환.
- "이 내용이랑 비슷한 블록 찾아줘" → searchBySemantic으로 유사 블록 반환.

---

### Step 1-8. Global Tool — 레이아웃 정리 (organizeLayout)

**목적**: 기존 블록들을 자동으로 레이아웃 재배치.

```
변경 파일:
├── tools.ts
│   └── + organizeLayoutTool (클라이언트사이드)
└── 클라이언트:
    └── tool-handlers.ts
        └── + organizeLayout 핸들러
```

**Tool 스키마**:
```typescript
organizeLayoutTool = {
  description: '기존 블록들을 자동으로 레이아웃 재배치.',
  inputSchema: z.object({
    type: z.enum(['grid', 'flow', 'tree', 'mindmap', 'stack']),
    options: z.object({
      columns: z.number().optional(),
      direction: z.enum(['LR', 'RL', 'TB', 'BT']).optional(),
      spacing: z.number().default(40).optional(),
    }).optional(),
    targetBlockMountIds: z.array(z.string()).optional(),
  }),
}
```

**완료 조건**: "3열로 정리해줘" → organizeLayout(grid, columns: 3).

---

### Step 1-9. Global Tool — 작업 관리 (createTodos)

**목적**: 에이전트가 작업 계획을 수립하고 진행 상태를 관리.

```
변경 파일:
├── tools.ts
│   └── + createTodosTool (클라이언트사이드)
└── 클라이언트:
    └── tool-handlers.ts
        └── + createTodos 핸들러
```

**완료 조건**: 복잡한 요청 시 에이전트가 투두 목록을 생성하고 단계별로 진행.

---

### Step 1-10. 마우스 컨텍스트 + 대명사 해석 — **(향후 계획)**

**목적**: "이거", "이 블록" 등의 대명사를 호버/클릭 블록으로 정확히 해석.

> Architecture.md 기준 **향후 계획**으로 이동. Phase 1 필수 구현에서 제외.
> 대명사 해석은 당분간 `selectedBlockIds` 우선으로 처리.

```
(구현 시) 변경/신규 파일:
├── context-builder.ts
│   └── + mouseContext (hoveredBlockMountId, clickedBlockMountId)
├── route.ts
│   └── clientContext에서 mouseContext 파싱
├── prompt.ts
│   └── + 대명사 해석 규칙
│       └── 우선순위: selectedBlockIds > hoveredBlockMountId > clickedBlockMountId
└── 클라이언트:
    └── use-canvas-mouse-context.ts (마우스 상태 추적 훅)
```

**완료 조건**: 블록 위에 마우스를 올린 상태로 "이거 요약해줘" → 해당 블록 자동 인식.

---

### Step 1-11. 캔버스 UI 조작 (canvasAction)

**목적**: 에이전트가 캔버스 UI를 직접 조작 (선택, 줌, 에디터 열기, 페이지 이동).

```
변경 파일:
├── tools.ts
│   └── + canvasActionTool (클라이언트사이드)
└── 클라이언트:
    └── tool-handlers.ts
        └── + canvasAction 핸들러
    └── use-canvas-action-executor.ts (DSL 실행기)
```

**완료 조건**: "저 블록 선택하고 에디터 열어줘" → select + open-editor DSL 실행.

---

### Step 1-12. 작업 상태 컨텍스트 (Status Window 연동)

**목적**: 에이전트가 현재 진행 중인 비동기 작업(요약, 스크립트 추출 등)의 상태를 알 수 있게 한다.

```
변경 파일:
├── context-builder.ts
│   └── + activeJobs: Status Window에서 현재 활성 작업 목록
├── route.ts
│   └── clientContext에서 activeJobs 파싱
├── prompt.ts
│   └── + "activeJobs에 running 상태 작업이 있으면 사용자에게 진행 상태를 알려라"
```

**완료 조건**: "아까 요약 다 됐어?" → activeJobs에서 상태 확인 후 응답.

---

### Step 1-13. 이벤트 저장·조회 + 이벤트 컨텍스트 (recentEvents)

**목적**:
1. 핵심 tool call을 이벤트로 저장하여, "어제 뭐 했더라?" 질문에 답변.
2. **이벤트 컨텍스트**: 현재 페이지에서 발생한 주요 이벤트 이력(블록 생성/수정/삭제 등)을 매 요청마다 동적 컨텍스트로 전달.

```
변경/신규 파일:
├── tools.ts
│   └── + grepEventsTool (서버사이드)
│   └── + getPageEventsTool (서버사이드)
├── event-log 도메인
│   └── 이벤트 타입 확장 + 선택적 저장 로직
├── context-builder.ts
│   └── + recentEvents: 현재 페이지 최근 이벤트 이력 (블록 생성/수정/삭제 등, 구체화 예정)
├── route.ts
│   └── clientContext에서 recentEvents 파싱 후 user message metadata에 포함
└── prompt.ts
    └── + recentEvents 해석 규칙 ("방금 뭐 했는지" 맥락 제공)
```

**이벤트 컨텍스트 형식** (Architecture.md 정렬):
```typescript
recentEvents: [{ type: "block_created", ... }, { type: "block_updated", ... }, ...]
```

**완료 조건**:
- "어제 이 페이지에서 뭐 했어?" → 이벤트 로그 기반 작업 히스토리 응답.
- 에이전트가 매 요청 시 `recentEvents`를 참고해 "방금 무슨 일이 있었는지" 맥락을 활용 가능.

---

### Phase 1 완료 시 메인 에이전트 Tool 목록

| 카테고리 | Tool | 실행위치 | Step |
|---------|------|---------|------|
| **검색** | `web_search` / `x_search` (xAI 네이티브) | Server | 1-3 |
| **검색** | `grepBlockContent` | Server | 1-5 |
| **검색** | `globBlocks` | Server | 1-5 |
| **검색** | `readBlockLines` | Server | 1-5 |
| **검색** | `hopSearch` | Server | 1-7 |
| **검색** | `searchGroup` | Server | 1-7 |
| **검색** | `searchBySemantic` | Server | 1-7 |
| **캔버스 조작** | `renderCanvasdown` (Full DSL) | Client | 1-4 |
| **캔버스 조작** | `patchCanvasdown` (Patch DSL) | Client | 1-4 |
| **캔버스 조작** | `organizeLayout` | Client | 1-8 |
| **캔버스 조작** | `canvasAction` | Client | 1-11 |
| **수정** | `editBlockLines` | Client | 1-6 |
| **작업 관리** | `createTodos` | Client | 1-9 |
| **이벤트** | `grepEvents` | Server | 1-13 |
| **이벤트** | `getPageEvents` | Server | 1-13 |

### Phase 1 완료 시 컨텍스트 레이어

| 컨텍스트 | 위치 | Step |
|---------|------|------|
| Sophie 캐릭터 | system prompt (정적) | 1-1 |
| Tool 사용법 | system prompt (정적) | 1-1 |
| 작업 규칙 | system prompt (정적) | 1-1 |
| visibleBlocks | user message (동적) | 1-2 |
| selectedBlockIds | user message (동적) | 1-2 |
| activeJobs | user message (동적) | 1-12 |
| recentEvents (이벤트 컨텍스트) | user message (동적) | 1-13 |
| mouseContext | **(향후 계획)** | — |
| voiceTimelineBlocks | **(향후 계획)** | — |

---

## Phase 2: 기본 서브 에이전트 추가

> 목표: 메인 에이전트의 컨텍스트 소모를 줄이기 위해, 컨텍스트를 많이 소비하는 작업을 서브 에이전트에 위임.
> **핵심**: Phase 1의 모든 Tool은 메인 에이전트에 그대로 유지. 서브 에이전트는 "더 효율적으로" 수행하는 **필수 인프라**이다.

### 기본 서브에이전트 vs 사용자 서브에이전트 (취급 구분)

**호출 방식**은 동일하다. 메인 에이전트는 `callSubAgent(agentName, task)` 하나로 기본/사용자 구분 없이 호출한다.

**소스와 가용성**은 구분한다.

| | 기본 서브에이전트 | 사용자 서브에이전트 |
|------|------------------|---------------------|
| **정의 위치** | 코드/빌트인 레지스트리 | DB (워크스페이스·페이지 스코프) |
| **가용성** | **항상** 사용 가능. 사용자 설정 불필요. | 사용자가 생성한 경우에만 목록에 포함. |
| **컨텍스트** | `defaultSubAgents` — 매 요청 **항상** 포함 | `userSubAgents` — 해당 스코프에 있으면 포함 (Phase 4) |
| **예시** | Explore, Visualize, Research, Browser, Canvas | 마케팅 리서처, 디자인 어시스턴트 등 |

**구현 원칙**: 기본 서브에이전트는 **아예 기본적으로 담기도록** 한다. 레지스트리에 빌트인으로 등록하고, context-builder에서 `defaultSubAgents`를 **항상** user message metadata에 넣는다. 사용자 서브에이전트는 Phase 4에서 DB 조회 결과를 `userSubAgents`로 붙인 뒤, 메인 에이전트가 "사용 가능한 서브에이전트"를 볼 때 **defaultSubAgents + userSubAgents**를 합친 목록을 사용한다.

### Phase 2에서 다루는 개념

Phase 1에서 메인 에이전트가 모든 것을 직접 수행할 수 있게 되었다.
이제 **컨텍스트 분리**를 통한 성능 최적화를 위해 **Sub Agent**와 **Skill** 개념이 등장한다.

#### Sub Agent (서브 에이전트)

**특정 전문 분야에 특화된 에이전트**. 메인 에이전트의 컨텍스트 소모를 줄이기 위해 독립적인 컨텍스트 윈도우에서 작업하고, 결과를 요약하여 메인에 전달한다.

```
서브 에이전트 구성 요소:
├── Description: 역할과 전문 분야
├── Sub Agents: 이 에이전트가 호출할 수 있는 다른 서브 에이전트 목록 (정의 시 제한 가능)
├── Skills: 수행 가능한 규격화된 작업 단위
└── Tools: 사용할 수 있는 Tool 목록 (정의 시 제한 가능)
```

**왜 필요한가**: 파일 탐색, 웹 검색, 스크린샷, 브라우저 DOM 등은 컨텍스트를 빠르게 소모한다. 이런 작업을 별도 에이전트에서 수행하고, **요약된 결과만 메인에 전달**하면 메인의 컨텍스트를 보존할 수 있다.

> **핵심 원칙**: 서브 에이전트가 없더라도 메인 에이전트가 모든 작업을 수행할 수 있어야 한다.
> 서브 에이전트는 성능 최적화를 위한 **옵션**이다.

**비유**: 서브 에이전트는 **직장 동료**와 같다. 위임 관계는 동등하게 서로 넘길 수 있되, 정의할 때 "이 동료는 어떤 Tools, 어떤 서브 에이전트만 쓸 수 있다"를 제한할 수 있다.

**업계 비교**:

| 플랫폼 | 서브 에이전트 유형 |
|--------|-----------------|
| **Cursor** | Explore (코드베이스 탐색), Bash (쉘 실행), Browser (웹 조작) |
| **Claude Code** | Plan (탐색). 모드와 서브에이전트 구분 없이, 조금이라도 특수 작업이면 서브에이전트로 분리 |
| **SSOTA** | Explore, Browser, Research, Visualize, Canvas, Sub Agent Dev, 쏘타 앱 개발 |

#### Skill (스킬)

서브 에이전트가 수행할 수 있는 **규격화된 작업 단위**. 일종의 **업무 가이드라인**이다.

```
Skill 구성 요소:
├── Description: 이 Skill이 어떤 작업을 수행하는지
├── 관련 문서: 작업 수행에 참고할 문서, 가이드라인, 예시
└── Tools 선택: 이 Skill을 수행하기 위해 사용할 Tool 목록
```

**비유**: HR팀의 김대리가 수행하는 "신입사원 온보딩" 업무 절차서가 Skill이다.
- Description: "신입사원의 온보딩 프로세스를 관리한다"
- 관련 문서: 온보딩 체크리스트, 부서별 안내서
- 사용 Tools: 사내 메일 시스템, 계정 생성 도구, 좌석 배정 시스템

**Skill 예시**:
```
Skill: "웹 리서치 정리"
├── Description: 주어진 주제에 대해 웹 검색 후 결과를 캔버스에 구조적으로 정리한다
├── 관련 문서: 리서치 템플릿, 출처 표기 가이드
└── Tools: webSearch, renderCanvasdown, patchCanvasdown, organizeLayout
```

**Sub Agent와 Skill의 관계**: 하나의 서브 에이전트는 여러 Skill을 가질 수 있다. Skill을 통해 복잡한 작업을 표준화된 절차로 분해할 수 있다.

#### Block Tool (블록 도구) — Phase 2에서 확장

Phase 1에서는 Global Tool만 다뤘다. 서브 에이전트가 등장하면서 **Block Tool**이 의미를 갖는다.

Block Tool은 이미 존재하는 블록의 데이터를 **조회/조작**하는 도구다. 데이터 편집보다는 **기존 데이터를 보기 위한 조작**에 가깝다.

| 블록 타입 | Block Tool 예시 |
|----------|---------------|
| 유튜브 블록 | `타임이동하기`, `스크립트 추출` |
| 브라우저 블록 | `브라우저 탐색`, `스크린샷` |
| PDF 블록 | `페이지 이동`, `텍스트 추출` |

Block Tool은 서브 에이전트의 Tools에 포함되어, 해당 블록 타입에 대한 전문적인 조작을 가능하게 한다.

---

### Phase 2 원칙

1. **메인 에이전트의 Tool은 제거하지 않는다**: 서브 에이전트는 메인의 능력을 "보조"할 뿐, "대체"하지 않는다.
2. **컨텍스트 분리가 핵심 가치**: 서브 에이전트의 독립 컨텍스트 윈도우에서 작업 → 요약 결과만 메인에 반환.
3. **기본 서브에이전트는 항상 담기**: `defaultSubAgents`는 빌트인 레지스트리에서 오며, 매 요청 동적 컨텍스트에 **항상** 포함된다.
4. **메타데이터만 컨텍스트에**: 서브 에이전트 목록은 `name + description`만 포함. 상세는 `get sub agent`로 온디맨드 조회.

---

### Step 2-1. 서브 에이전트 프레임워크

**목적**: 서브 에이전트를 정의하고, 메인 에이전트에서 호출할 수 있는 공통 프레임워크 구축. **기본 서브에이전트는 빌트인으로 항상 사용 가능**하게 한다.

```
신규 파일:
├── sub-agent-framework/
│   ├── types.ts
│   │   └── SubAgentDefinition: { name, description, skills, tools, subAgents }
│   ├── sub-agent-executor.ts
│   │   └── executeSubAgent(): 독립 컨텍스트에서 서브에이전트 실행 → 요약 반환
│   └── sub-agent-registry.ts
│       ├── built-in: Explore, Visualize, Research, Browser, Canvas — 코드에 정의, **항상** 로드
│       └── user: Phase 4에서 DB 조회 후 병합
변경 파일:
├── tools.ts
│   └── + getSubAgentTool: 서브 에이전트 상세 조회
│   └── + callSubAgentTool: 서브 에이전트 호출 (범용)
├── context-builder.ts
│   └── + defaultSubAgents: 빌트인 레지스트리에서 읽은 목록 (name, description) — **항상** user message metadata에 포함
├── prompt.ts
│   └── + 서브 에이전트 호출 규칙
│       └── "직접 수행할 수 있지만, 컨텍스트를 절약하려면 서브 에이전트에 위임하라"
│       └── "서브 에이전트 결과를 요약하여 사용자에게 전달하라"
```

**서브 에이전트 정의 형식**:
```typescript
interface SubAgentDefinition {
  name: string;
  description: string;
  skills: Skill[];
  tools: string[];           // 사용 가능한 Tool 이름 목록 (제한)
  subAgents: string[];       // 호출 가능한 다른 서브 에이전트 이름 목록 (제한)
  model?: string;            // 사용할 LLM 모델 (기본: 메인과 동일)
  systemPrompt?: string;    // 서브 에이전트 전용 system prompt
}
```

**완료 조건**: 서브 에이전트 등록/조회/호출 파이프라인 동작.

---

### Step 2-2. Explore 서브 에이전트

**목적**: 캔버스 내외의 컨텍스트를 빠르게 탐색. 파일 탐색, 웹 검색, 시맨틱 검색 등 컨텍스트를 빠르게 소모하는 작업을 분리.

```
Explore 서브 에이전트 정의:
├── name: "Explore"
├── description: "캔버스 내외의 컨텍스트를 빠르게 탐색하는 전문가"
├── tools:
│   ├── grepBlockContent (content 내부 키워드 검색)
│   ├── globBlocks (메타데이터 기반 블록 검색)
│   ├── readBlockLines (라인 읽기)
│   ├── hopSearch (연결 기반 검색)
│   ├── searchGroup (그룹 검색)
│   ├── searchBySemantic (의미 기반 검색, 기존)
│   └── webSearch (웹 검색)
└── skills: []  // 초기에는 별도 Skill 없음
```

**완료 조건**: "이 페이지에서 마케팅 관련 내용 다 찾아줘" → Explore 서브 에이전트가 탐색 → 요약 결과만 메인에 반환.

---

### Step 2-3. Visualize 서브 에이전트

**목적**: 수집된 컨텍스트를 구조화하고 시각화하여 캔버스에 배치.

```
Visualize 서브 에이전트 정의:
├── name: "Visualize"
├── description: "컨텍스트를 구조화/시각화하여 캔버스에 배치하는 전문가"
├── tools:
│   ├── renderCanvasdown (Full), patchCanvasdown (Patch)
│   ├── organizeLayout (레이아웃 정리)
│   └── searchTemplate (방법론/템플릿 검색, 향후 추가)
└── skills: []
```

**완료 조건**: 메인 에이전트가 Explore 결과를 Visualize에 넘겨서 캔버스에 정리.

---

### Step 2-4. Research 서브 에이전트

**목적**: 심층 리서치 수행. 여러 번의 웹 검색 + 교차 검증 + 구조화된 리포트 생성.

```
Research 서브 에이전트 정의:
├── name: "Research"
├── description: "주제에 대한 심층 리서치를 수행하는 전문가"
├── tools:
│   ├── webSearch
│   ├── grepBlockContent
│   └── readBlockLines
├── skills:
│   └── deepResearch: 여러 소스 교차 검증 + 구조화된 리포트 생성
└── subAgents:
    └── Explore (탐색 위임 가능)
```

**완료 조건**: "AI 스타트업 트렌드 심층 조사해줘" → Research가 다각도 조사 → 구조화된 리포트 반환.

---

### Step 2-5. Browser 서브 에이전트

**목적**: 캔버스 위의 브라우저 블록을 직접 조작.

```
Browser 서브 에이전트 정의:
├── name: "Browser"
├── description: "캔버스 위 브라우저 블록을 직접 조작하는 전문가"
├── tools:
│   ├── move, scroll, click (브라우저 조작)
│   ├── screenshot (스크린샷 캡처)
│   ├── record (동작 기록)
│   └── extractImage (이미지 추출)
└── skills: []
```

**완료 조건**: "이 웹페이지에서 헤더 스크린샷 찍어줘" → Browser가 조작 수행.

---

### Step 2-6. Canvas 서브 에이전트

**목적**: 캔버스 UI를 직접 조작 (에디터 열기, 블록 선택, 페이지 이동 등).

```
Canvas 서브 에이전트 정의:
├── name: "Canvas"
├── description: "캔버스 UI를 직접 조작하는 전문가"
├── tools:
│   ├── canvasAction (UI 조작 DSL)
│   ├── renderCanvasdown (Full), patchCanvasdown (Patch)
│   └── organizeLayout (레이아웃)
└── skills: []
```

**완료 조건**: 복잡한 캔버스 조작 시 Canvas 서브 에이전트에 위임 가능.

---

### Phase 2 완료 시 기본 서브 에이전트 목록

| 서브 에이전트 | 목적 | 주요 Tools | Step |
|-------------|------|-----------|------|
| **Explore** | 컨텍스트 탐색 | grep, glob, read, hop, semantic, webSearch | 2-2 |
| **Visualize** | 구조화/시각화 | canvasdown, organizeLayout | 2-3 |
| **Research** | 심층 리서치 | webSearch, grep, read | 2-4 |
| **Browser** | 브라우저 조작 | move, click, screenshot | 2-5 |
| **Canvas** | 캔버스 UI 조작 | canvasAction, canvasdown | 2-6 |

---

## Phase 3: 기본 앱 연동

> 목표: SSOTA 기본 제공 앱을 메인 에이전트·서브 에이전트가 조작할 수 있게 한다.
> **핵심**: Phase 2에서 서브 에이전트가 이미 있으므로, 앱 프레임워크(최소 버전)와 App Tool을 추가하여 **메인·서브 모두** 앱을 사용할 수 있게 한다.

### Phase 3에서 다루는 개념

Phase 1~2에서 메인 에이전트가 모든 것을 직접 수행하고, 기본 서브 에이전트가 동작한다.
이제 **앱(App)**과 **App Tool** 개념이 등장하여, 에이전트가 캔버스 위의 앱도 조작할 수 있게 된다.

#### App (앱) — 기본 개념

**DOM에 렌더링 가능한 코드**(UI)와 **AI가 사용할 수 있는 Tools**로 구성된 확장 단위.

```
App 구성 요소:
├── UI (DOM): 사용자가 직접 인터랙션할 수 있는 UX
├── App Tools: AI 에이전트가 앱을 조작할 수 있는 인터페이스
├── Custom Blocks: 앱이 정의하는 새로운 블록 타입 (Phase 5에서 확장)
└── Sub Agents: 앱에 포함된 서브 에이전트 (Phase 5에서 확장)
```

Phase 3에서는 이 중 **App Tools**에 집중한다. 메인 에이전트와 서브 에이전트가 설치된 앱의 Tool을 호출하여 앱을 조작하는 것이 핵심이다.

#### App Tool (앱 도구)

앱을 **직접 조작**할 수 있는 도구. Global Tool, Block Tool과 함께 Tool 계층의 한 축이다.

| 앱 | App Tool 예시 |
|----|-------------|
| SSOTA Image | `이미지 생성`, `이미지 편집`, `프롬프트 검색`, `프롬프트 저장` |
| SSOTA Shadcn | `컴포넌트 생성`, `컴포넌트 프리뷰` |
| SSOTA Remotion | `영상 생성`, `타임라인 편집` |

> 메인 에이전트와 서브 에이전트 모두, 설치된 앱이 있으면 App Tool을 사용할 수 있다.

#### SSOTA 기본 앱

| 분류 | 설명 | 예시 |
|------|------|------|
| **SSOTA 기본 앱** | SSOTA에서 공식 제공하는 앱 | SSOTA Image, SSOTA Shadcn, SSOTA Remotion, SSOTA X, SSOTA Thread |

기본 앱은 SSOTA가 제공하는 것으로, 별도 설치 없이 사용 가능하거나 기본 설치된 상태다.
Phase 5에서 커뮤니티가 만드는 **커스텀 앱**과 구분된다.

---

### Phase 3 원칙

1. **메인·서브 모두 앱 조작**: 메인 에이전트와 서브 에이전트가 App Tool을 호출하여 기본 앱을 사용
2. **메타데이터만 컨텍스트에**: 설치된 앱 목록은 `name + description + availableTools[]`만 포함, 상세는 `getApp`으로 조회
3. **최소 앱 프레임워크**: 기본 앱을 연동하기 위한 최소한의 앱 등록/조회/Tool 브릿지 구조만 구축
4. **Phase 1~2 Tool 유지**: 기존 Global Tool·서브 에이전트는 전부 유지. App Tool은 **추가**되는 것

---

### Step 3-1. 앱 프레임워크 (최소 버전)

**목적**: 기본 앱을 등록하고, 메인·서브 에이전트가 App Tool을 호출할 수 있는 최소 파이프라인 구축.

```
신규 파일:
├── app-framework/
│   ├── types.ts
│   │   └── AppDefinition: { name, description, tools: AppTool[], version }
│   │   └── AppTool: { name, description, parameters, execute }
│   ├── app-registry.ts
│   │   └── 기본 앱 등록 (빌트인): SSOTA Image, SSOTA Shadcn 등
│   │   └── getInstalledApps(): 설치된 앱 목록 반환
│   └── app-tool-bridge.ts
│       └── App Tool → 메인/서브 에이전트 Tool로 변환/연결
변경 파일:
├── context-builder.ts
│   └── + installedApps: 설치된 앱의 메타데이터 목록 (name, description, tools[].name)
├── tools.ts
│   └── + getAppTool: 앱 상세 조회 (내부 Tools 상세, Custom Blocks 등)
│   └── + useAppTool: 특정 앱의 특정 Tool 실행
├── prompt.ts
│   └── + 앱 사용 규칙
│       └── "설치된 앱이 있으면, 관련 요청 시 앱의 Tool을 useAppTool로 호출하라"
│       └── "앱 상세 정보가 필요하면 getApp으로 조회하라"
```

**완료 조건**: 메인·서브 에이전트가 설치된 앱 목록을 인식하고, `useAppTool`로 앱의 Tool을 호출할 수 있다.

---

### Step 3-2. SSOTA Image 앱 연동

**목적**: 첫 번째 기본 앱으로 SSOTA Image를 연동. 메인 에이전트가 이미지 프롬프트 라이브러리를 조작하는 e2e 시나리오 검증.

```
SSOTA Image 앱 정의:
├── name: "SSOTA Image"
├── description: "이미지 생성, 편집, 프롬프트 라이브러리 관리"
├── tools:
│   ├── imageGenerate: 프롬프트 기반 이미지 생성
│   ├── imageEdit: 기존 이미지 편집/변환
│   ├── promptSearch: 프롬프트 라이브러리에서 검색
│   └── promptSave: 프롬프트 라이브러리에 저장
```

**테스트 시나리오**:
```
사용자: "사이버펑크 스타일 도시 이미지 만들어줘"
→ 메인 에이전트: useAppTool("SSOTA Image", "imageGenerate", { prompt: "cyberpunk city..." })
→ 결과 이미지를 캔버스에 배치 (renderCanvasdown)

사용자: "이 프롬프트 저장해줘"
→ 메인 에이전트: useAppTool("SSOTA Image", "promptSave", { prompt: "cyberpunk city...", tags: [...] })

사용자: "비슷한 프롬프트 있어?"
→ 메인 에이전트: useAppTool("SSOTA Image", "promptSearch", { query: "cyberpunk" })
```

**완료 조건**: 메인 에이전트가 SSOTA Image의 Tool을 사용하여 이미지 생성, 프롬프트 검색/저장을 수행할 수 있다.

---

### Step 3-3. 추가 기본 앱 연동

| 앱 | 기능 | 제공 Tools | 우선순위 |
|----|------|-----------|---------|
| **SSOTA Image** | 이미지 생성/편집/라이브러리 | imageGenerate, imageEdit, promptSearch, promptSave | 높음 (Step 3-2) |
| **SSOTA Shadcn** | UI 컴포넌트 생성 | createComponent, previewComponent | 중간 |
| **SSOTA Remotion** | 영상 제작 | createVideo, editTimeline | 낮음 |

각 앱은 Step 3-1의 앱 프레임워크에 등록하고, 동일한 `useAppTool` 인터페이스로 메인·서브 에이전트가 호출한다.

**완료 조건**: 기본 앱 2개 이상이 연동되어, 메인·서브 에이전트가 다양한 앱을 자유롭게 사용할 수 있다.

---

### Phase 3 완료 시 메인 에이전트 Tool 목록

```
Phase 1 Global Tools (유지):
├── webSearch / xSearch (xAI 네이티브)
├── renderCanvasdown / patchCanvasdown
├── grepBlockContent / globBlocks / readBlockLines
├── editBlockLines
├── hopSearch / searchGroup / searchBySemantic
├── organizeLayout
├── createTodos
├── canvasAction
├── grepEvents / getPageEvents

Phase 2 추가: callSubAgent, getSubAgent (유지)

Phase 3 추가 Tools:
├── getApp        — 설치된 앱 상세 조회
└── useAppTool    — 앱의 특정 Tool 실행
```

---

## Phase 4: 커스텀 서브 에이전트 프레임워크

> 목표: 사용자가 직접 서브 에이전트를 정의하고 추가할 수 있는 시스템.

### Phase 4에서 다루는 개념

Phase 2에서 기본 서브 에이전트가, Phase 3에서 기본 앱이 동작하게 되었다.
이제 **사용자가 직접** 서브 에이전트를 만들 수 있게 열어주는 단계다. 사용자 정의 서브 에이전트는 **앱의 Tool과 연동한 반복 작업을 Skill로 표준화**하여 업무 자동화에 활용한다.

#### 스코프 위계 (Scope Hierarchy)

서브 에이전트는 **어디에서 사용 가능한가**에 따라 스코프가 결정된다. 메인 에이전트가 "사용 가능한 서브 에이전트"를 결정할 때 이 위계를 참고한다.

```
스코프 위계 (좁은 범위 → 넓은 범위):
├── 앱에 포함된 서브 에이전트  ← 해당 앱 설치 시에만 사용 가능 (Phase 5)
├── 페이지 스코프             ← 해당 페이지에서만 사용 가능
└── 워크스페이스 스코프        ← 워크스페이스 전역에서 사용 가능
```

**예시**: 사용자가 "마케팅 리서처" 서브 에이전트를 페이지 스코프로 만들면, 해당 페이지에서만 이 에이전트를 호출할 수 있다. 워크스페이스 스코프로 만들면 모든 페이지에서 사용 가능하다.

#### 사용자 정의 Skill/Tool 조합

사용자가 커스텀 서브 에이전트를 정의할 때, **기존 Tool과 Skill을 조합**하여 새로운 전문가를 만든다. 이는 새로운 코드를 작성하는 것이 아니라, **이미 존재하는 능력(Tool)과 업무 절차(Skill)를 선택하여 묶는 것**이다.

```
커스텀 서브 에이전트 정의 예시:

"마케팅 리서처"
├── Description: "마케팅 관련 리서치를 전문적으로 수행"
├── Tools: [webSearch, grepBlockContent, readBlockLines]  ← 기존 Tool에서 선택
├── Skills:
│   └── marketingResearch:
│       ├── Description: "마케팅 트렌드, 경쟁사 분석, 타겟 고객 리서치"
│       ├── 관련 문서: [마케팅 프레임워크.md, 경쟁사 분석 템플릿.md]
│       └── Tools: [webSearch, grepBlockContent]  ← Skill 내에서 사용할 Tool
├── Sub Agents: [Explore]  ← 호출 가능한 다른 서브 에이전트
└── Scope: workspace
```

#### 메타데이터 원칙

사용자가 서브 에이전트를 여러 개 만들어도, 메인 에이전트의 컨텍스트에는 **메타데이터(name + description)만** 포함된다. 상세 정보(Skills, Tools, 관련 문서)는 `get subagent` 도구로 필요 시 **온디맨드 조회**한다.

```
메인 에이전트 컨텍스트에 포함되는 것:
[{name: "마케팅 리서처", description: "마케팅 관련 리서치를 전문적으로 수행"},
 {name: "디자인 어시스턴트", description: "UI/UX 디자인 피드백과 레퍼런스 수집"}]

get sub agent("마케팅 리서처") 호출 시 반환되는 것:
{ name, description, skills: [...], tools: [...], subAgents: [...], scope: "workspace" }
```

---

### Phase 4 원칙

1. **스코프 위계**: 앱 < 페이지 < 워크스페이스 범위로 서브 에이전트 사용 가능 범위 결정
2. **메타데이터만 컨텍스트에**: 사용자 서브 에이전트 목록은 `name + description` 메타데이터만 메인 에이전트 컨텍스트에 포함
3. **온디맨드 상세 조회**: 필요 시 `get sub agent` 도구로 Skills, Tools 상세 조회

---

### Step 4-1. 커스텀 서브 에이전트 데이터 모델

```
신규 파일:
├── 도메인 모델:
│   └── CustomSubAgent entity
│       ├── name, description
│       ├── skills: Skill[]
│       ├── tools: string[] (사용 가능 Tool 이름)
│       ├── subAgents: string[] (호출 가능 서브 에이전트 이름)
│       ├── scope: 'workspace' | 'page'
│       └── scopeId: string (workspaceId 또는 pageId)
├── Repository:
│   └── CRUD for CustomSubAgent
└── API:
    └── 서브 에이전트 관리 API
```

---

### Step 4-2. Sub Agent Dev 서브 에이전트

**목적**: 사용자의 커스텀 서브 에이전트 정의를 도와주는 메타 서브 에이전트.

```
Sub Agent Dev 서브 에이전트 정의:
├── name: "Sub Agent Dev"
├── description: "사용자의 커스텀 서브 에이전트 정의를 도와주는 전문가"
├── tools:
│   ├── createSubAgent
│   ├── updateSubAgent
│   ├── listAvailableTools
│   └── listAvailableSkills
└── skills:
    └── agentDesign: 효과적인 서브 에이전트 설계 가이드라인
```

**완료 조건**: "마케팅 리서치 전문 에이전트 만들어줘" → Sub Agent Dev가 대화를 통해 서브 에이전트 정의 생성.

---

### Step 4-3. 사용자 서브 에이전트 컨텍스트 통합

메인 에이전트가 "사용 가능한 서브에이전트"를 볼 때 **defaultSubAgents(항상 포함) + userSubAgents(해당 스코프에 있으면)** 를 합친 목록을 사용한다. 호출은 동일한 `callSubAgent(agentName, task)`로 한다.

```
변경 파일:
├── context-builder.ts
│   └── + userSubAgents: 사용자가 추가한 서브 에이전트의 메타데이터 목록 (스코프별 DB 조회)
│   └── 메인 에이전트에 넘길 때: defaultSubAgents + userSubAgents 병합
├── prompt.ts
│   └── + 사용자 서브 에이전트 사용 규칙
│       └── "사용자가 추가한 서브 에이전트가 있으면, 관련 요청 시 활용하라"
│       └── "상세 정보가 필요하면 get sub agent로 조회하라"
```

---

## Phase 5: 커스텀 앱

> 목표: 사용자와 커뮤니티가 직접 앱을 만들고, 커스텀 블록을 정의하며, 앱에 포함된 서브 에이전트를 사용할 수 있는 생태계 구축.

### Phase 5에서 다루는 개념

Phase 3에서 SSOTA 기본 제공 앱을 메인·서브 에이전트가 조작할 수 있게 되었고,
Phase 3~4에서 서브 에이전트 시스템(기본 + 커스텀)이 완성되었다.
이제 **누구나 앱을 만들 수 있는 생태계**로 확장한다.

#### Custom Block (커스텀 블록)

앱이 정의하는 **새로운 블록 타입**. Phase 1의 기본 블록 타입(markdown, youtube, link 등) 외에, 앱이 고유한 블록을 추가할 수 있다.

```
예시:
├── GitHub 앱 설치 → GitHub 커밋 블록, 브랜치 블록, PR 블록 사용 가능
├── Figma 앱 설치 → Figma 프레임 블록, 디자인 컴포넌트 블록 사용 가능
└── Notion 앱 설치 → Notion 페이지 블록, Notion DB 블록 사용 가능
```

커스텀 블록은 해당 앱이 설치된 곳에서만 사용 가능하다.

#### 커뮤니티 앱

| 분류 | 설명 | 예시 |
|------|------|------|
| **SSOTA 기본 앱** | Phase 3에서 이미 연동된 앱 | SSOTA Image, SSOTA Shadcn, SSOTA Remotion |
| **커뮤니티 앱** | 누구나 바이브 코딩으로 만들 수 있는 앱 | Viewtrap 클론, 크날 CCV 클론, 퀴즈 서비스, 단어장 |

커뮤니티 앱 개발은 내부의 **쏘타 앱 개발 서브 에이전트**가 스킬과 Tool을 패키지로 제공하여 지원한다.

#### 앱에 포함된 서브 에이전트

Phase 5에서 앱은 자체 서브 에이전트를 포함할 수 있다. 해당 앱이 설치된 곳에서만 활성화된다.

```
설치된 앱의 전체 능력:
├── App Tools → 메인 에이전트가 직접 사용 가능 (Phase 2에서 이미 구축)
│              서브 에이전트에도 Tool로 제공 가능 (Phase 3에서 이미 구축)
├── Custom Block → Canvasdown DSL에서 새 블록 타입으로 사용
└── App Sub Agent → 해당 앱 전용 서브 에이전트 (앱 설치 시에만 활성화)
```

---

### Phase 5 원칙

1. **커스텀 블록 정의**: 앱이 자신만의 블록 타입을 정의 가능
2. **앱 내 서브 에이전트**: 앱에 포함된 서브 에이전트는 해당 앱 설치 시에만 사용 가능
3. **기존 앱 프레임워크 확장**: Phase 3의 최소 앱 프레임워크를 완전한 앱 생태계로 확장
4. **커뮤니티 개발 지원**: 쏘타 앱 개발 서브 에이전트가 바이브 코딩으로 앱 개발을 지원

---

### Step 5-1. 앱 프레임워크 확장 (커스텀 블록 + 앱 서브 에이전트)

**목적**: Phase 3의 최소 앱 프레임워크에 커스텀 블록 정의와 앱 내 서브 에이전트 기능을 추가.

```
변경 파일:
├── app-framework/types.ts
│   └── + customBlocks: BlockTypeDefinition[] (앱이 정의하는 커스텀 블록 타입)
│   └── + subAgents: SubAgentDefinition[] (앱에 포함된 서브 에이전트)
├── app-framework/app-registry.ts
│   └── + 커스텀 블록 등록/해제 (앱 설치/제거 시)
│   └── + 앱 서브 에이전트 등록/해제
├── context-builder.ts
│   └── + 앱 서브 에이전트를 available sub agents에 병합 (앱 설치 시)
├── sub-agent-registry.ts
│   └── + app 카테고리: 앱 설치 시 등록되는 서브 에이전트
```

**완료 조건**: 앱이 커스텀 블록과 서브 에이전트를 정의하고, 설치 시 자동으로 캔버스와 에이전트 시스템에 통합된다.

---

### Step 5-2. 커뮤니티 앱 개발 서브 에이전트

**목적**: 사용자가 바이브 코딩으로 커뮤니티 앱을 만들 수 있도록 지원하는 메타 서브 에이전트.

```
쏘타 앱 개발 서브 에이전트 정의:
├── name: "쏘타 앱 개발"
├── description: "커뮤니티 앱 개발을 지원하는 전문가"
├── tools:
│   ├── createApp (앱 스캐폴딩)
│   ├── defineCustomBlock (커스텀 블록 정의)
│   ├── defineAppTool (App Tool 정의)
│   └── publishApp (앱 배포)
└── skills:
    └── appDevelopment: 앱 개발 가이드라인 + 스킬/Tool 패키지
```

**완료 조건**: "퀴즈 서비스 앱 만들어줘" → 쏘타 앱 개발 서브 에이전트가 대화를 통해 앱 스캐폴딩, Tool/블록 정의, 배포까지 지원.

---

### Step 5-3. 앱 마켓 / 설치 관리

```
신규 파일:
├── 앱 마켓 UI:
│   └── 설치 가능한 앱 목록 (SSOTA 기본 + 커뮤니티)
│   └── 앱 설치/제거 (워크스페이스/페이지 단위)
├── 앱 설치 관리:
│   └── 앱 설치 시: App Tools + Custom Blocks + App Sub Agents 자동 등록
│   └── 앱 제거 시: 관련 리소스 정리
```

**완료 조건**: 사용자가 앱 마켓에서 커뮤니티 앱을 검색하고 설치/제거할 수 있다.

---

## Phase 1 세부 일정 (예상)

> Phase 1이 가장 중요하므로, 세부 일정을 먼저 계획.

| Step | 작업 | 예상 기간 | 의존성 |
|------|------|---------|-------|
| 1-1 | 프롬프트 캐싱 구조 분리 | 1일 | 없음 |
| 1-2 | 기본 컨텍스트 레이어 | 1-2일 | 1-1 |
| 1-3 | 웹/X 검색 (xAI webSearch, xSearch 네이티브) | 0.5-1일 | 1-1 |
| 1-4 | renderCanvasdown + patchCanvasdown | 2-3일 | 1-1 |
| 1-5 | grep + glob + readBlockLines | 2-3일 | 1-2 |
| 1-6 | editBlockLines | 1-2일 | 1-5 |
| 1-7 | hop + group + searchBySemantic | 1-2일 | 1-2 |
| 1-8 | organizeLayout | 1-2일 | 1-4 |
| 1-9 | createTodos | 0.5-1일 | 1-1 |
| ~~1-10~~ | ~~마우스 컨텍스트~~ | **(향후 계획)** | — |
| 1-11 | canvasAction | 2-3일 | 1-2 |
| 1-12 | Status Window 연동 | 1-2일 | 1-2 |
| 1-13 | 이벤트 저장/조회 + recentEvents 컨텍스트 | 2-3일 | 1-1 |
| **합계** | | **~14-24일** | |

### 권장 병렬 작업 그룹

```
Week 1:
├── [1-1] 프롬프트 구조 분리 (Day 1)
├── [1-2] 기본 컨텍스트 (Day 2-3) ← 1-1 이후
├── [1-3] 웹/X 검색 xAI 네이티브 (Day 2) ← 1-1 이후, 1-2와 병렬 가능
└── [1-9] createTodos (Day 3) ← 1-1 이후, 간단

Week 2:
├── [1-4] renderCanvasdown + patchCanvasdown (Day 4-6) ← 핵심, 집중
├── [1-5] grep + glob + read (Day 4-6) ← 1-4와 병렬 가능 (서버/클라 분리)
└── [1-7] hop + group + semantic (Day 6-7) ← 1-2 이후

Week 3:
├── [1-6] editBlockLines (Day 8-9) ← 1-5 이후
├── [1-8] organizeLayout (Day 8-9) ← 1-4 이후
├── [1-11] canvasAction (Day 9-12) ← 1-2 이후
├── [1-12] Status Window (Day 10-11) ← 1-2 이후
└── [1-13] 이벤트 저장/조회 + recentEvents 컨텍스트 (Day 11-13) ← 1-1 이후

(향후 계획: [1-10] 마우스 컨텍스트, 음성 시간축 블록)
```

---

## Phase 1 마일스톤 체크포인트

### Checkpoint A: "검색하고 캔버스에 올리기" (Step 1-1 ~ 1-4)
> "AI 스타트업 검색해줘" → 웹 검색 → Canvasdown으로 캔버스에 블록 배치
> **이 시점에서 첫 번째 데모 가능**

### Checkpoint B: "캔버스 데이터 탐색" (Step 1-5 ~ 1-7)
> "마케팅이라는 단어가 어디에 있어?" → grep → read → "이 블록에 연결된 거?" → hop
> **에이전트가 캔버스의 데이터를 이해하고 탐색할 수 있는 상태**

### Checkpoint C: "캔버스 자유 조작" (Step 1-8 ~ 1-11)
> "3열로 정리해줘" → layout / "에디터 열어줘" → canvasAction / "이거 수정해줘" → edit
> **에이전트가 캔버스를 완전히 자유롭게 조작할 수 있는 상태**

### Checkpoint D: "맥락 이해 + 히스토리" (Step 1-12 ~ 1-13)
> "요약 다 됐어?" → activeJobs 상태 확인 / "어제 뭐 했어?" → 이벤트 로그(grepEvents, getPageEvents) / 매 요청 recentEvents로 "방금 무슨 일이 있었는지" 맥락 활용
> **메인 에이전트 단독 구동 완성**

---

## 요약

### 개념 등장 순서

```
Phase 1 ──  Block, Main Agent, Tool(Global), Context Layer, Canvasdown
            에이전트의 기초 체력. 이 개념만으로 모든 작업 수행 가능.

Phase 2 ──  + Sub Agent, Skill, Tool(Block)
            컨텍스트 분리 최적화. 필수 인프라.

Phase 3 ──  + App, App Tool
            기본 앱 연동. 메인·서브 에이전트가 앱을 조작.

Phase 4 ──  + 스코프 위계, 사용자 정의 Skill/Tool 조합
            사용자 정의 서브 에이전트. 앱과 연동한 반복 작업 표준화.

Phase 5 ──  + Custom Block, 커뮤니티 앱 개발
            누구나 앱을 만들 수 있는 생태계 확장.
```

### Phase별 달성 목표

```
Phase 1 (메인 에이전트 단독)  ──  에이전트의 기초 체력
  └─ 개념: Block, Main Agent, Global Tool, Context Layer, Canvasdown
  └─ Global Tool (renderCanvasdown / patchCanvasdown 포함) + 동적 컨텍스트(visibleBlocks, selectedBlockIds, activeJobs, recentEvents)
  └─ 서브 에이전트·앱 없이 모든 작업 수행 가능 (마우스/음성 시간축 컨텍스트는 향후 계획)

Phase 2 (기본 서브 에이전트)  ──  필수 인프라
  └─ 개념: Sub Agent, Skill, Block Tool
  └─ 5개 기본 서브 에이전트 (Explore, Visualize, Research, Browser, Canvas) — 빌트인, defaultSubAgents로 **항상** 포함
  └─ 컨텍스트 분리로 메인 에이전트 효율 극대화

Phase 3 (기본 앱 연동)  ──  앱 조작 능력
  └─ 개념: App, App Tool
  └─ 최소 앱 프레임워크 + SSOTA Image 등 기본 앱 연동
  └─ 메인·서브 에이전트가 앱을 조작 (getApp, useAppTool)

Phase 4 (커스텀 서브 에이전트)  ──  사용자 확장
  └─ 개념: 스코프 위계, 사용자 정의 Skill/Tool 조합
  └─ 사용자 정의 서브 에이전트 시스템 + 앱과 연동한 반복 작업 표준화
  └─ Sub Agent Dev 메타 에이전트

Phase 5 (커스텀 앱)  ──  생태계 확장
  └─ 개념: Custom Block, 커뮤니티 앱, 앱 내 서브 에이전트
  └─ 커스텀 블록 정의 + 앱 서브 에이전트
  └─ 커뮤니티 앱 개발 (쏘타 앱 개발 서브 에이전트) + 앱 마켓
```

### 개념 관계도 (전체 아키텍처)

```
┌─────────────────────────────────────────────────────────┐
│                     Main Agent (Phase 1)                │
│  (Orchestration, Context Layer 기반 의사결정)              │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Global Tools │  │ App Tools│  │ Sub Agent 호출     │  │
│  │ (canvasdown, │  │ (Phase 3)│  │ (Phase 2, 4)       │  │
│  │  webSearch,  │  │ getApp,  │  │                    │  │
│  │  grep, ...)  │  │useAppTool│  │                    │  │
│  └─────────────┘  └──────────┘  └────────┬───────────┘  │
└──────────────────────────────────────────┼──────────────┘
                                           │
                    ┌──────────────────────┼───────────────┐
                    │                      ▼               │
                    │    ┌──────────────────────┐          │
                    │    │  Sub Agent (Phase 2)  │          │
                    │    │  ┌────────────────┐  │          │
                    │    │  │  Description   │  │          │
                    │    │  ├────────────────┤  │          │
                    │    │  │  Skills (Ph.2) │──┼── 규격화된 작업 단위
                    │    │  │  (업무 가이드)   │  │    (관련 문서 + Tools)
                    │    │  ├────────────────┤  │          │
                    │    │  │  Tools         │──┼── Global / Block / App Tools
                    │    │  ├────────────────┤  │          │
                    │    │  │  Sub Agents    │──┼── 다른 서브 에이전트 호출 가능
                    │    │  └────────────────┘  │          │
                    │    └──────────────────────┘          │
                    └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              App: SSOTA 기본 앱 (Phase 3)                │
│  ┌──────────────┐  ┌──────────┐                         │
│  │   UI (DOM)   │  │ App Tools│  메인·서브 에이전트가 조작 │
│  │  사용자 UX    │  │ AI 조작  │                         │
│  └──────────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           App: 커스텀/커뮤니티 앱 (Phase 5)               │
│  ┌──────────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │   UI (DOM)   │  │ App Tools│  │  커스텀 Block 정의  │ │
│  │  사용자 UX    │  │ AI 조작  │  │  (예: GitHub 커밋)  │ │
│  └──────────────┘  └──────────┘  └────────────────────┘ │
│  ┌────────────────────────┐                              │
│  │  App Sub Agent         │  ← 앱 설치 시에만 활성화     │
│  └────────────────────────┘                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Canvas (Phase 1)                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │Block│─│Block│─│Block│ │Block│  ← 엣지로 연결        │
│  │(MD) │ │(YT) │ │(IMG)│ │(PDF)│                       │
│  └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                         │
│  Canvasdown DSL로 생성/수정/연결/이동                      │
└─────────────────────────────────────────────────────────┘
```
