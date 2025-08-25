Let me locate policy and action modules to accurately map them into Domain.Policy and Repository/Adapter nodes, then I'll compile the full node classification by layer with file/function references.
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool

Ran tool
Ran tool
Ran tool

Ran tool

Ran tool

### Domain

- Domain.Entity

  - `Block`, `Edge`, `BlockPosition` – `xbowl/apps/web/src/db/schema.ts` (types used as domain entities)
  - Enums: `blockTypeEnum`, `edgeTypeEnum`, `objectTypeEnum` – same file

- Domain.ValueObject

  - `UserSchema`, `SchemaField`, `DefaultMetadata` – `.../canvas/policy/block-rendering-policy.ts`
  - `NodeDefinition` – `.../canvas/policy/block-rendering-policy.ts`
  - `BlockOption`, `BlockAdditionPolicyResult` – `.../canvas/policy/block-addition-policy.ts`
  - `EditorField` – `.../canvas/policy/block-editor-policy.ts`
  - `ColorKey`, `ColorDefinition`, `ShapeKey`, `ShapeDefinition`, `ShapeRenderProps`, `ResizeRenderProps` – `.../canvas/policy/shape-policy.ts`
  - `ViewType`, `ViewConfig`, `ViewDefinition`, `PageViewsMetadata` – `.../canvas/policy/view-policy.ts`
  - `ComponentDefinition`, `ComponentInstance`, `NodeUI`, `ComponentStatus` – `.../canvas/types/component.ts`
  - `ComponentCreationPolicy`, `ComponentStylePolicy`, `ComponentInstancePolicy` – `.../canvas/policy/component-policy.ts`

- Domain.Policy/Service

  - Rendering policy: `BlockRenderingPolicy` with concrete policies (BasicText/Image/WebView/Twitter/Video/Math/File/Default) and helpers `resolveRenderingPolicy`, `buildNodeDefinition` – `.../policy/block-rendering-policy.ts`
  - Editor policy: `BlockEditorPolicy` with concrete policies (BasicText/Twitter/Webview/Image/Video/Math/File/Youtube/Page) and helpers `resolveEditorPolicy`, `computePredefinedSchemaFields`, `ensureSchemaInitialized`, `getMergedFields`, user schema ops – `.../policy/block-editor-policy.ts`
  - Addition policy: `getBlockAdditionPolicy`, `getStaticComponents`, `getDynamicComponentsForPage`, `getDefaultBlockTemplate`, `generateSchemaAndData` – `.../policy/block-addition-policy.ts`
  - Component policy: `ComponentCreationPolicy`, `ComponentStylePolicy`, `ComponentInstancePolicy` with validation, style override management, and instance lifecycle – `.../policy/component-policy.ts`
  - Shape policy: `ShapePolicy` with color definitions, shape definitions, SVG icons, and SSOT styling methods – `.../policy/shape-policy.ts`
  - View policy: `ViewPolicy` with view type definitions, page view metadata extraction, and view resolution helpers – `.../policy/view-policy.ts`

- Domain.Event
  - (없음 – 도입 예정이면 `BlockCreated`, `BlockMoved`, `EdgeCreated` 등)

### Application

- App.Command (UseCase)

  - Page/Block commands: `handlePageBlockSelect`, `handleClearSelectedPage`, `createBlockInPage`, `createComponentFromBlock`, `updateBlockColor` – `.../hooks/handler/useBlockHandler.tsx`
  - Page creation: `createNewPage` – `.../hooks/useCanvasBlocks.tsx`
  - RF-driven commands (currently in UI handler, should be app commands): move node, update node size/data, connect edge – `.../hooks/handler/useReactFlowHandler.tsx` (methods `_onNodesChange`, `onNodePositionChange`, `onNodeDimensionsChange`, `onConnect`)
  - Selection (currently mixed): `selectPageBlock`, `selectComponentBlock` – `.../hooks/state/useBlockState.tsx`
  - Component commands: `promoteBlockToComponentDefinition`, `linkBlocksToComponentDefinition`, `createInstanceInPage`, `resetInstanceStyle`, `updateInstanceStyle`, `openComponentDefinitionEditor` – `.../hooks/useCanvasCommands.tsx`
  - Component policy commands: `canPromoteBlockToComponent`, `canLinkBlocksToComponent`, `canCreateComponentInstance`, `allowsStyleOverrides`, `validateComponentStyleOverride`, `generateComponentInstanceData` – `.../policy/component-policy.ts`
  - Shape/Color commands: `updateBlockShape`, `updateBlockColor` (using ShapePolicy SSOT) – `.../hooks/useCanvasCommands.tsx`
  - View commands: `createView`, `updateView`, `deleteView`, `setDefaultView` – `.../hooks/useCanvasCommands.tsx`

- App.Query

  - (부분적으로 서버 액션을 직접 호출하거나 캐시 훅에서 사용: `usePagePositionCache.loadPagePositions` 등) – `.../hooks/usePagePositionCache.tsx`

- App.Facade/Composition
  - `CanvasProvider`/`useCanvas` – `.../contexts/CanvasContext.tsx`
  - Orchestration hub: `useCanvasBlocks` – `.../hooks/useCanvasBlocks.tsx`

### Store / State

- Store.StateSlice

  - Blocks store: `useBlockState` (state, reducers, selectors) – `.../hooks/state/useBlockState.tsx`
  - Edges store: `useEdgeState` – `.../hooks/state/useEdgeState.tsx`
  - Positions store (LRU per page): `useBlockPositionState` – `.../hooks/state/useBlockPositionState.tsx`
  - UI layout store: `useUiLayoutState` – `.../hooks/state/useUiLayoutState.tsx`

- Store.Selector

  - Derived arrays and selections: `blocks`, `pageBlocks`, `componentBlocks`, `selectedPageBlock`, `selectedComponentBlock` – `useBlockState`
  - Positions per context selectors – `useBlockPositionState.getPositionsForContext`
  - Node selection: `selectedNodeIds` – `useReactFlowState`

- Store.ViewModel Adapter
  - XYFlow adapter: `useReactFlowState` (derive RF nodes/edges from SSOT + positions; `buildNodeDefinition`) – `.../hooks/state/useReactFlowState.tsx`
  - SSOT integration: ShapePolicy for consistent color/shape rendering, ViewPolicy for view metadata – `.../policy/shape-policy.ts`, `.../policy/view-policy.ts`
  - Component system integration: ComponentPolicy for style resolution, instance management, and lifecycle validation – `.../policy/component-policy.ts`

### Repository

- Repository.Interface

  - (없음 – 도입 권장: `BlockRepository`, `EdgeRepository`, `PositionRepository`)

- Repository.Implementation (Server actions)

  - Blocks: `createBlock`, `getBlockById`, `updateBlock`, `deleteBlock`, lists – `.../domains/canvas/actions/block.action.ts`
  - Edges: `createEdge`, `updateEdge`, `deleteEdge`, list – `.../domains/canvas/actions/edge.action.ts`
  - Positions: `createBlockPosition`, `updateBlockPosition`, `batchUpdateBlockPositions`, `deleteBlockPosition`, `listPageBlockPositions` – `.../domains/canvas/actions/block-position.action.ts`

- Mapper
  - Domain→ViewModel: `buildNodeDefinition` – `.../policy/block-rendering-policy.ts`
  - (DB↔Domain 매핑은 Drizzle row 반환으로 암묵적; 명시적 매퍼 도입 가능)

### UI

- UI.Hook (EventAdapter)

  - React Flow event adapter: `useReactFlowHandler` – `.../hooks/handler/useReactFlowHandler.tsx`
  - Page positions cache (fetch + hydrate stores): `usePagePositionCache` – `.../hooks/usePagePositionCache.tsx`
  - Canvas orchestration hook (현재 파사드+커맨드+파생 혼합): `useCanvasBlocks` – `.../hooks/useCanvasBlocks.tsx`

- UI.Component

  - Canvas renderer: `ReactFlowRenderer` – `.../components/canvas/react-flow-renderer.tsx`
  - Panels/Editors: `editor-panel.tsx`, property editors and popovers – `.../components/editor/*`
  - Headers/Explorer: `canvas-header.tsx`, `component-canvas-header.tsx`, explorer tabs – `.../components/*`
  - Shape/Color components: `shape-node.tsx`, `basic-text-node.tsx`, `shape-property.tsx`, `color-property.tsx` (using ShapePolicy SSOT) – `.../components/react-flow-nodes/*`, `.../components/editor/property-input/*`
  - View components: view switchers, view editors (using ViewPolicy) – `.../components/view/*`
  - Component system components: `editor-panel.tsx` (component instance editing), `block-insert-panel.tsx` (component selection), `node-chrome.tsx` (component creation menu), `ssot-debug-panel.tsx` (component debugging) – `.../components/editor/*`, `.../components/react-flow-nodes/*`, `.../components/debug/*`

- UI.LayoutState
  - `useUiLayoutState` (tabs/panels/editor visibility) – `.../hooks/state/useUiLayoutState.tsx`

### Infra

- Infra.Cache

  - Page position LRU cache orchestrator: `usePagePositionCache` – `.../hooks/usePagePositionCache.tsx`
  - LRU state (per page): `useBlockPositionState` – `.../hooks/state/useBlockPositionState.tsx`

- Infra.Logger/Telemetry
  - `devLog` – `xbowl/apps/web/src/utils/dev-logger.ts`

### 갭(생성 권장 노드)

- Repository.Interface: `BlockRepository`, `EdgeRepository`, `PositionRepository`
- App.Commands 분리: `CreateBlock`, `CreateComponentFromBlock`, `CreatePage`, `MoveNode`, `UpdateNodeSize`, `ConnectEdge`, `SelectPage/Node/Edge`
- Selection 전용 Store: `useSelectionState` (page/component/node/edge)
- App.Query(Read model): 페이지 단위 로딩, 캐시 미스 핸들링
- Domain.Event + EventBus(옵션): `BlockCreated`, `BlockMoved`, `EdgeCreated`
- Undo/Redo(Command stack), Error/Toast orchestration
- Shape/Color Theme System: `ThemePolicy` for dynamic color schemes, `ShapeLibrary` for custom shapes
- View Management: `ViewManager` for view lifecycle, `ViewTemplate` for reusable view configurations
- Component System Enhancement: `ComponentVersionManager` for version control, `ComponentLibrary` for reusable components, `ComponentTemplate` for predefined configurations

- 핵심 매핑: 도메인 엔티티(`@/db/schema`), 정책(`.../policy/*`), 스토어(`.../hooks/state/*`), 리포지토리 구현(`.../domains/canvas/actions/*.action.ts`), 뷰모델 어댑터(`useReactFlowState`), UI 어댑터/컴포넌트(`useReactFlowHandler`, `ReactFlowRenderer`), 캐시(`usePagePositionCache`), SSOT 정책(`ShapePolicy`, `ViewPolicy`), 컴포넌트 시스템(`ComponentPolicy`, `component-policy.ts`).
