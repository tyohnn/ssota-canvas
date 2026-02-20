---
name: Agent V2 context and tool testing
overview: Phase 1 동적 컨텍스트를 시나리오별로 순차 검증한 뒤, Phase 2에서 툴을 한 번에 하나만 활성화하여 개별 검증한다.
todos:
  - id: scenario-1
    content: "동적 컨텍스트 시나리오 1: 빈 컨텍스트 (스킵 — 기본은 작업공간 메타데이터)"
    status: cancelled
  - id: scenario-2
    content: "동적 컨텍스트 시나리오 2: 페이지 정보만 — pageId, workspaceId, orgId만"
    status: completed
  - id: scenario-3
    content: "동적 컨텍스트 시나리오 3: 선택 블록만 — selectedBlockIds"
    status: completed
  - id: scenario-4
    content: "동적 컨텍스트 시나리오 4: Visible 블록만 — visibleBlocks"
    status: completed
  - id: scenario-5
    content: "동적 컨텍스트 시나리오 5: Recent Events — pageId로 서버 주입"
    status: completed
  - id: scenario-6
    content: "동적 컨텍스트 시나리오 6: 전체 — 4개 섹션 모두"
    status: completed
  - id: phase2-tools
    content: "Phase 2: 툴 테스팅 — 한 툴만 남기고 나머지 주석, 순차 검증"
    status: in_progress
  - id: phase2-read
    content: "Phase 2: read 툴 테스팅"
    status: completed
isProject: false
---

# Agent V2 동적 컨텍스트 및 툴 테스팅

## 진행 방식

- **시나리오 1**: 빈 컨텍스트는 스킵 (가장 기본은 작업공간 메타데이터이므로 테스트할 의미 없음).
- **시나리오 2 → 6**: 동적 컨텍스트를 순차적으로 검증. 각 시나리오 통과 후 다음 시나리오 진행.
- **Phase 2**: 동적 컨텍스트 검증 완료 후, 툴을 한 번에 하나만 활성화하고 나머지는 주석 처리하여 개별 툴 검증.

---

## Phase 1: 동적 컨텍스트 테스팅 (순차)


| #   | 시나리오          | clientContext 조건                | 기대 결과 (debug.log `AgentV2 dynamic context` value)                                                                                               |
| --- | ------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 빈 컨텍스트 (스킵)   | —                               | 테스트 안 함 (기본은 작업공간 메타데이터)                                                                                                                        |
| 2   | 페이지 정보만       | pageId, workspaceId, orgId만     | `**Current Page**:` + Page/Workspace/Org ID + 서버 주입(Page/Workspace/Org name, User) → **검증 통과**                                                  |
| 3   | 선택 블록만        | selectedBlocks                  | `**Selected Blocks**:` + 목록 + 엣지 + content_raw·요약 미리보기 (노트 20줄/2,500자, 소스형 content+요약) → **검증 통과** (markdown: Content+엣지 / 유튜브: Summary만 노출 확인) |
| 4   | Visible 블록만   | visibleBlocks                   | `**Visible Blocks`** + 블록 메타 + 엣지(dedupe) + 가까운 5개 content/요약 미리보기 각 2,000자 → **검증 통과**                                                         |
| 5   | Recent Events | pageId 있음 → 서버가 recentEvents 주입 | `**Recent Events`** + 이벤트 줄들 → **검증 통과** (debug.log: 7개 이벤트)                                                                                    |
| 6   | 전체            | 위 항목 모두 유효                      | 4개 섹션 모두 포함 → **검증 통과** (debug.log: Current Page, Selected 1, Visible 6, Recent 7)                                                              |


**최근 debug.log 확인 요약** (context-builder `formatContextBlock` 기준):

- **Current Page**: Page title, Workspace title, Organization name, User "연주환" + ID들 → **검증 통과**.
- **Selected Blocks (유튜브 블록 클릭)**: 1개 (d4d90e14, Type: youtube) + **Summary(요약)** 미리보기 정상 노출 (소스형: source_summary만 있음, content_raw 없음). → **검증 통과**.
- **Visible Blocks**: 2개 유튜브 블록. 1번=selected와 동일(Summary 노출), 2번(73954c7e) Summary 노출. → **검증 통과**.
- **Recent Events**: 13개 이벤트 (block_mount_soft_deleted, tool_call×2, user_utterance, ai_response 등) → **검증 통과**.
- **시나리오 6**: 4개 섹션 모두 포함 (유튜브 블록 선택 시나리오) → **검증 통과**.

**유튜브 블록 클릭 시나리오 검토** (동일 debug.log):

- 선택 블록 1개: Type `youtube`, Title "육체적 관계와 성욕구 | 온나라가 극단적 쾌락에…", **Summary(요약)**만 노출(다국어 source_summary). content_raw 없음 → 소스형 블록 요약 미리보기 **정상**.
- Visible 2개: 동일 유튜브 1개 + 다른 유튜브 1개(Jordan Peterson…), 둘 다 Summary 노출.
- 추출(source_content) 미포함 확인 → 플랜 대로 **요약만** 사용.

---

## Phase 2: 툴 테스팅 (한 툴만 활성화)

- route.ts `tools` 객체에서 테스트할 툴 1개만 남기고 나머지 14개 주석 처리.
- 툴 목록 (검증 순서): read, edit, glob, grep, hop, group, getEvents, grepEvents, createTodos, canvasAction, organizeLayout, renderCanvasdown, patchCanvasdown. (webSearch는 별도 검증 완료.)

---

## (시나리오 1 스킵: 빈 컨텍스트는 기본이 작업공간 메타이므로 미테스트)

## 시나리오2: 페이지 메타데이터

### 테스트 1: 캔버스 비움 + 이벤트 없음 + "안녕, 너를 소개해줘"

- **조건**
  - 입력: "안녕, 너를 소개해줘"
  - 캔버스: 모든 데이터 삭제, 블록 없음
  - 동일 페이지: 이벤트 없음 (빈 상태)
- **결과 (debug.log step 5–6)**
  - Step 5 `buildDynamicContext`: `dynamicContextString`에 **Current Page** 섹션만 포함
  - 내용: Page ID, Organization ID만 출력됨. **Workspace ID 줄 없음.**
  - Step 6 `injectDynamicContext`: 마지막 user 메시지에 `[Context]\n**Current Page**:\n- Page ID: ...\n- Organization ID: ...\n\n---\n\n` + "안녕, 너를 소개해줘" 가 정상 주입됨.

**발견한 문제 (테스트 1 결과)**

- **workspaceId가 동적 컨텍스트에 포함되지 않음** — 이후 해결 완료
- **현상**: `dynamicContextStringFull`에 Workspace ID 줄이 없고, Page ID와 Organization ID만 출력됨.
- **원인 후보**
  1. **URL에 workspaceId 미존재**: 채팅 라우트가 `(dashboard)/r/[orgId]/[pageId]/page.tsx` 형태로 세그먼트에 workspaceId가 없음. `use-chat-v2.ts`는 `useParams()`로 가져오므로 `params.workspaceId`가 없으면 `''`가 되고, `collectClientContext()`가 `workspaceId: ''`를 보냄.
  2. **context-builder**: `formatContextBlock`에서 `if (ctx.workspaceId)`로만 Workspace ID 줄을 넣기 때문에, `workspaceId === ''`이면 출력하지 않음.
- **결론**: 클라이언트가 보내는 `workspaceId`가 비어 있어서 동적 컨텍스트에 포함되지 않음. URL 구조상 params에서 받지 못하는 것이 근본 원인.

**해결 계획 (workspaceId 누락) — Canvas Metadata Context 기반**

- **전제**: 레이아웃/페이지에서 이미 `workspaceId`를 갖는 metadata context가 있음. `CanvasBase`가 `CanvasMetadataProvider value={{ pageId, orgId, workspaceId }}`로 감싸고, 그 안에 `ChatPanelSidebar`가 렌더됨. [canvas-metadata-context.tsx](apps/web/src/domains/canvas-management/frontend/contexts/canvas-metadata-context.tsx)의 `useCanvasMetadata()`로 `pageId`, `orgId`, `workspaceId`를 읽을 수 있음.
- **수정**: [use-chat-v2.ts](apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/use-chat-v2.ts)에서 `useParams()` 제거 후 `useCanvasMetadata()`로 `pageId`, `orgId`, `workspaceId` 주입. `collectClientContext`는 그대로 `{ pageId, workspaceId, orgId, selectedBlockIds, visibleBlocks }` 반환.
- **검증**: 동일 조건에서 전송 후 debug.log step 5의 `dynamicContextStringFull`에 Workspace ID 줄 포함 여부 확인 → 테스트 2에서 완료.

---

### 테스트 2: workspaceId 수정 후 재테스트 (해결 확인)

- **조건**: use-chat-v2를 useCanvasMetadata() 기반으로 수정 후, 동일하게 캔버스 비움 + "안녕 너에 대해서 소개해줘" 전송.
- **결과 (debug.log step 5–6)**
  - Step 5 `buildDynamicContext`: `dynamicContextStringFull`에 **Page ID**, **Workspace ID**, **Organization ID** 세 줄 모두 포함.
  - Step 6: 마지막 user 메시지에 `[Context]\n**Current Page**:\n- Page ID: ...\n- Workspace ID: ...\n- Organization ID: ...\n\n---\n\n` + 사용자 입력이 정상 주입됨.
- **결론**: workspaceId 누락 문제 **해결 완료**. 시나리오 2(페이지 정보만) 통과.

---

## 시나리오3: 선택상태

### 테스트 3: 마크다운 블록 생성 → 뷰포트 가운데 → 선택 상태로 "지금 어떤 블록이 선택됐어?"

- **진행**
  1. 마크다운 블록 생성 후 내용 입력
  2. 마크다운 블록을 viewport 가운데에 두기
  3. 마크다운 블록을 클릭한 상태로 "지금 어떤 블록이 선택됐어?" 입력
- **참고**: 뷰포트 이동해서 시야에서 가리면 어떻게 되는지는 다음에 테스트할 예정 (뷰포트 관련 완전한 테스팅은 아직 아님).

**발견한 문제 (테스트 3 결과)** — 순차 해결 예정

1. **선택된 블록이 동적 컨텍스트/에이전트에 잡히지 않음** ← **먼저 해결**
  - 마크다운 블록이 선택된 상태인데, 에이전트가 “어떤 블록이 선택됐는지”를 인지하지 못함.
2. **블록 생성·내용 입력 이벤트가 이벤트 로그에 저장되지 않음**
  - 블록을 생성하고 내용을 입력한 행위가 Recent Events에 기록되지 않음.
  - (이슈만 넣어 둠. 선택된 블록 문제 해결 후 순차 처리.)

**해결 계획 (1번: 선택된 블록이 들어가지 않는 문제)** — 해결 완료

- **목표**: 사용자가 블록을 선택한 상태로 질문했을 때, `clientContext.selectedBlockIds`가 채팅 요청에 포함되고, 서버의 동적 컨텍스트 **Selected Blocks** 섹션에 반영되어 에이전트가 “지금 선택된 블록”을 인지하도록 함.
- **확인 결과**
  - 클라이언트: `collectClientContext()`는 React Flow `getNodes()`에서 `node.selected`로 수집. 동일 소스를 쓰는 `useCanvasSelection().getSelectedBlocks()`로 통일함.
  - 캔버스: 선택 상태는 React Flow store와 캔버스 모드(single-selection / block-editing)에 있음. `ChatPanelSidebar`는 동일 `ReactFlowProvider` 안에 있어 store 접근 가능.
  - 서버: context-builder는 `selectedBlockIds`를 **Selected Blocks** 섹션으로 이미 포맷함. 클라이언트 전달만 보강.
- **적용한 해결**
  - use-chat-v2.ts: `useCanvasSelection().getSelectedBlocks()`를 1차 소스로 사용 (다중 선택 툴바와 동일 소스).
  - Fallback: store에서 선택이 비어 있을 때, `single-selection`이면 `[mode.blockId]`, `block-editing`이면 `[mode.blockMountId]`를 사용해 포커스된 블록이 컨텍스트에 포함되도록 함.
- **검증**: 테스트 3과 동일 조건으로 재테스트하여 debug.log step 5에 **Selected Blocks** 포함 여부 확인.

---

### 개선: 선택/뷰포트 블록에 풍부한 메타 전달 (blockMountId, type, title)

- **배경**: 선택된 블록·뷰포트에 보이는 블록은 에이전트에게 중요한 맥락이므로, ID만이 아니라 **blockMountId, type, title**을 전달하는 것이 좋음. 뷰포트(visibleBlocks)는 이미 해당 형식으로 전달 중.
- **변경 사항**
  - **클라이언트 (use-chat-v2.ts)**: `clientContext`에 `selectedBlocks: VisibleBlockMeta[]` 추가. `visibleBlocks`와 동일한 형식(blockMountId, blockType, title, optional connectedTo). 선택된 노드에서 `nodeToVisibleMeta`로 생성하여 전송.
  - **서버 (context-builder.ts)**: `DynamicContext.selectedBlocks` 파싱 추가. **Selected Blocks** 섹션 포맷을 **Visible Blocks**와 동일하게 변경 — `1. \`blockMountId\n  - Type: ...\n  - Title: "..."`. 이전처럼` selectedBlockIds`만 오면 fallback으로 ID만 있는 줄도 유지.
- **기대**: debug.log step 5의 `dynamicContextStringFull`에서 **Selected Blocks**가 `Block Mount ID: \`...` 한 줄이 아니라, **Visible Blocks**처럼 Type·Title이 포함된 블록 메타로 출력됨.

---

### 테스트 4: 선택한 블록을 뷰포트 밖으로 두고 질문 — **대성공**

- **진행**
  - 선택한 블록을 뷰포트에서 안 보이게 한 뒤, "현재 선택된 블록의 제목이 뭐야?" 질문.
- **결과**
  - 에이전트가 해당 블록 제목(**"모호한 원형(原型)에서 시작하라"**)을 정확히 답변함.
  - debug.log: `selectedBlockIds` / **Selected Blocks**에 해당 블록이 포함됨. `visibleBlocksCount: 0`, **Visible Blocks**에는 데이터 없음(뷰포트 밖이므로 의도대로).
- **결론**: 선택 블록만 있어도 뷰포트에 없어도 컨텍스트가 잘 전달되고, 풍부한 메타(Type, Title)로 답변이 가능함. 시나리오 3·뷰포트 밖 선택 시나리오 **통과**.

---

## 시나리오4: 뷰포트 상태

### 테스트 5: 뷰포트에 보이도록 블록 선택 후 질문

- **진행**
  - 블록을 뷰포트 안에 보이도록 한 뒤 선택하고, "지금 내가 선택한 블록의 제목이 뭐야?" 등 질문.
- **결과**
  - **selectedBlocks**: 정상 전달됨 (blockMountId, blockId, blockType, title 포함). debug.log step 1·3에서 selectedBlocksCount: 1, selectedBlocksSample/selectedBlocks 확인.
  - **visibleBlocks**: 제대로 나오지 않음. visibleBlocksCount: 0. 뷰포트 안에 블록이 있어도 visible이 비어 있음. 패닝/줌 등으로 왔다 갔다 할 때 감지가 불안정한 것으로 보임.
- **결론**: 선택 블록(selectedBlocks)은 정상. 뷰포트 내 블록(visibleBlocks) 감지 로직 점검 필요.

**피드백 (테스트 5 결과)**

1. **메타데이터 포맷**
  - **요청**: Selected/Visible Blocks 양식에 "Mount Id:" 라벨 추가, Block ID 줄에서 "(for content tools)" 제거.
  - **예시**: `**Selected Blocks**:\n1. Mount Id: \`9680b1b3-...\n  - Type: markdown\n  - Title: ...\n  - Block ID: fcc4abf4-...`
  - **조치**: context-builder 포맷 수정 — "1. Mount Id: ...", "Block ID: ..." 적용. (적용 완료)
2. **블록 타입을 유저에게 노출하지 않기**
  - **요청**: "마크다운" 같은 기술 용어는 유저 입장에서 어렵다. 답변에서 타입명 노출하지 않고, 사용자 친화적 표현만 사용.
  - **조치**: 프롬프트에 "technical block type names (markdown, shape 등) 사용 금지, 'text block'/'note'/'diagram block' 등으로 지칭" 규칙 추가. (적용 완료)
3. **뷰포트 내 블록 감지 로직 점검 및 개선**
  - **현상**: 뷰포트에 블록이 보이는 상태여도 visibleBlocks가 비어 있음. 패닝/줌 시 제대로 나오지 않는 경우 있음.
  - **점검 대상**: [use-chat-v2.ts](apps/web/src/domains/ai-management/frontend/components/chat-panel-sidebar/use-chat-v2.ts)의 `calculateVisibleBlocks`.
  - **현재 로직 요약**:
    - `viewport.zoom < 0.75`이면 **항상 빈 배열** 반환 (줌 아웃 시 visible 없음).
    - 줌 >= 0.75일 때 **모든 노드를 visible로 반환** (실제 뷰포트 경계 계산 없음. 주석: "For simplicity, include all nodes - in production, calculate actual viewport bounds").
  - **개선 방향**:
    - 뷰포트 경계(화면 좌표 → flow 좌표)를 계산하고, 노드 position이 그 안에 있는지로 필터링.
    - React Flow의 `getViewport()` + 노드 위치/크기로 "뷰포트와 교차하는 노드"만 포함.
    - zoom 임계값(0.75) 유지 여부 또는 조정 검토.
  - **다음 단계**: 위 개선 방향으로 구현 후 재테스트.

---

### 변경 계획 (피드백 반영) — 적용 완료

**1. 답변에서 ID를 유저에게 노출하지 않기** — ✅ 적용

- **현상**: 에이전트 답변에 blockMountId가 그대로 노출됨.
- **적용**: [prompt.ts](apps/web/src/app/api/agent/v2/prompt.ts)에 **Do Not Expose Internal IDs** 규칙 추가. 사용자 답변에는 blockMountId, blockId, pageId 등 노출 금지, 블록은 제목/타입 또는 "the selected block" 등으로만 지칭. 예시는 영어로 통일. Remember to 목록에 "Never show ... in your reply" 항목 추가.

**2. blockMountId와 blockId 둘 다 제공하기 (옵션 A)** — ✅ 적용

- **적용**: `VisibleBlockMeta`에 `blockId?` 추가. 클라이언트(use-chat-v2)는 `BlockNodeData`에서 blockId 수집해 전송. 서버 context-builder는 **Selected Blocks** / **Visible Blocks** 포맷에 "Block ID (for content tools): ..." 줄 추가(있을 때만). blockId는 툴 호출용, 유저 답변에는 노출하지 않음(1번과 동일).

**3. selectedBlockIds 제거, selectedBlocks만 전송** — ✅ 적용

- **적용**: 클라이언트는 `selectedBlocks`(메타 포함)만 전송. 서버는 `selectedBlockIds` 파싱 제거, `DynamicContext`와 포맷은 `selectedBlocks`만 사용. route 로그는 `selectedBlocksCount` / `selectedBlocksSample` 사용. ID가 필요하면 서버에서 `selectedBlocks.map(b => b.blockMountId)` 등으로 유도.

---

**다음 테스팅**: 위 반영 후 시나리오/툴 테스트 진행 예정.

---

### Visible Blocks(뷰포트) 문제 해결 — 완료

#### 문제 요약

- **현상**: 뷰포트에서 블록을 **밖으로** 빼도 `visibleBlocksCount: 1`, **Visible Blocks**에 해당 블록이 계속 포함됨. 반대로 뷰포트 안에 넣으면 정상적으로 1개로 나와야 함.
- **원인**: `calculateVisibleBlocks`가 **뷰포트 경계(viewport bounds)로 필터링하지 않고** 모든 노드를 visible로 반환하고 있었음. (테스트 5 피드백 당시: zoom < 0.75면 빈 배열, 그 외에는 “간단히 전 노드 포함” 주석과 함께 실제 뷰포트 계산 미구현.)

#### 해결 내용

1. **Flow 공간 보이는 영역 계산**
  뷰포트 변환 `screen = flow * zoom + (x, y)` → `flow = (screen - (x,y)) / zoom` 로, 화면에 대응하는 **flow 좌표 사각형** `getFlowVisibleRect(viewport, containerWidth, containerHeight)` 를 구함.
2. **노드별 교차 판정**
  노드의 `position` + `measured`/`width`/`height`로 노드 사각형을 만들고, 위 flow 사각형과 **겹치는 노드만** visible로 포함 (`nodeIntersectsRect`).
3. **컨테이너 크기**
  React Flow store의 `width`/`height` 사용, 없으면 `window.innerWidth` / `window.innerHeight` fallback.

### 테스트6 결과


| 상황                           | 기대                                           | 결과 (debug.log)                                                              |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| 블록을 **캔버스(뷰포트) 밖**으로 이동 후 전송 | visibleBlocksCount: 0, Visible Blocks 없음     | ✅ `visibleBlocksCount: 0`, `outViewIds`에 해당 노드, **Visible Blocks** 없음       |
| 블록을 **캔버스 안**으로 넣은 뒤 전송      | visibleBlocksCount: 1, Visible Blocks에 해당 블록 | ✅ `visibleBlocksCount: 1`, `inViewIds`에 해당 노드, **Visible Blocks**에 블록 메타 포함 |


- 해결 과정에서 사용하던 **visible 디버그 로그**는 제거함 (DEBUG_INGEST 전송, `VisibleDebugInfo`/`calculationLog` 제거).

---

### Visible Blocks 엣지 케이스: 줌아웃 시 컨텍스트 폭발 방지 (논의 및 계획)

#### 문제

- 유저가 **엄청 줌아웃**하면 뷰포트 안에 블록이 **100개 이상** 들어갈 수 있음.
- 현재 로직은 “뷰포트와 교차하는 노드”를 전부 컨텍스트에 넣기 때문에, 이 경우 **토큰이 폭발**하고 중요하지 않은 정보까지 다 넘어감.

#### 방향: 뷰포트 중심 + 거리 제한

- “보이는 것”은 유지하되, **뷰포트 중심점 기준으로 일정 거리 이내**만 포함하는 방식이 적절해 보임.
- 블록 크기는 대체로 정해져 있고(유저가 리사이즈할 수 있지만), **거리 임계값을 두면 최대 개수를 ~20개 수준으로 제한**할 수 있음.
- 즉, “뷰포트와 교차”한 노드 중에서 **중심에서 가까운 순으로 정렬 → 상위 N개(예: 20개)만** 컨텍스트에 담음.

#### 컨텍스트에 전달할 정보

- **전체 개수**와 **실제로 담은 개수**를 구분해서 전달하는 것이 좋음.
  - 예: “뷰포트 안에는 **총 120개** 블록이 있었고, 그중 **중심으로부터 거리 X 이내 20개**만 컨텍스트에 포함했습니다.”
- 에이전트가 “지금 보이는 블록이 얼마나 많은지”는 알 수 있고, “일부만 골라서 보여준다”는 것도 명시할 수 있음.
- 제안 포맷:
  - `visibleBlocksTotalInView`: number — 뷰포트와 교차한 블록 전체 개수.
  - `visibleBlocksInContext`: number — 실제로 컨텍스트에 넣은 개수 (거리/개수 제한 적용 후).
  - `visibleBlocks`: VisibleBlockMeta[] — 위 제한을 적용한 목록 (최대 20개 등).
  - (선택) `visibleBlocksDistanceThreshold`: number — 사용한 거리 임계값(flow 단위). 있으면 에이전트가 “거리 X 이내” 해석 가능.

#### 구현 계획 (요약)

1. **뷰포트 중심(flow 좌표)** 계산: 기존 `getFlowVisibleRect`와 동일한 변환으로 `(centerX, centerY)` 구하기.
2. **거리 계산**: 각 노드는 `position` 기준으로 중심과의 거리(유클리드 또는 L∞) 계산. (노드 중심 = position + width/2, height/2 사용 가능.)
3. **2단계 필터**:
  - 1단계: 기존처럼 뷰포트와 교차하는 노드만 추림 → `visibleBlocksTotalInView`.
  - 2단계: 그중 중심과의 거리가 **임계값 이하**인 노드만 남기고, **거리 오름차순 정렬 후 상위 N개(예: 20)**만 사용 → `visibleBlocks`, `visibleBlocksInContext`.
4. **클라이언트/서버**:
  - 클라이언트(`use-visible-blocks` 또는 동일 훅): `visibleBlocksTotalInView`, `visibleBlocksInContext`, `visibleBlocks`(최대 20개) 반환. (임계값은 상수 또는 설정으로.)
  - 서버(context-builder): 동적 컨텍스트 문자열에 “Visible blocks in viewport: X total; Y blocks near center included.” 같은 한 줄 + 기존 **Visible Blocks** 목록 포맷.
5. **임계값/최대 개수**: 블록 평균 크기를 고려해 거리 임계값(flow 단위)과 최대 개수(예: 20)를 정한 뒤, 필요하면 시나리오 테스트로 조정.

---

### 구현 완료 및 테스트 진행

- **Visible Blocks 줌아웃 캡**: 뷰포트 중심 + 거리 정렬 후 최대 20개, `visibleBlocksTotalInView` / `visibleBlocksInContext` 전달 및 프롬프트 반영 완료.
- **엣지 연결 (Connected from / Connected to)**: Selected Blocks·Visible Blocks 모두 **Connected from (sources)**·**Connected to (targets)** 를 source/target 분리해 컨텍스트에 포함. 프롬프트 Context Definitions에 설명 추가 완료.

### 테스트 7: Visible Blocks X/Y 구분 + 엣지 연결 — **완료**

- **조건**: 줌아웃으로 뷰포트에 블록 61개 보이도록 한 뒤, 엣지가 연결된 블록(COMMON → THIS IS MA MAN 등) 포함.
- **질문**: "지금 너한테 몇개의 블록들이 보여?"
- **결과 (debug.log step 5)**
  - `**Visible Blocks**: 61 total in viewport; 20 blocks near center included.` + 20개 블록 메타 나열.
  - 엣지 있는 블록: `Connected to (targets)`, `Connected from (sources)` 줄 정상 포함 (예: 5번 COMMON → targets 1개, 10번 THIS IS MA MAN → sources 1개 / targets 1개).
- **에이전트 답변**: "뷰포트에 총 61개 블록이 보여요. 그중 중심 근처 20개가 자세히 확인됐어요!"
- **결론**: X(61) / Y(20) 구분 및 Connected from·Connected to 포맷 **정상 동작**. 테스트 7 **완료**.

### 테스트 8: Selected Blocks + Visible Blocks 엣지 연결 — **완료**

- **조건**: 엣지 연결된 블록(COMMON → THIS IS MA MAN → 말도 안돼애앵 등) 중 "THIS IS MA MAN" 선택, 뷰포트에 22개 보이도록 줌.
- **결과 (debug.log)**
  - **Selected Blocks**: 선택 블록 1개(THIS IS MA MAN)에 `Connected from (sources): 0e9d9d27-...`, `Connected to (targets): 7bbd6d5d-...` 포함.
  - **Visible Blocks**: 22 total in viewport; 20 blocks near center included. 목록에 엣지 있는 블록들 `Connected from` / `Connected to` 정상 포함.
- **결론**: 시나리오 3·4 엣지 포함 검증 **통과**. 테스트 8 **완료**.
- **다음**: Phase 1 시나리오 5(Recent Events), 6(전체) 테스팅 진행.

---

## 컨텍스트 보강: 페이지·블록 정보 확장 (테스트 8 이후)

**목표**: 동적 컨텍스트에 "초점 데이터"를 바로 알 수 있도록 추가 정보를 넣고, UUID만으로는 부족한 부분을 보완한다.

### 1. 현재 페이지 정보 보강

- **현상**: **Current Page**에는 pageId, workspaceId, orgId(UUID/slug)만 있음.
- **요구**: UUID보다 **페이지 타이틀**, **워크스페이스 타이틀**, **조직 이름**, **유저 프로필명**이 에이전트에게 더 유용함.
- **계획**:
  - 클라이언트 또는 서버에서 pageId/workspaceId/orgId/userId로 **페이지 제목**, **워크스페이스 제목**, **조직 이름**, **유저 프로필명**을 조회.
  - **Current Page** 섹션에 다음을 추가 (ID 줄은 유지). **페이지 타이틀·워크스페이스 title·조직 이름·유저 프로필명 모두 반드시 포함**한다.
    - `- Page title: "..."`
    - `- Workspace title: "..."`
    - `- Organization name: "..."`
    - `- User (profile name): "..."`
  - 데이터 소스·캐싱은 기존 메타데이터/API 구조에 맞춰 결정.

### 2. 선택 블록 / Visible 블록: content 미리보기 추가

- **배경**: 지금은 블록 메타(blockMountId, type, title, 엣지)만 들어가서, **초점 컨텍스트(실제 내용)**를 보려면 `readBlockLines` 등 툴을 써야 함. 메타만으로는 "지금 보고 있는/선택한 데이터"를 바로 알 수 없음.
- **처리 위치**: **모두 서버에서 처리** (트래픽 비용 절감).
- **content 소스**: 블록 content는 tiptap JSON이고, **content_raw**는 이미 나눠진 플레인 텍스트. 소스형 블록은 **요약(source_summary)** 도 사용. **추출(source_content)** 는 컨텍스트에 넣지 않음.
- **일반 노트 블록** (소스 없음):
  - **content_raw만** 사용. 라인 상한 **앞 20줄**, 글자수 상한 **selected 2,500자 / visible 500자**.
- **소스형 블록** (source_id 있음, 요약 등):
  - **Selected인 경우**: **content_raw** 20줄 2,500자 상한 + **요약** 전체(제한 없음). 추출은 넣지 않음.
  - **Visible인 경우** (뷰포트에서 가까운 5개 안에 들어갈 때만): **요약** 2,000자 + **content_raw** 2,000자. 추출은 넣지 않음.
- **공통 규칙**:
  1. **Selected / Visible 겹침**: 같은 블록이 선택이면서 동시에 visible 목록에 있으면 **content 미리보기는 한 번만** 넣는다 (중복 제거 — selected에 넣고 visible 쪽은 비움).
  2. **Visible 중 content 넣는 개수**: visible 블록 최대 20개 중 **뷰포트에서 가까운 5개만** 위 content/요약 미리보기를 넣고, 나머지 15개는 메타만 (Mount Id, Type, Title, Block ID, Connected from/to).
- **포함할 정보** (블록별):
  - (기존) Mount Id, Type, Title, Block ID, Connected from/to.
  - (추가, 해당 시) 노트는 **content_raw** 미리보기만; 소스형은 **content_raw** + **요약** 각각 라벨 달아서 (예: `Content: ...`, `Summary: ...`). 전체 글자수/라인수 표시는 선택.
- **토큰/길이**: 위 상한으로 컨텍스트 폭발 방지. 더 필요 시 에이전트가 readBlockLines 등으로 요청.

### 3. 검증

- **Current Page**: debug.log **Current Page**에 Page title, Workspace title, Organization name, User (profile name)이 포함되는지 확인.
- **일반 노트 selected**: content_raw만 20줄·2,500자 상한으로 들어가는지 확인.
- **소스형 selected**: content_raw 20줄 2,500자 + 요약 20줄 2,500자 들어가고, 추출은 없는지 확인.
- **소스형 visible (5개)**: 요약 2,000자 + content_raw 2,000자 들어가고, 추출은 없는지 확인.
- **Visible 5개 / 겹침**: 뷰포트 가까운 5개만 content/요약 포함, 나머지 메타만. selected와 겹치면 한 번만 포함되는지 확인.
- **서버 처리**: content·요약 조회·자르기가 모두 서버에서 이루어지는지 확인.

### 테스트 9: 컨텍스트 보강 검증 — 완료

**조건**: 유튜브 블록 1개 선택, 뷰포트에 2개 visible. 동일 블록에 사용자 노트(content_raw) 추가 후 요청.

**검증 과정 (debug.log `formatContextBlock` 기준)**:


| 항목                        | 기대                                                     | 결과                                                                                                                                  |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Current Page**          | Page/Workspace/Org/User 이름 + ID                        | ✅ 8줄: Page title "Welcome", Workspace "Default Workspace", Organization "SSOTA Labs, Inc", User "연주환" + 3개 ID                       |
| **Selected Blocks (소스형)** | Summary + Content(content_raw) 각 20줄/2,500자, 추출 미포함    | ✅ 1개(d4d90e14, youtube): **Summary**(source_summary) + **Content:** `아 나도 진심 이렇게 되고 싶은데, 어떻게 하면 할 수 있지?` — content_raw 정상 노출, 추출 없음 |
| **Visible Blocks**        | 가까운 5개까지 Summary/Content 500자, 겹침 시 selected에만 content | ✅ 2개: 1번(73954c7e) Summary만, 2번(d4d90e14=selected) Summary+Content — 서버에서 content 한 번만 조회·공유하여 양쪽에 표시                               |
| **Recent Events**         | pageId 있으면 서버 주입, ~15개                                 | ✅ 15개 (block_updated, ai_response, user_utterance 등)                                                                                |
| **서버 처리**                 | content/요약 조회·truncate 모두 서버                           | ✅ getBlockContentPreviews(route) → blockContentPreviews 포맷(context-builder)                                                         |


**결론**: 컨텍스트 보강(페이지 이름·블록 content/요약 미리보기·Recent Events) **검증 통과**. 소스형(유튜브) 선택 시 **Summary + Content** 둘 다 정상 포함됨.

---

## read 테스트 — 완료

**결과: read 툴 검증 통과.**

- **route.ts**: `read: createReadBlockLinesTool(blockSearchRepo, { pageId })` 등록됨.
- **전제 조건**: 블록 1개 선택, 해당 블록에 content_raw(또는 source_content/source_summary)가 DB에 존재.
- **테스트 절차**: 1) 마크다운 블록 생성 후 내용 입력. 2) 해당 블록 선택. 3) "선택한 블록 내용 처음 10줄 읽어줘" 입력. 4) read만 활성화한 상태에서 에이전트가 read 호출 → 서버 execute 반환 → 채팅에 라인 번호 붙은 텍스트 노출 확인.

### read 관련 수정 사항 (테스트 완료 후 반영)


| 항목                        | 이전                   | 변경                                                     |
| ------------------------- | -------------------- | ------------------------------------------------------ |
| read 툴 limit (서비스)        | 20 lines, 2000 chars | **50 lines, 5000 chars** (read-block-lines.service.ts) |
| read 툴 schema/description | 20 lines, 2000 chars | **50 lines, 5000 chars** (readBlockLines/index.ts)     |
| prompt read 안내            | (없음)                 | "up to 50 lines, 5000 chars per call" 추가               |


### 컨텍스트·프롬프트 관련 수정 (동일 기간)


| 항목                   | 변경                                                                 |
| -------------------- | ------------------------------------------------------------------ |
| Visible block chars  | 500 → **2,000** (CONTEXT_VISIBLE_MAX_CHARS, block-content-preview) |
| Selected summary     | note_content만 20줄/2,500자; **summary는 전체** (99_999/999_999, 변경 없음)  |
| Conversation context | 합침·간소화, 지시대명사 해결(Selected→Visible 우선순위), 맥락에 맞는 소개만                |
| Personality          | 5개 불릿 축약                                                           |


---

## Phase 2: 툴 테스팅 계획 (표)

**진행 방식**: `apps/web/src/app/api/agent/v2/route.ts`의 `tools` 객체에서 **테스트할 툴 1개만 남기고 나머지 14개는 주석 처리**한 뒤, 해당 툴만 호출되도록 유도하는 사용자 입력으로 검증. 통과 후 다음 툴로 순차 진행.

**공통 전제**:

- 동적 컨텍스트는 Phase 1 완료 상태(시나리오 6 통과)로 **전체(Current Page, Selected Blocks, Visible Blocks, Recent Events)** 가 주입된 채로 테스트.
- 각 툴 테스트 시 **해당 툴만** 활성화되어 있어야 하며, 에이전트가 다른 툴을 호출하려 하면 호출 불가(주석 처리됨)로 실패하므로, 입력은 **반드시 해당 툴 사용을 유도**하는 문장으로 구성.

---

### xaiSearch 동작 검증 완료

**xaiSearch**는 Phase 2 툴 중 서버 실행·스트리밍 방식으로 동작하며, 아래와 같이 구현·검증 완료된 상태다.

#### 서버

- **모델**: `grok-4-1-fast-reasoning` (xAI Responses API), `xai.responses(XAI_SEARCH_MODEL)`.
- **실행**: `executeXaiSearch` (xai-search.service.ts) — `streamText`로 웹 검색·X 검색 툴(`web_search`, `x_search`) 호출, `fullStream`에서 `text-delta`·`source`·`tool-result` 수집.
- **반환**: `sources`(url, title, domain, faviconUrl) + `summary`(마크다운 요약). preliminary yield(검색 중) → 최종 yield.
- **라우트**: route.ts에서 xaiSearch는 **스트리밍 툴**로 등록되어, execute가 AsyncGenerator를 반환하고 툴 결과가 스트림으로 클라이언트에 전달됨.

#### 클라이언트

- **메시지 파트**: 어시스턴트 메시지에 `type: 'tool-xaiSearch'`, `state: 'output-available'`, `input: { query }`, `output: { sources, summary }` 형태로 도착.
- **렌더링**: `ChatPanelToolPart` → `XaiSearchAccordion` (tool-part/xaiSearch). 아코디언 열면 요약(Streamdown, 스크롤 가능) + 소스 목록(도메인만 클릭 가능, 인덱스 텍스트 없음).
- **순서**: `chat-panel-messages`에서 **parts 배열 순서대로** 렌더링하므로, 툴(검색 아코디언)이 최종 텍스트 응답 **위에** 오도록 되어 있음.

#### UX

- **step-start 전**: 사용자 입력 후 첫 `step-start` 파트가 오기 전까지 Shimmer **"Thinking..."** 표시.
- **검색 중**: 툴 파트는 output 전에도 **"Searching {query}"**가 바로 표시됨(Thinking 대신).
- **결과**: 아코디언 기본 열림, 요약 영역 `max-h-48 overflow-y-auto`, 소스는 링크 텍스트 = 도메인만.

#### 검증 요약


| 항목                                           | 상태  |
| -------------------------------------------- | --- |
| 에이전트가 xaiSearch 호출                           | ✅   |
| 스트림에 tool call + output(sources, summary) 반영 | ✅   |
| 채팅 패널에 검색 아코디언·요약·소스 표시                      | ✅   |
| 툴 결과가 최종 텍스트 위에 표시                           | ✅   |
| 검색 중 "Searching {query}" 즉시 표시               | ✅   |


---


| #   | 툴 이름                 | 테스트 조건 (입력 · 캔버스 · 페이지 상태)                                                               | 기대 결과                                                                                     | 검증 방법                                                                                                    |
| --- | -------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **read**             | 입력: "선택한 블록 내용 처음 10줄 읽어줘". 캔버스: 블록 1개 선택, content_raw 10줄 이상.                           | 에이전트가 read만 호출(blockMountId, startLine/endLine). 라인 번호 붙은 텍스트가 채팅에 노출.                    | ✅ **완료** (50 lines, 5000 chars per call)                                                                 |
| 2   | **edit**             | 입력: "선택한 블록 1번 줄 내용을 '수정된 첫 줄'로 바꿔줘". 캔버스: 블록 1개 선택, content_raw 1줄 이상.                  | 에이전트가 edit만 호출(operation: replace, startLine: 1, newContent). 클라이언트에서 편집 실행, 블록 내용 변경.    | edit 툴 호출 1회. 클라이언트 처리 후 해당 블록 content_raw 1줄 변경 확인. 이벤트 로그 tool_call (edit).                            |
| 3   | **glob**             | 입력: "이 페이지에 마크다운 블록이 몇 개 있어? 목록 알려줘". 캔버스: 마크다운 블록 2개 이상.                                | 에이전트가 glob만 호출. blockTypes 또는 query로 검색, blockMountId·blockType·title 목록 반환.              | 이벤트 로그 `toolName: 'glob'`, 결과에 blocks 목록. createGlobBlocksTool 정상 반환.                                    |
| 4   | **grep**             | 입력: "이 페이지 블록 내용 중 'TODO' 들어간 곳 찾아줘". 캔버스: 마크다운 등 content_raw에 "TODO"가 포함된 블록이 최소 1개 있음. | 에이전트가 grep만 호출. blockMountId, 라인 번호, 매칭 줄+주변 컨텍스트가 반환되어 채팅에 요약.                           | debug.log/이벤트 로그에 `toolName: 'grep'`, 결과에 matches 배열. createGrepBlockContentTool 정상 반환.                  |
| 5   | **hop**              | 입력: "지금 선택한 블록에서 엣지로 1홉 연결된 블록들 알려줘". 캔버스: 엣지로 연결된 블록 2개 이상, 한 블록 선택.                    | 에이전트가 hop만 호출(startBlockMountId, hops: 1). byHop/blockMountIds 반환.                        | 이벤트 로그 `toolName: 'hop'`, 결과에 연결 블록 정보. createHopSearchTool 정상 반환.                                       |
| 6   | **group**            | 입력: "이 그룹(zone) 안에 어떤 블록들이 있어?". 캔버스: zone 안에 자식 블록 1개 이상, zone 또는 자식 선택.                | 에이전트가 group만 호출(groupBlockMountId). 자식 blockMountId·blockType·title 목록 반환.                | 이벤트 로그 `toolName: 'group'`, 결과에 children. createSearchGroupTool 정상 반환.                                   |
| 7   | **getEvents**        | 입력: "이 페이지 최근 활동 내역 보여줘". 캔버스: 과거 채팅/툴 호출 등 이벤트가 쌓인 페이지.                                 | 에이전트가 getEvents만 호출. 시간순 이벤트( user_utterance, tool_call, ai_response 등) 요약 반환.            | 이벤트 로그 `toolName: 'getEvents'`, 결과에 events 또는 grouped. createGetPageEventsTool execute 정상.               |
| 8   | **grepEvents**       | 입력: "대화 중 '검색'이라는 단어 나온 이벤트 찾아줘". 캔버스: 이벤트 로그에 '검색' 포함된 메시지가 있음.                         | 에이전트가 grepEvents만 호출(query). BM25 검색 결과로 매칭 이벤트 요약 반환.                                    | 이벤트 로그 `toolName: 'grepEvents'`, 결과에 matches. createGrepEventsTool execute 정상.                           |
| 9   | **createTodos**      | 입력: "이 작업 3단계로 나눠서 할 일 목록 만들어줘: 1 블록 정리, 2 요약 블록 추가, 3 레이아웃 정리".                         | 에이전트가 createTodos만 호출(todos 배열 3개). 채팅에 할 일 목록이 정리되어 반환.                                  | 이벤트 로그 `toolName: 'createTodos'`, 결과에 todos. createTodosTool은 클라이언트만 반환(Status Window 없음)이면 OK.          |
| 10  | **canvasAction**     | 입력: "지금 선택한 블록으로 뷰포트 줌해줘" 또는 "캔버스 전체가 보이게 fit 해줘". 캔버스: 블록 1개 선택 또는 복수 블록.               | 에이전트가 canvasAction만 호출(action: zoomTo, zoomTarget: block 또는 fit). 클라이언트에서 뷰포트 이동/줌 적용.    | canvasAction 툴 호출 1회. 클라이언트에서 zoomTo/fit 실행, 화면에 줌/패닝 반영 확인. 이벤트 로그 tool_call (canvasAction).            |
| 11  | **organizeLayout**   | 입력: "선택한 블록들 그리드로 3열 정렬해줘". 캔버스: 같은 레이어의 블록 2개 이상 선택.                                    | 에이전트가 organizeLayout만 호출(type: grid, options: { columns: 3 }). 클라이언트에서 레이아웃 실행, 블록 위치 변경. | organizeLayout 툴 호출 1회. 캔버스 상 블록이 그리드 형태로 재배치됨. 이벤트 로그 tool_call (organizeLayout).                       |
| 12  | **renderCanvasdown** | 입력: "캔버스에 마크다운 블록 하나 추가해줘, 제목은 '테스트 블록'으로". 캔버스: 빈 상태 또는 기존 블록 있음.                       | 에이전트가 renderCanvasdown만 호출. 클라이언트에서 Canvasdown 실행 후 새 블록이 캔버스에 생성됨.                       | use-chat-v2에서 renderCanvasdown 툴 실행 로그/결과. 캔버스에 해당 블록 노드 생성 확인. 이벤트 로그에 tool_call (renderCanvasdown) 기록. |
| 13  | **patchCanvasdown**  | 입력: "방금 만든 블록(또는 선택된 블록) 제목을 '수정된 제목'으로 바꿔줘". 캔버스: 블록 1개 이상 존재, 필요 시 해당 블록 선택.           | 에이전트가 patchCanvasdown만 호출. 클라이언트에서 패치 실행 후 블록 제목/속성 변경 반영.                                | patchCanvasdown 툴 호출 1회, 캔버스 상 해당 블록 title 등 변경 확인. 이벤트 로그 tool_call (patchCanvasdown).                  |


---

### Phase 2 검증 시 공통 확인 사항

- **route.ts 수정**: 해당 회차 툴만 `tools: { [해당툴]: ... }` 남기고 나머지 키는 주석 처리. 저장 후 요청 1회 보내서 **해당 툴만** 호출되는지 확인.
- **서버 실행 툴** (read, glob, grep, hop, group, getEvents, grepEvents): route 내 execute 호출 → 이벤트 로그 `logToolCall`에 toolName·args·result·success 기록 여부.
- **클라이언트 실행 툴** (edit, createTodos, canvasAction, organizeLayout, renderCanvasdown, patchCanvasdown): use-chat-v2(또는 해당 훅)에서 toolName 분기 후 실행 → 캔버스/UI 변경 또는 반환값이 스트림에 포함되는지.
- **실패 시**: 해당 툴만 활성화된 상태에서 다른 툴을 호출하려 하면 스키마/실행 오류가 날 수 있음. 이 경우 사용자 입력을 더 명확히 해당 툴 유도 문장으로 바꿔 재시도.

