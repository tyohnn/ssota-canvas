---
name: Phase 1 Implementation
overview: Sophie Agent Phase 1 구현 계획 — 메인 에이전트가 서브 에이전트 없이 모든 핵심 작업(검색, 캔버스 조작, 블록 읽기/쓰기, 레이아웃 등)을 직접 수행할 수 있는 상태를 만든다. 13개 Step을 4개 Checkpoint로 묶어 단계별 구현-테스트를 진행한다.
todos:
  - id: step-1-1
    content: "Step 1-1: 프롬프트 캐싱 구조 분리 — prompt.ts 재구조화 + context-builder.ts 신규 + route.ts 동적 컨텍스트 주입 구조"
    status: completed
  - id: step-1-2
    content: "Step 1-2: 기본 컨텍스트 레이어 — use-chat-v2.ts에서 viewport/selection 수집, context-builder.ts에서 visibleBlocks/selectedBlockIds 처리, prompt.ts에 해석 규칙 추가"
    status: completed
  - id: step-1-3
    content: "Step 1-3: 웹/X 검색 — xAI 네이티브 webSearch/xSearch를 메인 에이전트에 직접 등록, 기존 search 서브에이전트 제거"
    status: completed
  - id: step-1-4
    content: "Step 1-4: Canvasdown 도구 — renderCanvasdownTool + patchCanvasdownTool 정의, 클라이언트 tool-handlers.ts에서 canvasdown executor 연동"
    status: completed
  - id: step-1-5
    content: "Step 1-5: 블록 검색/읽기 — grepBlockContent + globBlocks + readBlockLines 서버사이드 tool executor 구현"
    status: completed
  - id: step-1-6
    content: "Step 1-6: 블록 수정 — editBlockLines 클라이언트사이드 tool handler 구현"
    status: completed
  - id: step-1-7
    content: "Step 1-7: 연결 검색 — hopSearch + searchGroup + searchBySemantic 서버사이드 tool executor 구현"
    status: completed
  - id: step-1-8
    content: "Step 1-8: 레이아웃 정리 — organizeLayout 클라이언트사이드 tool handler 구현"
    status: pending
  - id: step-1-9
    content: "Step 1-9: 작업 관리 — createTodos 클라이언트사이드 tool handler 구현"
    status: pending
  - id: step-1-11
    content: "Step 1-11: 캔버스 UI 조작 — canvasAction 클라이언트사이드 tool handler 구현"
    status: pending
  - id: step-1-12
    content: "Step 1-12: activeJobs 컨텍스트 — Status Window 연동, context-builder.ts에 activeJobs 추가"
    status: pending
  - id: step-1-13
    content: "Step 1-13: 이벤트 저장/조회 — grepEvents + getPageEvents tool executor + recentEvents 동적 컨텍스트"
    status: pending
isProject: false
---

# Phase 1: 메인 에이전트 단독 구동 — 구현 계획

## Global Rules

- **All prompts in English**: Every system prompt, tool description, and DSL rule in `prompt.ts` and `tools.ts` MUST be written in English. Korean is only used in user-facing UI labels, NOT in LLM-facing prompts.
- **Reference Visual Summarizer prompt patterns**: The existing Visual Summarizer already has a well-structured Canvasdown prompt. Use the following files as the primary reference for Canvasdown DSL syntax, tool schema design, and prompt engineering patterns:
  - `[apps/web/src/domains/ai-actions/backend/prompt/visual-summary/tools.ts](apps/web/src/domains/ai-actions/backend/prompt/visual-summary/tools.ts)` — `renderCanvasdownTool` schema with full DSL syntax documentation, patch rules, ID mapping rules, error handling
  - `[apps/web/src/domains/ai-actions/backend/services/visual-summary/prompt-builder.service.ts](apps/web/src/domains/ai-actions/backend/services/visual-summary/prompt-builder.service.ts)` — `buildVisualSummarySystemPrompt()` with structured workflow (Plan -> Skeleton -> Fill -> Connect), Canvasdown block type reference, edge marker reference, critical rules section
  - Key patterns to reuse: DSL syntax block, available block types, edge markers table, patch @update critical rules (no `->` in content), blockIdMap mapping rules, error handling section

## Current State

- **Agent V2** (`/api/agent/v2/`): xAI Grok `grok-4-1-fast-reasoning` streaming, web_search + x_search 네이티브 등록, renderCanvasdown/patchCanvasdown 클라이언트 실행
- **Agent V1** (`/api/agent/`): OpenAI-based, client-side tool handler pattern + context assembly (legacy)
- **Canvasdown**: `@ssota-labs/canvasdown-reactflow` package + executor 구현 완료. Chat Panel `onToolCall`에서 실행, addToolOutput으로 결과 전달. 배치는 캔버스 오른쪽 끝 블록 기준
- **Chat Panel**: Reasoning 파트 렌더링 (Reasoning/ReasoningContent/ReasoningTrigger), 스트리밍 시 자동 펼침/완료 후 접힘
- **Visual Summarizer**: Production-grade Canvasdown prompt + tool schemas (reference for Step 1-4)
- **DB**: `blocks`, `block_mounts`, `edges` tables with Drizzle ORM definitions; `blocks.source_id` → `sources`, `source_summaries` (source-management 스키마)
- **Step 1-5 완료**: grepBlockContent, globBlocks, readBlockLines 서버사이드 구현 (ai-management 도메인). content_raw 외에 source_content, source_summary 연동.
- **Step 1-6 완료**: editBlockLines 클라이언트사이드 구현. useReactFlow + useUpdateBlockContent, tiptapToMarkdown/convertMarkdownToTiptapJSON, applyLineEdit(replace/insert/delete). route.ts에는 execute 없이 툴만 등록.
- **Step 1-7 완료**: hopSearch, searchGroup, searchBySemantic 서버사이드 구현. **ConnectionSearchRepository** (ai-management)로 엣지/블록마운트 조회 캡슐화(edge·block-mount 도메인 레포 직접 의존 제거). hopSearch 결과에 엣지 라벨·스타일(edges[].label, stroke, strokeWidth) 포함. searchBySemantic은 MVP 스텁.

## Implementation Notes (Checkpoint A 완료 후)

### Prompt 개선 (웹 검색 유도)

- **Information Freshness** 원칙 추가: 실세계 주제(회사, 제품, 트렌드, 뉴스)에 대해 web_search 먼저 사용
- **Actively Gather Information** 워크플로우 단계 추가

### Canvasdown 도구

- **ZONE PARSING 규칙**: `@zone` 블록은 속성 `}`로 반드시 닫은 뒤 자식 블록 작성 (파싱 에러 방지)
- **Tool Result**: use-chat-v2.ts에서 addToolOutput으로 성공/실패 모두 전달
- **배치 기준**: anchor 없을 때 캔버스 가장 오른쪽 블록(또는 그룹 내부면 부모 그룹) 기준으로 배치

### Chat Panel UX

- **Reasoning 렌더링**: `types.ts`에 ReasoningPart 추가, `chat-panel-messages.tsx`에서 Reasoning 컴포넌트로 추론 과정 표시. 스트리밍 중 자동 펼침, 완료 후 자동 접힘

### 알려진 이슈

- **웹 검색 미호출**: 실세계 주제 요청 시에도 모델이 web_search를 생략하고 바로 renderCanvasdown만 호출하는 경우 있음. 프롬프트 개선 여지 있음

---

## Checkpoint 구조

```mermaid
graph LR
    subgraph CPA ["Checkpoint A: 검색 + 캔버스 생성"]
        S11["1-1 프롬프트 구조 분리"]
        S12["1-2 기본 컨텍스트"]
        S13["1-3 웹/X 검색"]
        S14["1-4 Canvasdown"]
    end
    subgraph CPB ["Checkpoint B: 캔버스 탐색"]
        S15["1-5 grep/glob/read"]
        S16["1-6 editBlockLines"]
        S17["1-7 hop/group/semantic"]
    end
    subgraph CPC ["Checkpoint C: 캔버스 자유 조작"]
        S18["1-8 organizeLayout"]
        S19["1-9 createTodos"]
        S111["1-11 canvasAction"]
    end
    subgraph CPD ["Checkpoint D: 맥락 + 히스토리"]
        S112["1-12 activeJobs"]
        S113["1-13 이벤트/recentEvents"]
    end
    S11 --> S12
    S11 --> S13
    S12 --> S14
    S12 --> S15
    S15 --> S16
    S12 --> S17
    S14 --> S18
    S11 --> S19
    S12 --> S111
    S12 --> S112
    S11 --> S113
```



---

## Step 1-1. 프롬프트 캐싱 구조 분리

### 목표

system prompt(정적)와 user message metadata(동적) 분리. 프롬프트 캐싱 효율 보장.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — Static system prompt restructure (**ALL in English**)
  - Sophie character/personality
  - SSOTA core concepts (Block, Edge, Canvas, BlockMount)
  - Tool usage rules (per-tool schema rules) — incrementally added per Step
  - Work rules (communication, error handling, language matching)
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — user message에 동적 컨텍스트 주입 구조
  - `lastUserMessage.metadata.clientContext` 파싱 (V1 패턴 참고)
  - 동적 컨텍스트를 user message 앞에 `[Context]` 블록으로 주입
- `**apps/web/src/app/api/agent/v2/context-builder.ts**` (신규) — 동적 컨텍스트 조립
  - `buildDynamicContext(clientContext)` 함수
  - 초기: 빈 컨텍스트 반환 (Step별로 필드 추가)

### 핵심 구현

```typescript
// context-builder.ts
export interface DynamicContext {
  // Step 1-2에서 추가
  // selectedBlockIds?: string[];
  // visibleBlocks?: VisibleBlockMeta[];
}

export function buildDynamicContext(clientContext: unknown): string {
  // 초기: 빈 문자열 반환
  return "";
}
```

```typescript
// route.ts 변경 — 동적 컨텍스트 주입 구조
const { messages, clientContext } = await req.json();
const dynamicCtx = buildDynamicContext(clientContext);

// user message의 마지막에 동적 컨텍스트 주입
const enrichedMessages = injectDynamicContext(modelMessages, dynamicCtx);
```

### 테스트

- system prompt가 변하지 않는 상태에서 여러 요청을 보내도 동일한 prefix 유지 확인
- `buildDynamicContext`가 빈 컨텍스트에서도 에러 없이 동작
- 기존 search 기능 regression 없음

---

## Step 1-2. 기본 컨텍스트 레이어 (Viewport + 선택 블록)

### 목표

에이전트가 "지금 캔버스에 뭐가 있는지" 알 수 있게 한다.

### 변경 파일

- `**apps/web/src/app/api/agent/v2/context-builder.ts**` — visibleBlocks + selectedBlockIds 추가
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — clientContext 파싱
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — 컨텍스트 해석 규칙 추가
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/use-chat-v2.ts**` — 클라이언트에서 context 수집 및 전송
  - V1의 `use-ai-agent.ts` 패턴 참고: `getSelectedBlocks()`, `getNodes()`, `getViewport()` 활용
  - `sendMessage` 시 `metadata.clientContext`에 포함

### 핵심 구현

```typescript
// context-builder.ts
interface VisibleBlockMeta {
  blockMountId: string;
  blockType: string;
  title: string;
  connectedTo?: string[];
}

export interface DynamicContext {
  selectedBlockIds: string[];
  visibleBlocks: VisibleBlockMeta[];
  visibleEdges?: { source: string; target: string; label?: string }[];
}

export function buildDynamicContext(raw: unknown): string {
  const ctx = parseDynamicContext(raw);
  return formatContextBlock(ctx);
}
```

클라이언트 측 — `use-chat-v2.ts`에서 V1 패턴(`use-ai-agent.ts` lines 77-148)을 차용:

- `useReactFlow()`에서 `getNodes()`, `getViewport()`, `getEdges()` 가져오기
- `selectedBlockIds` = 현재 선택된 블록 ID
- `visibleBlocks` = viewport에 보이는 블록 메타데이터 (title, type, connectedTo)

### Prompt Addition (prompt.ts — in English)

```
## Context Interpretation
- visibleBlocks: Metadata of blocks currently visible on screen (content NOT included).
- selectedBlockIds: List of currently selected block IDs.
- When the user says "this block" or "this one" → refer to selectedBlockIds[0].
- If you need the detailed content of a block, use readBlockLines to retrieve it.
```

### 테스트

- 캔버스에 블록 3개 배치 후 "지금 캔버스에 뭐가 보여?" → 블록 목록으로 답변
- 블록 1개 선택 후 "이 블록이 뭐야?" → 선택된 블록 정보로 답변
- clientContext 없는 요청도 에러 없이 동작 (하위 호환)

---

## Step 1-3. Global Tool — 웹/X 검색 (메인 에이전트 직접 수행)

### 목표

검색 서브 에이전트를 제거하고, 메인 에이전트가 xAI 네이티브 도구로 직접 검색.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — tools에 `xai.tools.webSearch()`, `xai.tools.xSearch()` 등록, search 서브에이전트 제거
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — 웹/X 검색 사용 규칙
- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — search 관련 타입 정리

### 핵심 구현

```typescript
// route.ts
const result = streamText({
  model: xai.responses(AGENT_MODEL),
  system: SOPHI_V2_SYSTEM_PROMPT,
  messages: enrichedMessages,
  tools: {
    web_search: xai.tools.webSearch(),
    x_search: xai.tools.xSearch(),
    // ... 이후 Step에서 추가되는 커스텀 툴
  },
});
```

### 테스트

- "AI 스타트업 최신 뉴스" → 웹 검색 결과 + 출처 표시
- "xAI에 대한 X 반응" → X 검색 결과 요약
- 검색 없이 일반 질문 → 검색 도구 호출 안 함

---

## Step 1-4. Global Tool — Canvasdown (renderCanvasdown + patchCanvasdown)

### 목표

에이전트가 캔버스에 블록을 생성/수정/연결/이동. **가장 핵심적인 Step**.

### 의존성

기존 Canvasdown 도메인 활용:

- `[apps/web/src/domains/canvasdown/frontend/hooks/use-canvasdown-executor.ts](apps/web/src/domains/canvasdown/frontend/hooks/use-canvasdown-executor.ts)`
- `[apps/web/src/domains/canvasdown/frontend/hooks/renderers/full-renderer.ts](apps/web/src/domains/canvasdown/frontend/hooks/renderers/full-renderer.ts)`
- `[apps/web/src/domains/canvasdown/frontend/hooks/renderers/patch-renderer.ts](apps/web/src/domains/canvasdown/frontend/hooks/renderers/patch-renderer.ts)`

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — renderCanvasdownTool, patchCanvasdownTool 정의 (Zod schema)
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — tools에 등록
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — Canvasdown Full/Patch DSL 문법 + 예시
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/use-chat-v2.ts**` — `onToolCall` 핸들러 추가, Canvasdown executor 연동
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/tool-handlers.ts**` (신규) — V2용 클라이언트 도구 핸들러

### Tool 스키마 (tools.ts)

```typescript
export const renderCanvasdownTool = tool({
  description:
    "Create new blocks on the canvas with layout and edges in a single call. Uses Full DSL mode.",
  parameters: z.object({
    dsl: z.string().describe("Canvasdown Full DSL string"),
    anchorBlockMountId: z.string().optional(),
    position: z.enum(["right", "below"]).default("right").optional(),
  }),
});

export const patchCanvasdownTool = tool({
  description:
    "Modify, delete, connect, move, or resize existing blocks. Uses Patch DSL mode.",
  parameters: z.object({
    dsl: z
      .string()
      .describe(
        "Canvasdown Patch DSL (@update, @delete, @connect, @move, @resize)"
      ),
  }),
});
```

### 클라이언트 핸들러 (use-chat-v2.ts 내 onToolCall)

- `onToolCall`에서 `toolName === 'renderCanvasdown'` / `patchCanvasdown` 분기
- `useCanvasdownContext()`의 executor로 Full/Patch 렌더링 실행
- `addToolOutput({ tool, toolCallId, output })`으로 성공 시 blockIdMap, 실패 시 errorText 전달

### Prompt Addition — Canvasdown DSL Grammar (in English)

Add Full DSL / Patch DSL complete grammar, examples, and rules to prompt.ts as static context.
**Reference**: Directly adapt the DSL syntax section from the Visual Summarizer's `renderCanvasdownTool` description in `[tools.ts](apps/web/src/domains/ai-actions/backend/prompt/visual-summary/tools.ts)` (lines 16-124) and the block type / edge marker / critical rules sections from `[prompt-builder.service.ts](apps/web/src/domains/ai-actions/backend/services/visual-summary/prompt-builder.service.ts)` (lines 24-127). Generalize from visual-summary-specific workflow to a general-purpose agent workflow.

### 테스트

- "마크다운 블록 3개 만들어줘" → `renderCanvasdown` 1회 호출로 3개 블록 배치
- "이 블록 제목 바꿔줘" → `patchCanvasdown`로 @update 실행
- "이 두 블록 연결해줘" → `patchCanvasdown`로 @connect 실행
- DSL 파싱 에러 시 에이전트가 재시도하는지 확인

---

## Step 1-5. Global Tool — 블록 검색/읽기 (grep + glob + read) — 완료

### 목표

에이전트가 블록 content를 검색하고 읽을 수 있게 한다. **서버사이드 도구**.

### 구현 완료 상태

- **grepBlockContent**, **globBlocks**, **readBlockLines** 서버사이드 executor 구현 완료.
- 실행기는 `apps/web/src/app/api/agent/v2/route.ts`에서 등록하며, 실제 로직은 **ai-management 도메인**의 서비스·레포지토리에서 수행.

### 변경 파일 (실제 구현 기준)

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — grepBlockContentTool, globBlocksTool, readBlockLinesTool 정의 (스키마 + 설명)
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — tools 등록, blockSearchRepo 주입 후 executeGrepBlockContent / executeGlobBlocks / executeReadBlockLines 호출
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — 검색/읽기 워크플로우 규칙 및 도구별 옵션 설명
- `**apps/web/src/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface.ts**` — BlockSearchRepository (findByContentPattern, findByMetadata, findContentByBlockMountId, findBySourceContentPattern, findBySourceSummaryPattern, **findSourceContentByBlockMountId**, **findSourceSummaryByBlockMountId**)
- `**apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-block-search.repository.ts**` — Drizzle 구현
- `**apps/web/src/domains/ai-management/backend/services/tools/**`
  - `grep-block-content.service.ts` — 패턴 검색 (content_raw + source_content + source_summary)
  - `glob-blocks.service.ts` — 메타데이터 검색 (query 다중 패턴 + queryMatchMode)
  - `read-block-lines.service.ts` — 라인 범위 읽기 (content_raw / source_content / source_summary)

### 계획 대비 변경 사항: Source 도메인 연동 (content_raw / source_content / source_summary)

구현 과정에서 **소스 도메인(source-management)** 과 연동하여, 블록 본문(content_raw)뿐 아니라 **연결된 소스의 추출 본문(source_content)** 과 **AI 요약(source_summary)** 도 검색·읽기 대상에 포함되었다.


| 도구                   | 추가된 동작                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **grepBlockContent** | `sources` 옵션: `content_raw`(기본), `source_content`, `source_summary` 중 선택. `source_content`는 `blocks.source_id` → `sources.raw_content` 검색, `source_summary`는 `source_summaries.summary` 검색. `summaryLanguages`로 요약 언어 필터. 각 매칭에 `source` 필드 부여.                             |
| **globBlocks**       | 제목 다중 패턴: `query`를 `string                                                                                                                                                                                                                                                  |
| **readBlockLines**   | `source` 옵션: `content_raw`(기본), `source_content`, `source_summary`. `source_content` 시 단일 블록의 `sources.raw_content` 라인 범위 반환, `source_summary` 시 `source_summaries` 한 건(언어 지정 시 해당 언어, 미지정 시 하나) 라인 범위 반환. `summaryLanguage`로 요약 언어 지정. 응답에 `source`, `summaryLanguage` 포함. |


Repository에는 `findBySourceContentPattern`, `findBySourceSummaryPattern`(기존) 외에 단일 블록용 **findSourceContentByBlockMountId**, **findSourceSummaryByBlockMountId** 가 추가됨.

### 서버 구현 핵심 (요약)

- **grep**: 스코프(block_mounts ⋈ blocks) 확정 후, 선택된 source별로 content_raw / sources.raw_content / source_summaries.summary 에서 패턴 검색 → 라인 단위 매칭·컨텍스트 라인 계산 → blockMountId + 라인 + source 반환.
- **glob**: block_mounts ⋈ blocks, 메타데이터(title, blockTypes) 필터. title은 패턴 배열 + queryMatchMode(any/all)로 ILIKE OR/AND.
- **read**: blockMountId(+ pageId)로 단일 블록 조회. source에 따라 findContentByBlockMountId / findSourceContentByBlockMountId / findSourceSummaryByBlockMountId 호출 후 동일한 라인 슬라이스·포맷팅.

DB·스키마: `blocks.source_id` → `sources`, `source_summaries` (public 스키마). [apps/web/src/db/schemas/public/source-management-schema.ts](apps/web/src/db/schemas/public/source-management-schema.ts) 참고.

### 테스트

- "마케팅이라는 단어가 어디에 있어?" → grep 결과 (blockMountId + 라인, source 표시)
- "유튜브 블록 요약에서 OO 검색해줘" → grep sources에 source_summary 포함
- "마크다운 블록 목록 보여줘" → glob 결과 (메타데이터). 다중 제목 패턴 + any/all 지원
- "그 블록 내용 보여줘" / "그 블록 스크립트 처음 10줄 보여줘" → read (source 지정 시 source_content/source_summary)
- 빈 페이지에서 검색 → 빈 결과 (에러 없음)

---

## Step 1-6. Global Tool — 블록 수정 (editBlockLines) — 완료

### 목표

에이전트가 기존 블록의 텍스트를 라인 단위로 수정. **클라이언트사이드 도구**. **기존 캔버스/블록 훅만 재사용**한다.

### 구현 완료 상태

- **editBlockLinesTool** (tools.ts): blockMountId, operation(replace|insert|delete), startLine, endLine?, newContent?
- **use-chat-v2.ts**: onToolCall에서 editBlockLines 분기. useReactFlow(getNode, setNodes) + useUpdateBlockContent, node.data.content → tiptapToMarkdown → applyLineEdit → convertMarkdownToTiptapJSON → updateBlockContent. route.ts에는 execute 없이 툴만 등록(클라이언트 전용).
- **prompt.ts**: Block Edit(editBlockLines) 섹션 추가.

### 사용할 기존 모듈 (모듈화 원칙)

- **useReactFlow()** — getNode, setNodes (ChatPanelSidebar는 ReactFlowProvider 하위이므로 동일 인스턴스 사용)
- **updateNode** — useCanvasdownExecutor와 동일하게 setNodes로 단일 노드 data 갱신하는 useCallback 파생 ([use-canvasdown-executor.ts](apps/web/src/domains/canvasdown/frontend/hooks/use-canvasdown-executor.ts) 94–106행 패턴)
- **useUpdateBlockContent** — [use-block-content-update.ts](apps/web/src/domains/block-management/frontend/hooks/block-property/use-block-content-update.ts), reactFlow: { getNode, updateNode } 주입
- **convertMarkdownToTiptapJSON** — [markdown-to-tiptap.ts](apps/web/src/domains/ai-management/frontend/utils/markdown-to-tiptap.ts)

새 훅은 추가하지 않고, use-chat-v2에서 위 조합으로 editBlockLines 분기만 구현. 라인 연산(replace/insert/delete)은 순수 함수 유틸로 분리 가능.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — editBlockLinesTool 정의
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/use-chat-v2.ts**` — useReactFlow + useUpdateBlockContent 조합, onToolCall에 editBlockLines 분기 (필요 시 tool-handlers.ts에 핸들러만 분리)
- 현재 content 확보: node.data.content(TipTap) → 마크다운 변환 유틸이 있으면 사용 후 라인 편집; 없으면 tiptapToMarkdown 유틸 하나만 추가

세부 흐름·파일 구조: [phase_1_steps_1-6_1-7_detail.plan.md](phase_1_steps_1-6_1-7_detail.plan.md)

### 테스트

- grep로 위치 찾기 → editBlockLines로 수정 → read로 확인
- "두 번째 문단을 한국어로 바꿔줘" 시나리오

---

## Step 1-7. Global Tool — 연결 검색 (hop + group + semantic) — 완료

### 목표

블록 간 연결 관계 탐색 + 의미 기반 검색. **서버사이드 도구**. **AI 도메인은 ConnectionSearchRepository만 의존**한다(edge/block-mount 도메인 레포 직접 사용 안 함).

### 구현 완료 상태

- **ConnectionSearchRepository** (ai-management): hopSearch·searchGroup 전용. `findEdgesByConnectedBlockMountId`, `findEdgesByConnectedBlockMountIdAndPageId`, `findBlockMountsWithBlocksByPageId` — 내부에서 EdgeRepository·BlockMountRepository 위임. **DrizzleConnectionSearchRepository**가 route에서 Edge+BlockMount 인스턴스로 생성되어 executeHopSearch/executeSearchGroup에 주입.
- **hopSearch**: N-hop BFS, direction(out/in/both), hops 1–3, pageId 스코프. 결과 **byHop**에 각 항목당 **edges** 배열(label, stroke, strokeWidth) 포함.
- **searchGroup**: 페이지 내 block_mounts+blocks 조회 후 parent_block_mount_id로 그룹 자식 필터.
- **searchBySemantic**: MVP 스텁(미구현 안내 메시지).

### 사용할 기존 모듈 (모듈화 원칙)

- **hopSearch**: `ConnectionSearchRepository.findEdgesByConnectedBlockMountId` / `findEdgesByConnectedBlockMountIdAndPageId`. N-hop BFS는 ai-management/backend/services/tools/hop-search.service.ts에서 구현.
- **searchGroup**: `ConnectionSearchRepository.findBlockMountsWithBlocksByPageId` 후 서비스에서 parent 필터.
- **searchBySemantic**: ai-management/services/tools/search-by-semantic.service.ts 스텁.

구현 위치: **ai-management/backend/services/tools/** + **ai-management/backend/repositories/** (ConnectionSearchRepository 인터페이스·구현). route.ts에서 connectionSearchRepo 한 번 생성 후 두 실행기에 주입.

### 변경 파일 (실제 구현 기준)

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — hopSearchTool, searchGroupTool, searchBySemanticTool 정의
- `**apps/web/src/domains/ai-management/backend/repositories/**`
  - `interfaces/connection-search.repository.interface.ts` — findEdgesByConnectedBlockMountId, findEdgesByConnectedBlockMountIdAndPageId, findBlockMountsWithBlocksByPageId
  - `implementations/drizzle-connection-search.repository.ts` — EdgeRepository + BlockMountRepository 위임
- `**apps/web/src/domains/ai-management/backend/services/tools/**`
  - `hop-search.service.ts` — ConnectionSearchRepository 주입, N-hop 탐색, byHop에 edges(label, stroke, strokeWidth) 포함
  - `search-group.service.ts` — ConnectionSearchRepository 주입, 그룹 자식 조회
  - `search-by-semantic.service.ts` — MVP 스텁
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — DrizzleConnectionSearchRepository 생성 후 executeHopSearch, executeSearchGroup에 주입
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — Connection & Group Search, Block Edit 섹션(간결 버전)

### 테스트

- "이 블록에 연결된 거 뭐가 있어?" → hopSearch 결과
- "이 그룹 안에 뭐가 있어?" → searchGroup 결과

---

## Step 1-8. Global Tool — 레이아웃 정리 (organizeLayout)

### 목표

기존 블록들 자동 레이아웃 재배치. **클라이언트사이드 도구**.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — organizeLayoutTool 정의
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/tool-handlers.ts**` — organizeLayout 핸들러
  - React Flow 노드 재배치 로직 (grid/flow/tree/mindmap/stack)

### 테스트

- "3열로 정리해줘" → grid 레이아웃 적용

---

## Step 1-9. Global Tool — 작업 관리 (createTodos)

### 목표

에이전트가 복잡한 작업 시 투두 목록 생성. **클라이언트사이드 도구**.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — createTodosTool 정의
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/tool-handlers.ts**` — createTodos 핸들러

### 테스트

- 복잡한 요청 시 투두 목록 생성 확인

---

## Step 1-11. 캔버스 UI 조작 (canvasAction)

### 목표

에이전트가 캔버스 UI를 직접 조작 (선택, 줌, 에디터 열기 등). **클라이언트사이드 도구**.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — canvasActionTool 정의
- `**apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/tool-handlers.ts**` — canvasAction 핸들러
  - select, zoom-to, open-editor, navigate-page 등의 DSL 실행

### 테스트

- "저 블록 선택해줘" → select 실행
- "에디터 열어줘" → open-editor 실행

---

## Step 1-12. 작업 상태 컨텍스트 (Status Window 연동)

### 목표

에이전트가 현재 진행 중인 비동기 작업 상태를 알 수 있게 한다.

### 변경 파일

- `**apps/web/src/app/api/agent/v2/context-builder.ts**` — `activeJobs` 필드 추가
- `**[apps/web/src/app/api/agent/v2/route.ts](apps/web/src/app/api/agent/v2/route.ts)**` — clientContext에서 activeJobs 파싱
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — activeJobs 해석 규칙

### 테스트

- "아까 요약 다 됐어?" → activeJobs 상태 기반 응답

---

## Step 1-13. 이벤트 저장/조회 + recentEvents 컨텍스트

### 목표

핵심 tool call을 이벤트로 저장 + 매 요청마다 recentEvents를 동적 컨텍스트로 전달.

### 변경 파일

- `**[apps/web/src/app/api/agent/v2/tools.ts](apps/web/src/app/api/agent/v2/tools.ts)**` — grepEventsTool, getPageEventsTool 정의
- `**apps/web/src/app/api/agent/v2/tool-executors/**` — event 관련 executor
- `**apps/web/src/app/api/agent/v2/context-builder.ts**` — `recentEvents` 필드 추가
- `**[apps/web/src/app/api/agent/v2/prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)**` — recentEvents 해석 규칙

### 테스트

- "어제 이 페이지에서 뭐 했어?" → 이벤트 로그 기반 응답
- 매 요청 시 recentEvents 포함 확인

---

## 파일 구조 최종 모습

```
apps/web/src/app/api/agent/v2/
├── route.ts                      # 메인 라우트. blockSearchRepo + connectionSearchRepo 주입, grep/glob/read/hopSearch/searchGroup/searchBySemantic 실행
├── prompt.ts                     # 정적 system prompt (캐싱 대상)
├── tools.ts                      # 모든 Tool 정의 (Zod schema)
├── context-builder.ts            # 동적 컨텍스트 조립
└── (tool-executors/ — Step 1-13 이벤트 등 미구현 도구용. hop/group/semantic은 ai-management/services/tools에 구현됨)

apps/web/src/domains/ai-management/backend/
├── repositories/
│   ├── interfaces/
│   │   ├── block-search.repository.interface.ts
│   │   └── connection-search.repository.interface.ts   # hopSearch, searchGroup 전용
│   └── implementations/
│       ├── drizzle-block-search.repository.ts
│       └── drizzle-connection-search.repository.ts    # Edge + BlockMount 위임
└── services/tools/               # 블록 검색/읽기(1-5) + 연결 검색(1-7) 실행기
    ├── grep-block-content.service.ts
    ├── glob-blocks.service.ts
    ├── read-block-lines.service.ts
    ├── hop-search.service.ts
    ├── search-group.service.ts
    ├── search-by-semantic.service.ts
    └── __tests__/

apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/
├── use-chat-v2.ts                # 클라이언트 context 수집 + onToolCall (renderCanvasdown, patchCanvasdown 인라인 핸들러)
├── chat-panel-sidebar.tsx
├── chat-panel-messages.tsx       # Reasoning 파트 렌더링 포함
├── chat-panel-tool-part.tsx
├── types.ts                      # ReasoningPart, CitationItem 등
└── index.ts
```

---

## 실행 순서 및 병렬 작업 가이드

### Week 1 (Checkpoint A 목표)


| 순서  | Step | 작업                                | 예상 소요 | 병렬 가능   |
| --- | ---- | --------------------------------- | ----- | ------- |
| 1   | 1-1  | 프롬프트 구조 분리 + context-builder 스캐폴딩 | 1일    | -       |
| 2   | 1-2  | 기본 컨텍스트 (클라이언트 수집 + 서버 주입)        | 1.5일  | 1-3과 병렬 |
| 3   | 1-3  | 웹/X 검색 (xAI 네이티브 전환)              | 0.5일  | 1-2와 병렬 |
| 4   | 1-4  | Canvasdown 도구 (Full + Patch)      | 2-3일  | -       |


**Checkpoint A 데모**: "AI 스타트업 검색해서 캔버스에 정리해줘"

### Week 2 (Checkpoint B 목표) — 완료


| 순서  | Step | 작업                             | 예상 소요 | 병렬 가능   | 상태  |
| --- | ---- | ------------------------------ | ----- | ------- | --- |
| 5   | 1-5  | grep + glob + read (서버사이드)     | 2-3일  | 1-7과 병렬 | 완료  |
| 6   | 1-7  | hop + group + semantic (서버사이드) | 1.5일  | 1-5와 병렬 | 완료  |
| 7   | 1-6  | editBlockLines (클라이언트사이드)      | 1일    | -       | 완료  |


**Checkpoint B 데모**: "마케팅 단어가 어디에 있어?" → grep → read → "연결된 블록 뭐야?" → hop

### Week 3 (Checkpoint C + D 목표)


| 순서  | Step | 작업                       | 예상 소요 | 병렬 가능         |
| --- | ---- | ------------------------ | ----- | ------------- |
| 8   | 1-8  | organizeLayout           | 1.5일  | 1-9, 1-11과 병렬 |
| 9   | 1-9  | createTodos              | 0.5일  | 1-8과 병렬       |
| 10  | 1-11 | canvasAction             | 2일    | 1-8과 병렬       |
| 11  | 1-12 | activeJobs 컨텍스트          | 1일    | 1-13과 병렬      |
| 12  | 1-13 | 이벤트 저장/조회 + recentEvents | 2일    | 1-12와 병렬      |


**Checkpoint C 데모**: "3열로 정리해줘" → layout / "에디터 열어줘" → canvasAction
**Checkpoint D 데모**: "요약 다 됐어?" → activeJobs / "어제 뭐 했어?" → 이벤트 로그

---

## Step별 진행 방식

각 Step은 다음 순서로 진행:

1. **Tool 정의** (tools.ts에 Zod schema 추가)
2. **서버 구현** (route.ts 등록 + tool-executors/ 구현) 또는 **클라이언트 구현** (tool-handlers.ts)
3. **프롬프트 업데이트** (prompt.ts에 Tool 사용법 추가)
4. **컨텍스트 업데이트** (필요 시 context-builder.ts)
5. **수동 테스트** (채팅으로 시나리오 검증)
6. **코드 리뷰 + 다음 Step**

