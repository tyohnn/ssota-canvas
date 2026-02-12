---
name: ""
overview: ""
todos: []
isProject: false
---

# Phase 1 Step 1-6·1-7 세부 구현 계획 (기존 훅·서비스 활용)

참고: [phase_1_implementation_e0eee83b.plan.md](phase_1_implementation_e0eee83b.plan.md), [Architecture.md](../../docs/plans/app-system/Architecture.md), [sophie-implementation-plan.md](../../docs/plans/sophie-agent/sophie-implementation-plan.md)

**원칙**: 기존에 모듈화된 캔버스·블록 훅과 백엔드 서비스/레포지토리를 최대한 재사용한다. 새 로직은 훅/서비스 조합으로만 추가한다.

---

## Step 1-6: editBlockLines — 기존 훅만 사용

### 사용할 기존 모듈


| 역할                      | 기존 모듈                                                | 위치                                                                                                                                   |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| React Flow 노드 조회/갱신     | `useReactFlow()`                                     | @xyflow/react (캔버스와 동일 Provider 내에서 사용)                                                                                              |
| updateNode 파생           | `setNodes`로 단일 노드 data 갱신 (useCanvasdownExecutor 패턴) | [use-canvasdown-executor.ts](../../apps/web/src/domains/canvasdown/frontend/hooks/use-canvasdown-executor.ts) 94–106행 참고             |
| 블록 콘텐츠 서버 반영 + 낙관적 업데이트 | `useUpdateBlockContent`                              | [use-block-content-update.ts](../../apps/web/src/domains/block-management/frontend/hooks/block-property/use-block-content-update.ts) |
| 마크다운 → TipTap JSON      | `convertMarkdownToTiptapJSON`                        | [markdown-to-tiptap.ts](../../apps/web/src/domains/ai-management/frontend/utils/markdown-to-tiptap.ts)                               |


**참고 패턴**: [useCanvasdownExecutor](../../apps/web/src/domains/canvasdown/frontend/hooks/use-canvasdown-executor.ts)는 `useReactFlow()` → `updateNode` 파생 → `useUpdateBlockContent({ reactFlow: { getNode, updateNode } })`를 사용한다. [use-ai-agent.business.ts](../../apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.business.ts) (85–99행)도 동일하게 `getNode`/`updateNode`로 `useUpdateBlockTitle`, `useUpdateBlockContent`를 구성한다.

### ChatPanelSidebar에서의 사용

`ChatPanelSidebar`는 [CanvasBase](../../apps/web/src/domains/canvas-management/frontend/components/canvas-base.tsx) 안에서 `ReactFlowProvider` 하위에 렌더되므로, `use-chat-v2.ts`에서 동일하게 `useReactFlow()`와 `useUpdateBlockContent()`를 사용할 수 있다.

1. **use-chat-v2.ts**
  - `useReactFlow()`로 `getNode`, `setNodes` 획득.
  - `updateNode`는 useCanvasdownExecutor와 동일하게 `setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...options.data } } : n))` 형태로 `useCallback` 파생.
  - `useUpdateBlockContent({ reactFlow: { getNode, updateNode } })` 호출하여 `updateBlockContent` 획득.
  - `onToolCall` 중 `editBlockLines` 분기에서:
    - 현재 content 획득: `getNode(blockMountId)?.data` (필요 시 TipTap → 마크다운 변환 유틸 사용. 없으면 node.data.content만으로 라인 편집이 어려우면 “먼저 read로 확인” 안내 반환).
    - 라인 연산: replace/insert/delete를 순수 함수(유틸)로 구현해 새 문자열 생성.
    - `convertMarkdownToTiptapJSON(newContent)`로 변환 후 `updateBlockContent({ nodeId: blockMountId, content, blockData, contentRaw: newContent })` 호출.
  - **새 훅 추가 없음**: 위 조합만으로 처리. 공통화가 필요하면 라인 연산만 유틸 함수로 분리 (예: `applyLineEdit(currentText, op, startLine, endLine?, newContent?)`).
2. **tool-handlers.ts (선택)**
  - `handleEditBlockLines(args, context)`를 두고, `context`에 `getNode`, `updateBlockContent`, `addToolOutput` 대행에 필요한 것만 넘기면, use-chat-v2는 이 핸들러만 호출하도록 분리 가능. 이때도 `updateBlockContent`는 use-chat-v2에서 `useUpdateBlockContent`로 만든 것을 context로 넘긴다.
3. **tools.ts / route.ts / prompt.ts**
  - 계획대로 editBlockLinesTool 정의, route에는 클라이언트 전용이므로 execute 미등록, prompt에 사용 규칙 추가.

### 현재 content_raw 확보

- 노드에는 `data.content`(TipTap JSON)가 있음. 라인 단위 편집을 하려면 문자열이 필요하므로:
  - **옵션 A**: 클라이언트에 TipTap → 마크다운 변환 유틸이 있으면 사용해 현재 텍스트 확보 후 라인 연산.
  - **옵션 B**: 서버에 “blockMountId로 content_raw 한 번에 조회” 액션이 있으면, editBlockLines 호출 전에 에이전트가 readBlockLines로 읽어 두고, 클라이언트는 에이전트가 넘긴 “전체 새 content”를 그대로 updateBlockContent에 넣는 방식 (토큰 비용 증가).
  - 권장: 옵션 A. TipTap → 마크다운 변환이 없으면, **유틸 하나만 추가** (예: `tiptapToMarkdown` in block-management or ai-management)하고 나머지는 기존 훅만 사용.

---

## Step 1-7: hopSearch, searchGroup, searchBySemantic — 기존 레포·서비스 활용

### 사용할 기존 모듈


| 도구                      | 기존 모듈                                                                | 위치                                                                                                                                                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hopSearch (N-hop)       | `EdgeRepository.findByConnectedBlockMountId`                         | [edge.repository.interface.ts](../../apps/web/src/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface.ts), [drizzle-edge.repository.ts](../../apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository.ts) |
| hopSearch (1-hop 로직 참고) | `getConnectedBlocks`                                                 | [context-assembly.service.ts](../../apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts) 187–210행 (edges 조회 후 block_mount_id 수집)                                                                                                                          |
| searchGroup (자식 마운트)    | `BlockMountRepository.findByPageIdWithBlocks` 후 parent 필터, 또는 신규 메서드 | [block-mount.repository.interface.ts](../../apps/web/src/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface.ts)                                                                                                                               |
| searchBySemantic        | MVP: 스텁 또는 BlockSearchRepository + 단순 텍스트 유사도                        | 기존 [tool-execution.service.ts](../../apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts) searchBySemantic 스텁 참고                                                                                                                                            |


### 구현 방식

1. **hopSearch**
  - **ai-management/backend/services/tools/hop-search.service.ts** (신규)에서 **EdgeRepository**만 주입받아 N-hop BFS 구현.
  - 매 hop마다 `edgeRepository.findByConnectedBlockMountId(blockMountId)`로 이웃 조회. direction(out/in/both)에 따라 source/target 필터.
  - **context-assembly의 getConnectedBlocks**는 1-hop + 블록 정보 조회까지 하므로, “N-hop ID 목록만 필요”하면 EdgeRepository만으로 충분; “각 hop별 메타데이터”가 필요하면 BlockSearchRepository 또는 기존 블록 조회 서비스를 함께 사용.
2. **searchGroup**
  - **BlockMountRepository**에 `findChildrenByParentBlockMountId(pageId, parentBlockMountId)`가 있으면 해당 메서드 사용.
  - 없으면 `findByPageIdWithBlocks(pageId)` 결과를 서비스 레이어에서 `parent_block_mount_id === groupBlockMountId`로 필터. (이 경우 레포 확장 없이 기존 훅/레포만 활용.)
3. **searchBySemantic**
  - MVP는 “미구현” 스텁 또는, **BlockSearchRepository**로 페이지 스코프 블록 목록 + content_raw를 가져온 뒤 단순 키워드/텍스트 유사도로 정렬해 반환. 임베딩/벡터는 이후 단계로 미룬다.
4. **route.ts**
  - Step 1-5와 동일하게 **ai-management/backend/services/tools/** 의 실행 함수만 import. `executeHopSearch(edgeRepository, args, { pageId })`, `executeSearchGroup(blockMountRepository, args, { pageId })`, `executeSearchBySemantic(...)` 형태로 등록.
  - **v2/tool-executors/** 대신 기존 **ai-management 서비스**에 구현해, Step 1-5(grep/glob/read)와 구조를 맞춘다.

### 서버 쪽 “훅”이 아닌 기존 레포/서비스

- 캔버스·블록 **프론트엔드 훅**은 Step 1-6에서만 사용.
- Step 1-7은 전부 **서버 사이드**이므로, “기존 모듈”은 **EdgeRepository**, **BlockMountRepository**, **ContextAssemblyService.getConnectedBlocks** 로직, **BlockSearchRepository** 등 기존 백엔드 레포/서비스를 재사용하는 것으로 정리한다.

---

## 요약

- **Step 1-6**: `useReactFlow` + `useUpdateBlockContent` + `convertMarkdownToTiptapJSON` 조합으로 구현. useCanvasdownExecutor / use-ai-agent.business와 동일한 패턴. 새 훅은 만들지 않고, 라인 연산만 순수 함수로 분리 가능.
- **Step 1-7**: `EdgeRepository`, `BlockMountRepository`, (선택) `ContextAssemblyService`·`BlockSearchRepository`를 활용한 서비스 3개를 ai-management/tools에 추가하고, route에서 해당 실행 함수만 등록.

이렇게 하면 기존 캔버스·블록 훅과 백엔드 모듈을 최대한 활용한 모듈화된 구현이 된다.