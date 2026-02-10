# Sophi Agent Evolution Roadmap
# "토니 스타크의 자비스" - SSOTA 캔버스 협업 에이전트

> 릴스 에피소드별 와우 모먼트를 통한 점진적 에이전트 진화 로드맵

---

## 현재 상태 (Baseline)

### 기존 AI 인프라
- **도메인**: `ai-management` (DDD 패턴, Aggregate/Entity/VO/Command/Event)
- **프론트엔드**: Vercel AI SDK `useChat` + Fractal Component Architecture
- **백엔드**: `/api/agent` route → `streamText` (multi-step, max 20 steps)
- **도구 시스템 (기존)**: Client-side 7개 + Server-side 5개
  - Client: `addBlocks`, `updateTitle`, `updateContent`, `updateProperties`, `connectBlocks`, `executeBlockAction`, `searchBlockByKeywordInPage`
  - Server: `getBlockTypeDetail`, `searchByHop`, `searchBySemantic`, `searchBlockTypes`

### 핵심 설계 변경: Canvasdown-First 전략

> **결정**: 기존 개별 캔버스 조작 도구 5개(`addBlocks`, `updateTitle`, `updateContent`, `updateProperties`, `connectBlocks`)를 **모두 제거**하고, `renderCanvasdown` 단일 도구로 통일한다.

**이유**:
- **툴콜 횟수 감소**: 블록 3개 생성 + 연결 = 기존 4~6회 → Canvasdown 1회
- **아웃풋 토큰 절약**: 각 tool result 반환이 사라지고 DSL 1회 출력으로 완료
- **Agent Step 효율**: max 20 step 제한 내에서 훨씬 더 많은 작업 가능
- **릴스 임팩트**: "한 번에 쫙 깔리는" 비주얼이 자비스 느낌에 적합
- **선언적 접근**: 레이아웃 + 블록 + 엣지를 한 번에 기술

**Canvasdown 모드**:
- **Full DSL**: 새 블록 생성 + 레이아웃 + 엣지 (신규 생성)
- **Patch DSL**: `@update`, `@delete`, `@connect`, `@disconnect`, `@move`, `@resize` (기존 블록 수정)

**Canvasdown 통일 후 남는 기존 도구**:
- Client: `executeBlockAction`, `searchBlockByKeywordInPage`
- Server: `getBlockTypeDetail`, `searchByHop`, `searchBySemantic`, `searchBlockTypes`
- **컨텍스트**: Short-Term Memory + Long-Term Memory (BM25) + Canvas Context
- **Canvasdown DSL**: 캔버스 조작을 위한 자체 DSL (Full/Patch 모드)
- **캐릭터**: Sophi - 자율적 캔버스 에이전트

### 코드 패턴 (유지)
- DDD: Aggregate → Entity → Value Object → Command → Event
- Fractal Components: `core/` (business + ui) + `components/`
- Repository Pattern: Interface → Drizzle Implementation
- Tool Pattern: Schema(Zod) → Handler(Client/Server) → Result
- Context Pattern: React Context + Hook Composition

---

## 에피소드 로드맵

### Episode 1: 웹 검색 — "이거이거 검색해줘"
**와우 모먼트**: 음성으로 "AI 스타트업 최신 뉴스 찾아줘" → Sophi가 웹 검색 후 결과를 캔버스에 블록으로 정리

#### 1-1. 기본 웹 검색 도구
**범위**: 서버사이드 웹 검색 tool 추가

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + webSearchTool (서버사이드 도구 스키마)
├── apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts
│   └── + webSearch 핸들러 (xAI Grok Web Search API 호출)
├── apps/web/src/domains/ai-management/backend/services/prompt/prompt.ts
│   └── + 웹 검색 관련 시스템 프롬프트 업데이트
└── apps/web/src/app/api/agent/route.ts
    └── + webSearch 서버사이드 도구 등록
```

**도구 스키마**:
```typescript
// tools.ts에 추가
export const webSearchTool = {
  description: `Search the web for real-time information using Grok Web Search.
  Use when users ask about current events, latest news, documentation,
  or any information that requires up-to-date web data.

  Powered by x.com Grok — strong at real-time/social media context.
  Results are returned to the agent, which then places them on canvas via canvasdown.`,
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().min(1).max(10).default(5).optional(),
    searchType: z.enum(['general', 'news', 'academic']).default('general').optional(),
  }),
};
```

**구현 핵심**:
- xAI Grok Web Search API 연동 (서버사이드, 기존 xAI provider 활용)
- 검색 결과를 구조화된 형태로 LLM에 반환
- LLM이 결과를 기반으로 `renderCanvasdown`으로 캔버스에 배치 (Full DSL)

#### 1-2. 유튜브 검색 API
**범위**: YouTube Data API v3 연동

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + youtubeSearchTool
├── apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts
│   └── + youtubeSearch 핸들러
└── apps/web/src/config.ts
    └── + YOUTUBE_DATA_API_KEY
```

**도구 스키마**:
```typescript
export const youtubeSearchTool = {
  description: `Search YouTube videos. Results are placed as youtube blocks on canvas.`,
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().min(1).max(10).default(5).optional(),
  }),
};
```

#### ~1-3. 리소스 가져오기~ (제거됨)

> **결정**: `fetchResource` 도구는 추가하지 않는다.
> - 웹 검색 결과에 이미 URL, title, snippet이 포함되어 있음
> - 사용자가 직접 URL을 제공하는 경우, LLM이 URL 타입을 판별하여 `renderCanvasdown`으로 적절한 블록 타입(`@youtube`, `@link`)을 바로 생성
> - 메타데이터(OG tags, 썸네일 등)가 필요한 시점이 오면 그때 서버사이드 도구로 추가

**프롬프트에 추가할 지침**:
```
## URL Handling
- 사용자가 URL을 제공하면 별도 도구 없이 URL 타입을 판별하라
- YouTube URL → @youtube 블록, 일반 URL → @link 블록
- renderCanvasdown으로 직접 생성
```

---

### Episode 2: Canvasdown Tool — "검색 결과 캔버스에 올려줘"
**와우 모먼트**: 검색 결과 5개를 한 번에 캔버스에 깔끔하게 3-column 레이아웃으로 정리

#### 2-1. renderCanvasdown — 캔버스 조작의 유일한 도구
**범위**: 기존 Canvasdown 시스템을 에이전트의 **핵심 캔버스 조작 도구**로 노출. 기존 `addBlocks`, `updateTitle`, `updateContent`, `updateProperties`, `connectBlocks`를 모두 대체.

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + renderCanvasdownTool (클라이언트사이드)
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/tool-handlers.ts
│   └── + renderCanvasdown 핸들러 (CanvasdownExecutor 연동)
```

**도구 스키마**:
```typescript
export const renderCanvasdownTool = {
  description: `THE primary tool for all canvas manipulation.

  Two modes:
  1. Full DSL — Create new blocks with layout + edges
  2. Patch DSL — Modify existing blocks (update, delete, connect, move, resize)

  === FULL DSL (신규 생성) ===
  canvas LR
  @zone header "Research Results" { color: blue }
    @markdown r1 "Result 1" { content: "..." }
    @markdown r2 "Result 2" { content: "..." }
    @markdown r3 "Result 3" { content: "..." }
  @end
  r1 -> r2 : "related"

  === PATCH DSL (기존 수정) ===
  @update <blockMountId> { title: "New Title", content: "New content" }
  @update <blockMountId> { color: "blue", fontSize: "large" }
  @delete <blockMountId>
  @connect <sourceBlockMountId> -> <targetBlockMountId> : "label"
  @disconnect <sourceBlockMountId> -> <targetBlockMountId>
  @move <blockMountId> { x: 100, y: 200 }
  @resize <blockMountId> { width: 300, height: 200 }

  Layout directions: LR (left-right), TB (top-bottom), RL, BT
  Block types: @markdown, @shape, @youtube, @link, @image, @python, @text, @zone`,
  inputSchema: z.object({
    dsl: z.string().describe('Canvasdown DSL string (Full or Patch mode)'),
    mode: z.enum(['full', 'patch']).default('full').describe('full = create new blocks, patch = modify existing blocks'),
    anchorBlockMountId: z.string().optional().describe('Full mode: place relative to this block'),
    position: z.enum(['right', 'below']).default('right').optional().describe('Full mode: placement direction from anchor'),
  }),
};
```

**구현 핵심**:
- 기존 `useCanvasdownExecutor` 훅을 tool handler에서 호출
- Full 모드: anchorBlockMountId 기반 상대 위치 계산 + Zone/Group 자동 레이아웃
- Patch 모드: 기존 `useCanvasdownPatch` + `applyPatch` 활용
- 기존 5개 도구(`addBlocks`, `updateTitle`, `updateContent`, `updateProperties`, `connectBlocks`)를 완전히 대체
- **핵심 이점**: 블록 3개 생성 + 연결 = 기존 4~6 툴콜 → 1 툴콜

#### 2-2. 레이아웃 정리 도구
**범위**: 기존 블록들을 자동으로 레이아웃 재배치

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + organizeLayoutTool (클라이언트사이드)
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/tool-handlers.ts
│   └── + organizeLayout 핸들러
```

**도구 스키마**:
```typescript
export const organizeLayoutTool = {
  description: `Reorganize existing blocks into a structured layout.
  
  Layout system (CSS-inspired, type + options):
  - type: The layout algorithm to use
  - options: Fine-tuning parameters per layout type

  Examples:
  - Grid 3열: { type: "grid", options: { columns: 3 } }
  - 수평 플로우: { type: "flow", options: { direction: "LR" } }
  - 수직 트리: { type: "tree", options: { direction: "TB", rootBlockMountId: "..." } }
  - 마인드맵: { type: "mindmap", options: { centerBlockMountId: "..." } }`,
  inputSchema: z.object({
    type: z.enum(['grid', 'flow', 'tree', 'mindmap', 'stack']).describe(
      'Layout algorithm: grid (rows/cols), flow (directional sequence), tree (hierarchy), mindmap (radial), stack (vertical/horizontal stack)'
    ),
    options: z.object({
      // Grid options
      columns: z.number().min(1).max(10).optional().describe('Grid: number of columns (default: 3)'),
      rows: z.number().min(1).max(10).optional().describe('Grid: number of rows (auto-calculated if omitted)'),
      // Flow/Tree options
      direction: z.enum(['LR', 'RL', 'TB', 'BT']).optional().describe('Flow/Tree: layout direction (default: LR)'),
      // Tree/Mindmap options
      rootBlockMountId: z.string().optional().describe('Tree: root node. Mindmap: center node'),
      // Stack options
      axis: z.enum(['horizontal', 'vertical']).optional().describe('Stack: stacking axis (default: vertical)'),
      // Common options
      spacing: z.number().min(10).max(200).default(40).optional().describe('Gap between blocks in px'),
      align: z.enum(['start', 'center', 'end']).optional().describe('Cross-axis alignment (default: center)'),
      groupInZone: z.boolean().optional().describe('Wrap result in a @zone group (default: false)'),
      zoneName: z.string().optional().describe('Zone group name (if groupInZone is true)'),
    }).optional(),
    targetBlockMountIds: z.array(z.string()).optional().describe('Specific blocks to organize. Empty = all blocks'),
  }),
};
```

---

### Episode 3: 자동 요약 및 추출 — "처리중이에요, 잠시만요"
**와우 모먼트**: 유튜브 링크를 던지면 자동으로 요약이 시작되고, "아직 처리중입니다" 상태를 실시간으로 알려줌

#### 3-1. Status Window 기반 작업 상태 컨텍스트 통합
**범위**: 다양한 app space의 작업 상태를 Status Window에서 수집하여 에이전트 컨텍스트에 전달

> **배경**: 유튜브, PDF, 링크, X(트위터) 등 각 app space는 자체적으로 `summary_job`을 관리.
> Status Window는 이 모든 작업을 카드 스태킹으로 한 곳에서 트래킹한다.
> (참고: `.cursor/plans/status_window_card_stacking_17c6b47f.plan.md`)

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.business.ts
│   └── + Status Window Context에서 statusItems를 읽어 clientContext에 포함
├── apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts
│   └── + statusItems를 Canvas Context에 포함 (user message 영역)
```

**Status Window → Agent 컨텍스트 전달 구조**:
```typescript
// Status Window Context에서 가져오는 정보
interface StatusItemForAgent {
  id: string;
  type: StatusOperationType;   // 'visual-summary' | 'summary' | 'script' | 'ai'
  status: StatusItemStatus;    // 'pending' | 'running' | 'success' | 'error'
  sourceBlockId?: string;      // 어떤 블록의 작업인지
  error?: string;
}

// clientContext에 포함
interface ClientContext {
  // ... 기존 필드 ...
  activeJobs: StatusItemForAgent[];  // Status Window에서 현재 활성 작업들
}
```

**프롬프트 캐싱 전략 — system prompt vs user message**:

> **결정**: 작업 상태는 **user message에 포함** (system prompt에 넣지 않는다)
>
> **이유 (OpenAI 프롬프트 캐싱 동작 원리)**:
> - 캐시 히트는 **정확한 prefix 매치**로만 발생
> - messages 배열에서 system prompt가 가장 앞에 위치
> - system prompt에 동적 데이터(상태값)를 넣으면 **매 요청마다 prefix가 달라져서 캐싱 100% 미스**
> - system prompt를 정적으로 유지하면, 최소 1024 토큰의 시스템 프롬프트가 **항상 캐시 히트** → 비용 최대 90% 절감, 지연 최대 80% 감소
>
> **구현**:
> - system prompt: 정적 (Sophi 성격, 도구 사용법, 규칙 등 — 변하지 않는 것들)
> - user message metadata: 동적 (activeJobs, selectedBlocks, visibleBlocks 등 — 매 요청 변하는 것들)
> - 이미 기존 `clientContext`가 user message metadata로 전달되므로, `activeJobs`도 동일하게 포함

**구현 핵심**:
- Status Window Context(`statusItems`)에서 현재 활성 작업 목록을 읽음
- `activeJobs`로 clientContext에 포함 → 서버에서 user message에 주입
- 시스템 프롬프트에는 정적 지침만: "activeJobs에 running 상태 작업이 있으면 사용자에게 진행 상태를 알려라"
- 각 app space (youtube, pdf, link, x)는 Status Window에 `pushStatusItem`으로 자체 작업 등록
- 에이전트는 Status Window에서 통합된 상태만 읽으면 됨

#### ~~3-2. 자동 요약 트리거~~ (제거됨)

> **결정**: `checkSummaryStatus` / `triggerSummary` 도구는 추가하지 않는다.
> - 각 app space가 자체적으로 summary_job 생성/관리
> - 에이전트는 상태를 "읽기"만 하면 됨 (Status Window에서)
> - 요약 트리거는 기존 블록 액션(`executeBlockAction`)으로 이미 가능

---

### Episode 4: 음성 입력 & TTS — "자비스, 오늘 할일 정리해줘"
**와우 모먼트**: 음성으로 명령 → Sophi가 음성으로 "네, 할일을 정리하겠습니다" 응답 + 동시에 캔버스 조작 시작

#### 설계 결정: 툴콜 기반 TTS (소켓/에이전트 방식 X)

> **선택지 비교**:
>
> | | 소켓 기반 (ElevenLabs Conversational AI) | 툴콜 기반 (speak tool + ElevenLabs TTS API) |
> |---|---|---|
> | **오디오 I/O** | WebSocket으로 상시 연결, 양방향 스트리밍 | STT: 별도 처리, TTS: tool call 시 ElevenLabs API 호출 |
> | **에이전트 설계** | ElevenLabs 에이전트가 대화 흐름 제어 | 우리 에이전트가 대화 흐름 완전 제어 |
> | **병렬 실행** | 제한적 (에이전트 프레임워크 내부 제약) | **자유로움** — speak + canvasdown + webSearch 동시 가능 |
> | **설계 자유도** | 낮음 (ElevenLabs 프레임워크에 종속) | **높음** — 도구 추가/제거, 순서 변경 자유 |
> | **지연시간** | 소켓 상시 연결로 낮음 | 병렬 툴콜로 **비슷하게 낮음** (speak과 작업이 동시 시작) |
> | **비용** | Conversational AI 요금 (분 단위) | TTS API 요금 (문자 단위, 더 저렴) |
> | **복잡도** | WebSocket 관리, 세션 유지 | 단순 — HTTP 요청 기반 |
>
> **결정**: **툴콜 기반 TTS** 채택
> - 에이전트 설계 자유도가 핵심. 우리 에이전트(Vercel AI SDK)가 모든 흐름을 제어
> - 병렬 툴콜로 "음성 응답 + 캔버스 조작"이 동시에 시작되므로 체감 지연 최소화
> - ElevenLabs에 종속되지 않아 TTS 엔진 교체도 용이

#### 설계 결정: Push-to-Talk STT (상시 연결 X)

> **결정**: 음성 입력은 **Push-to-Talk 방식** — 사용자가 마이크 버튼을 눌렀을 때만 오디오 입력을 받는다.
>
> **이유**:
> - 텍스트 입력도 동등하게 중요 — 음성 전용이 아닌 **하이브리드 입력** 설계
> - 상시 마이크 연결은 불필요한 리소스 소비 + 프라이버시 이슈
> - Push-to-Talk이면 명확한 입력 시작/종료 시점이 있어 STT 정확도도 높음
> - 릴스 촬영에서도 "마이크 버튼 누르고 말하는" 제스처가 시각적으로 와우

#### 4-1. 음성 입력 (STT) — Push-to-Talk
**범위**: 마이크 버튼 클릭 시 오디오 캡처 → STT 변환 → 텍스트로 에이전트에 전달

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/frontend/hooks/
│   └── + use-voice-input.ts (Push-to-Talk STT 훅)
│       - 마이크 버튼 누름 → MediaRecorder 시작
│       - 버튼 떼면 → 녹음 종료 → Whisper API 또는 Web Speech API로 STT
│       - 변환된 텍스트를 sendMessage()로 전달 (기존 텍스트 입력과 동일 경로)
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/
│   └── components/agent-prompt-input.tsx (마이크 버튼 추가)
```

**입력 흐름 (텍스트와 동일 경로로 합류)**:
```
[텍스트 입력] → sendMessage(text, clientContext) → /api/agent
[음성 입력]   → Push-to-Talk → STT → sendMessage(text, clientContext) → /api/agent
                                        ↑ 동일 경로
```

#### 4-2. 음성 출력 (TTS) — ElevenLabs 툴콜 방식
**범위**: TTS를 도구로 구현하여 병렬 실행 가능하게. ElevenLabs TTS API 사용.

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + speakTool (클라이언트사이드)
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/tool-handlers.ts
│   └── + speak 핸들러 (ElevenLabs TTS API 호출 → Audio 재생)
├── apps/web/src/domains/ai-management/frontend/hooks/
│   └── + use-tts.ts (ElevenLabs TTS 엔진 훅)
└── apps/web/src/config.ts
    └── + ELEVENLABS_API_KEY
```

**도구 스키마**:
```typescript
export const speakTool = {
  description: `Speak a message to the user via TTS (ElevenLabs).
  ALWAYS call this FIRST before other tools to acknowledge the user.
  Can run in parallel with other tool calls.

  Pattern: speak("할일을 정리하겠습니다") + renderCanvasdown(dsl) (parallel)`,
  inputSchema: z.object({
    message: z.string().describe('Text to speak'),
    emotion: z.enum(['neutral', 'excited', 'calm', 'thinking']).default('neutral').optional(),
  }),
};
```

**ElevenLabs TTS 구현 패턴**:
```typescript
// use-tts.ts — ElevenLabs Text-to-Speech 훅
// 1. 클라이언트에서 ElevenLabs REST API로 음성 생성 요청
// 2. 스트리밍 응답을 AudioContext로 즉시 재생
// 3. 병렬 실행: speak tool이 호출되는 즉시 오디오 스트리밍 시작
//    → 동시에 다른 tool (renderCanvasdown 등)도 실행 중
```

**핵심 패턴 — 도구 실행 순서**:
```
사용자 음성 입력 → STT → 텍스트 전달
  → Sophi 응답:
    1. speak("투두를 세우겠습니다") [즉시 ElevenLabs TTS 스트리밍]
    2. renderCanvasdown(투두 블록 DSL) [병렬 실행]
    3. speak("웹 검색부터 시작합니다") [순차]
    4. webSearch("...") [병렬 실행]
    5. speak("다음을 진행합니다") [순차]
```

**프롬프트 지침 추가**:
```
## Voice Interaction Rules
- ALWAYS call speak() first to acknowledge the user before starting work
- Run speak() in PARALLEL with tool calls whenever possible
- Pattern: speak acknowledgment → start tools → speak progress → continue tools
- Keep spoken messages short and natural (1-2 sentences)
- Tool execution order: Plan → speak plan → execute → speak progress → next step
```

---

### Episode 5: Grep / Read Line / Edit Line — "두번째 문단에 뭐라고 써있어?"
**와우 모먼트**: "그 요약 노트에서 마케팅 관련 내용 찾아줘" → 해당 라인을 하이라이트하며 읽어줌

#### 설계 결정: grepBlockContent 통합 (searchBlockByKeyword content 검색 흡수)

> **통합 배경**: grepBlockContent와 searchBlockByKeyword는 둘 다 전체 블록을 대상으로 content를 검색한다. grep은 라인 단위 + 주변 컨텍스트를 반환하므로, "어떤 블록에 있어?"는 grep 결과에서 블록 ID별로 그룹핑하면 얻을 수 있다. **블록 스케일에서는 둘을 나눌 실익이 적다.**
>
> **결정**: `grepBlockContent` 하나로 content 검색 통일. `searchBlockByKeyword`는 content 검색 역할을 **grepBlockContent에 흡수**하여 제거(또는 title/properties 전용으로만 유지).
>
> **역할 구분** (통합 후):
>
> | 도구 | 목적 | 단위 | 질문 |
> |------|------|------|------|
> | `grepBlockContent` | **전체 블록** content에서 패턴 검색 | 라인 단위 + 블록 ID | "이 키워드가 어디에 있어?" + "몇 번째 줄?" |
> | `readBlockLines` | 특정 라인 범위 **내용 읽기** | 라인 범위 | "그 줄에 뭐라고 써있어?" |
>
> **2단계 워크플로우**:
> ```
> 1단계: grepBlockContent (서버) → 전체 블록에서 패턴 검색 → 매칭 라인 + ±3줄 컨텍스트 + 블록 ID 반환
> 2단계: readBlockLines (서버) → 특정 라인 범위 읽기 (필요 시)
> ```
>
> **실행 위치 결정**:
> - `grepBlockContent`, `readBlockLines`: **서버단** — content는 DB에 저장되어 있어 서버에서 라인 파싱 + regex 매칭 가능. Supabase `LIKE` / `~` (regex) 또는 `ts_headline` 활용
> - `editBlockLines`: **클라이언트단** — React Flow 노드 업데이트 필요
> - grep의 가치는 **넓은 범위에서 정밀 검색** — 현재 페이지만 대상이면 searchBlockByKeywordInPage와 차별점이 약하므로 **서버단 전체 검색**이 맞음

#### 5-1. 블록 내 텍스트 검색 (grepBlockContent)
**범위**: 전체 블록 content에서 패턴 검색. 라인 단위 매칭 + ±3줄 주변 컨텍스트 반환. searchBlockByKeyword의 content 검색 역할을 흡수.

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + grepBlockContentTool (서버사이드)
├── apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts
│   └── + grepBlockContent 핸들러
```

**구현 핵심**:
- content는 Supabase에 저장 — 서버에서 라인 파싱 + regex 매칭
- Supabase `LIKE`, `~` (regex), 또는 `ts_headline` (매칭 하이라이트)로 DB 레벨 효율화
- 렌더링 여부와 무관하게 전체 워크스페이스 검색 가능 (프론트 기반이면 현재 페이지만 대상이라 차별점 약함)

**도구 스키마**:
```typescript
export const grepBlockContentTool = {
  description: `Search across ALL block content at LINE level (summaries, notes, scripts).
  Primary content search tool — supersedes searchBlockByKeyword for content search.
  Returns: matching lines with surrounding context (±3 lines) + blockMountId per match.
  "어떤 블록에 있어?" → grep 결과에서 블록 ID별 그룹핑. "몇 번째 줄?" → 이미 포함.
  Target: all blocks in workspace (default), or filter by blockIds/blockTypes. Server-side (DB query).`,
  inputSchema: z.object({
    pattern: z.string().describe('Search pattern (regex supported)'),
    targetBlockMountIds: z.array(z.string()).optional(),
    blockTypes: z.array(z.string()).optional().describe('Filter: ["markdown", "text", "youtube"]'),
    contextLines: z.number().min(0).max(10).default(3).optional(),
  }),
};
```

#### 5-2. Read Line 도구 (readBlockLines)
**범위**: 블록 컨텐츠의 특정 라인 범위 읽기. 서버단 — content를 DB에서 가져와 라인 분할.

```typescript
export const readBlockLinesTool = {
  description: `Read specific line range from a block's content.
  Use after grepBlockContent to read full context, or when user references
  "the second paragraph" or "line 5-10". Server-side (DB query).`,
  inputSchema: z.object({
    blockMountId: z.string(),
    startLine: z.number().min(1),
    endLine: z.number().optional(),
  }),
};
```

#### 5-3. Edit Line 도구 (editBlockLines)
**범위**: 블록 컨텐츠의 특정 라인 수정. **클라이언트단** — React Flow 노드 업데이트 필요.

```typescript
export const editBlockLinesTool = {
  description: `Edit specific lines in a block's content.
  Supports: replace, insert, delete operations on specific line ranges.`,
  inputSchema: z.object({
    blockMountId: z.string(),
    operation: z.enum(['replace', 'insert', 'delete']),
    startLine: z.number().min(1),
    endLine: z.number().optional(),
    newContent: z.string().optional(),
  }),
};
```

---

### Episode 6: Hop / Group 검색 — "이거 주변에 연결된 거 알려줘"
**와우 모먼트**: 블록 하나를 클릭하고 "주변 연결 보여줘" → 연결된 블록들이 하이라이트되며 관계도 설명

#### 6-1. 기존 searchByHop 강화
**범위**: 기존 hop search를 시각적 하이라이트와 연결

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/tool-handlers.ts
│   └── + hopSearch 핸들러에 시각적 하이라이트 추가
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + hopSearchWithVisualizeTool (클라이언트사이드, 기존 서버사이드와 별도)
```

**도구 스키마**:
```typescript
export const hopSearchVisualizeTool = {
  description: `Find and visually highlight blocks connected to a target block.
  Shows connection graph with hop distances.
  Highlights found blocks on canvas and optionally zooms to fit.`,
  inputSchema: z.object({
    startBlockMountId: z.string(),
    hops: z.number().min(1).max(3).default(1),
    direction: z.enum(['out', 'in', 'both']).default('both'),
    visualize: z.boolean().default(true).describe('Highlight connected blocks on canvas'),
    zoomToFit: z.boolean().default(false),
  }),
};
```

#### 6-2. Group 검색
**범위**: Group/Zone 단위 검색

```typescript
export const searchGroupTool = {
  description: `Search blocks within a group/zone.
  Find all children of a group block, or find which group a block belongs to.`,
  inputSchema: z.object({
    groupBlockMountId: z.string().optional().describe('Find children of this group'),
    childBlockMountId: z.string().optional().describe('Find parent group of this block'),
  }),
};
```

---

### Episode 7: 핵심 Event 저장 — "지난번에 뭐 수정했더라?"
**와우 모먼트**: "어제 이 캔버스에서 뭐 했었지?" → 수정/검색/추가 이력만 정리해서 보여줌

#### 7-1. 선택적 이벤트 저장
**범위**: 모든 대화가 아닌, 핵심 tool call만 이벤트로 저장

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/shared/entities/event-log.entity.ts
│   └── 이벤트 타입 확장 (ToolCallExecuted, BlockSearched, BlockModified, BlockAdded)
├── apps/web/src/domains/ai-management/backend/repositories/implementations/
│   └── drizzle-event-log.repository.ts (선택적 저장 로직)
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + grepEventsTool (서버사이드)
│   └── + getPageEventsTool (서버사이드)
```

**저장 대상 이벤트**:
```typescript
type PersistableEventType =
  | 'block_created'      // 블록 생성
  | 'block_updated'      // 블록 수정 (content, title, properties)
  | 'block_deleted'      // 블록 삭제
  | 'blocks_connected'   // 엣지 생성
  | 'web_searched'       // 웹 검색 실행
  | 'layout_organized'   // 레이아웃 정리
  | 'canvasdown_rendered' // Canvasdown DSL 실행
  | 'summary_triggered'; // 요약 실행
```

**도구 스키마**:
```typescript
export const grepEventsTool = {
  description: `Search through saved events (modifications, searches, additions).
  Not all conversations are saved - only significant tool executions.`,
  inputSchema: z.object({
    query: z.string().describe('Search keyword in events'),
    pageId: z.string().optional(),
    eventTypes: z.array(z.string()).optional(),
    limit: z.number().default(20).optional(),
  }),
};

export const getPageEventsTool = {
  description: `Get recent events for a page. Paginated.
  Shows what was modified, searched, or added on this page.`,
  inputSchema: z.object({
    pageId: z.string(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
  }),
};
```

---

### Episode 8: 마우스 컨텍스트 — "이 블록 두번째 문단에 뭐야?"
**와우 모먼트**: 블록 위에 마우스를 올린 상태에서 "이거 요약해줘" → 해당 블록을 자동 인식하여 요약

#### 8-1. 클릭/호버 이벤트 전달
**범위**: 마우스 이벤트를 에이전트 컨텍스트에 통합

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/types.ts
│   └── + MouseContext 타입 추가
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.business.ts
│   └── + mouseContext를 clientContext에 포함
├── apps/web/src/domains/canvas-management/frontend/hooks/
│   └── + use-canvas-mouse-context.ts (마우스 상태 추적 훅)
├── apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts
│   └── + mouseContext 처리 (hover/click된 블록 정보 포함)
```

**컨텍스트 확장**:
```typescript
interface MouseContext {
  hoveredBlockMountId: string | null;
  clickedBlockMountId: string | null;
  // "이 블록" = hoveredBlock 또는 clickedBlock (선택 우선)
  cursorPosition?: { x: number; y: number }; // 캔버스 좌표
}

// ClientContext 확장
interface ClientContext {
  pageId: string;
  workspaceId: string;
  orgId: string;
  selectedBlockIds: string[];
  visibleBlockIds: string[];
  recentlyModifiedBlockIds: string[];
  mouseContext: MouseContext;  // 추가
}
```

**프롬프트 지침**:
```
## Mouse Context Rules
- "이 블록", "이거" → mouseContext.hoveredBlockMountId 또는 selectedBlockIds[0]
- 우선순위: selectedBlockIds > hoveredBlockMountId > clickedBlockMountId
- "두번째 문단" → readBlockLines로 해당 블록의 컨텐츠에서 문단 파싱
```

---

### Episode 9: 캔버스 조작 DSL — "에디터 열어줘, 저 블록 선택해줘"
**와우 모먼트**: "저 블록 선택하고 에디터 열어줘" / "전체 화면에 맞춰줘" → Sophi가 선택 + 확대/패널 조작

#### 9-1. Canvas Action DSL
**범위**: 캔버스 **UI 조작**(선택, 확대, 에디터, 페이지 이동)만 DSL로 제공. group/move/resize는 renderCanvasdown Patch DSL로 처리.

```
신규/수정 파일:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + canvasActionTool (클라이언트사이드)
├── apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/tool-handlers.ts
│   └── + canvasAction 핸들러 + DSL 파서
├── apps/web/src/domains/ai-management/frontend/hooks/
│   └── + use-canvas-action-executor.ts (DSL 실행기)
```

**도구 스키마 — DSL 방식**:
```typescript
export const canvasActionTool = {
  description: `Execute canvas UI actions (view/selection/panel) using a simple DSL.
  Does NOT handle block layout — use renderCanvasdown for group, move, resize.

  Actions (can be chained with ;):
  - select [blockMountId, ...]     — Select blocks
  - deselect                       — Clear selection
  - open-editor [blockMountId]     — Open editor panel for block
  - close-editor                   — Close editor panel
  - navigate [pageId]              — Navigate to page
  - zoom-to-fit                    — Fit all blocks in view
  - zoom-to [blockMountId]         — Zoom to specific block
  - pan [x] [y]                    — Pan canvas viewport

  (group, ungroup, move → renderCanvasdown Patch DSL로 처리)

  Examples:
  - "select abc123, def456; zoom-to abc123"
  - "zoom-to abc123; open-editor abc123"
  - "navigate page-xyz; zoom-to-fit"`,
  inputSchema: z.object({
    actions: z.string().describe('Canvas action DSL string (semicolon-separated)'),
  }),
};
```

**구현 핵심**:
- select/deselect/zoom/pan/editor/navigate 등 **UI 전용** 액션만 담당
- group, move, resize → **renderCanvasdown** Patch DSL (`@zone`, `@move`, `@resize`)으로 처리
- 기존 React Flow 훅들 (`setNodes`, `fitView`, `setCenter` 등)을 DSL 명령어에 매핑

---

### Episode 10: 블록별 액션 — "이미지 찾아줘, PPT 만들어줘"
**와우 모먼트**: "이 리서치 내용으로 프레젠테이션 만들어줘" → Sophi가 컨텐츠 분석 → PPT 블록 자동 생성

#### 10-1. 액션 디스커버리 도구
**범위**: 블록별 사용 가능한 액션을 동적으로 조회

```
기존 활용:
├── getBlockTypeDetail (이미 있음, 액션 정보 포함)
└── executeBlockAction (이미 있음)

신규:
├── apps/web/src/domains/ai-management/backend/services/prompt/tools.ts
│   └── + discoverBlockActionsTool (선택된 블록의 실행 가능한 액션만 반환)
```

#### 10-2. 확장 액션 목록

```
기존 액션 (유지):
- youtube: extractScript, summarize
- pdf: extractPdfContent, summarizePdf
- image: imageSearch, generateImage, analyzeImage
- link: summarizeLink
- markdown: summarize
- python: execute

신규 액션 (점진적 추가):
├── image:
│   └── + imageGenerate (DALL-E / Stable Diffusion)
├── video:
│   └── + videoSearch (YouTube / Pexels)
│   └── + videoGenerate (향후)
├── markdown:
│   └── + generatePresentation (PPT 형태 다중 블록 생성)
│   └── + translate
├── python:
│   └── + executeSandbox (안전한 샌드박스 실행)
├── react_preview:
│   └── + webSandbox (웹 프리뷰)
└── 신규 블록 타입:
    └── + browser (Browserbase/Puppeteer 연동, 향후)
```

**PPT 생성 패턴**:
```typescript
// executeBlockAction에서 generatePresentation 호출 시:
// 1. 소스 블록의 content 분석
// 2. 섹션별로 분리
// 3. Canvasdown DSL 생성 (슬라이드 = Zone, 컨텐츠 = markdown 블록)
// 4. renderCanvasdown으로 캔버스에 배치
```

---

## 기술 아키텍처

### 도구 분류 총정리

| 도구명 | 실행위치 | 에피소드 | 설명 |
|--------|---------|---------|------|
| `webSearch` | Server | Ep.1 | 웹 검색 (Grok) |
| `youtubeSearch` | Server | Ep.1 | 유튜브 검색 |
| `renderCanvasdown` | Client | Ep.2 | **핵심** — Canvasdown DSL (Full/Patch) |
| `organizeLayout` | Client | Ep.2 | 레이아웃 재배치 |
| ~~`checkSummaryStatus`~~ | ~~Server~~ | ~~Ep.3~~ | 제거됨 — Status Window에서 컨텍스트로 전달 |
| ~~`triggerSummary`~~ | ~~Server~~ | ~~Ep.3~~ | 제거됨 — 기존 executeBlockAction으로 대체 |
| `speak` | Client | Ep.4 | TTS 음성 출력 |
| `grepBlockContent` | Server | Ep.5 | 블록 내 텍스트 검색 |
| `readBlockLines` | Server | Ep.5 | 블록 라인 읽기 |
| `editBlockLines` | Client | Ep.5 | 블록 라인 수정 |
| `hopSearchVisualize` | Client | Ep.6 | 연결 검색 + 하이라이트 |
| `searchGroup` | Server | Ep.6 | 그룹 검색 |
| `grepEvents` | Server | Ep.7 | 이벤트 검색 |
| `getPageEvents` | Server | Ep.7 | 페이지 이벤트 조회 |
| `canvasAction` | Client | Ep.9 | 캔버스 UI 조작 DSL |
| `discoverBlockActions` | Server | Ep.10 | 블록 액션 디스커버리 |

### 기존 도구 (유지)

| 도구명 | 실행위치 | 설명 |
|--------|---------|------|
| `executeBlockAction` | Client | 블록 액션 실행 |
| `searchBlockByKeywordInPage` | Client | 페이지 내 검색 |
| `getBlockTypeDetail` | Server | 블록 타입 상세 |
| `searchByHop` | Server | 홉 검색 |
| `searchBySemantic` | Server | 시맨틱 검색 |
| `searchBlockTypes` | Server | 블록 타입 검색 |

### 제거된 기존 도구 (Canvasdown·grepBlockContent로 대체)

| 도구명 | 대체 방식 |
|--------|---------|
| ~~`addBlocks`~~ | `renderCanvasdown` Full DSL |
| ~~`updateTitle`~~ | `renderCanvasdown` Patch DSL: `@update id { title: "..." }` |
| ~~`updateContent`~~ | `renderCanvasdown` Patch DSL: `@update id { content: "..." }` |
| ~~`updateProperties`~~ | `renderCanvasdown` Patch DSL: `@update id { color: "blue" }` |
| ~~`connectBlocks`~~ | `renderCanvasdown` Patch DSL: `@connect src -> tgt` |
| ~~`searchBlockByKeyword`~~ | `grepBlockContent` — content 검색 통합, 라인 단위 반환 |

### 총 도구 수: 기존 6개 + 신규 14개 = 20개

> 기존 대비 9개 감소 (개별 조작 도구 5개 제거 + fetchResource, checkSummaryStatus, triggerSummary 미추가 + searchBlockByKeyword → grepBlockContent 통합).
> Canvasdown 통일로 LLM의 도구 선택 부담이 크게 줄어듦.
> 추가 대책: 카테고리별 2-tier 도구 시스템 (meta-tool → sub-tool) 또는
> 프롬프트에서 상황별 활성 도구 필터링 고려.

---

## 릴스 콘텐츠 계획

### 에피소드별 촬영 시나리오

| Ep | 제목 | 와우 모먼트 | 촬영 포인트 |
|----|------|-----------|-----------|
| 0 | 골방 소개 | 작업 환경 공개 | 개발자의 리얼 작업 환경 |
| 1 | "검색해줘" | 음성 → 검색 → 캔버스 자동 정리 | 웹/유튜브 검색 결과가 블록으로 |
| 2 | "정리해줘" | 어지러운 블록 → 깔끔한 레이아웃 | Before/After 극적 변화 |
| 3 | "아직 처리중이에요" | 자동 요약 + 실시간 상태 | 로딩 상태에서 완료까지 |
| 4 | "자비스, 정리해" | 음성 대화 + 동시 작업 | 손 안 대고 캔버스 조작 |
| 5 | "여기 뭐라고 써있어?" | 블록 내 텍스트 검색/수정 | 정밀한 컨텐츠 조작 |
| 6 | "연결된 거 보여줘" | 그래프 탐색 + 하이라이트 | 관계도가 빛나는 순간 |
| 7 | "어제 뭐 했더라?" | 이벤트 기반 작업 회고 | 타임라인 기반 작업 히스토리 |
| 8 | "이 블록 말이야" | 마우스 올린 블록 자동 인식 | 자연스러운 포인팅 인터랙션 |
| 9 | "저거 선택하고 에디터 열어줘" | UI DSL 기반 선택/확대/패널 | 복잡한 UI 조작을 한 문장으로 |
| 10 | "PPT 만들어줘" | 리서치 → 프레젠테이션 자동 | 최종 와우: 종합 데모 |

### 테스트 드라이브 시나리오

**첫 번째 테스트 (Ep.1+2 완성 후)**:
1. "AI 스타트업 트렌드 검색해줘" → webSearch → renderCanvasdown으로 5개 블록 + 엣지 한 번에 생성
2. "이 유튜브 영상도 추가해줘 https://..." → LLM이 URL 판별 → renderCanvasdown으로 @youtube 블록 생성
3. "3열로 정리해줘" → organizeLayout(grid, columns: 3)으로 재배치

---

## 구현 우선순위 및 의존성

```
Episode 1 (웹 검색) ← 독립 (가장 먼저, 가장 큰 임팩트)
  ↓
Episode 2 (Canvasdown) ← Ep.1 결과를 예쁘게 배치
  ↓
Episode 3 (자동 요약) ← 기존 summary-job 시스템 활용
  ↓
Episode 4 (음성) ← Ep.1~3 위에 음성 레이어 추가
  ↓ (여기서 중간 데모 촬영)
Episode 5 (Grep/Read/Edit) ← 독립
Episode 6 (Hop/Group) ← 기존 searchByHop 확장
Episode 7 (Event 저장) ← 기존 EventLog 확장
Episode 8 (마우스 컨텍스트) ← 독립
  ↓
Episode 9 (캔버스 DSL) ← Ep.8 이후 (마우스 + DSL 시너지)
Episode 10 (블록 액션) ← 모든 에피소드 위에 종합
```

---

## 예상 작업량

| 에피소드 | 예상 기간 | 난이도 | 신규 파일 | 수정 파일 |
|---------|---------|-------|---------|---------|
| Ep.1 웹 검색 | 2-3일 | ★★☆ | 0 | 3-4 |
| Ep.2 Canvasdown | 2-3일 | ★★★ | 1-2 | 3-4 |
| Ep.3 자동 요약 | 1-2일 | ★★☆ | 0 | 3-4 |
| Ep.4 음성 | 3-4일 | ★★★ | 3-4 | 3-4 |
| Ep.5 Grep/Read/Edit | 2-3일 | ★★☆ | 0 | 2-3 |
| Ep.6 Hop/Group | 1-2일 | ★☆☆ | 0 | 2-3 |
| Ep.7 Event 저장 | 2-3일 | ★★☆ | 0 | 3-4 |
| Ep.8 마우스 컨텍스트 | 2-3일 | ★★☆ | 1-2 | 3-4 |
| Ep.9 캔버스 DSL | 2-3일 | ★★★ | 1-2 | 2-3 |
| Ep.10 블록 액션 | 3-5일 | ★★★★ | 2-4 | 4-6 |
| **합계** | **~20-30일** | | | |
