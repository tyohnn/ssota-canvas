# Canvas Refactor Checklist

## Phase 1 – Parallel scaffolding (no usage switch)

- [x] Create pure stores (blocks, edges, positions, selection) under `@refactor/stores`
- [x] Create split contexts (CanvasDataContext, CanvasSelectionContext) under `@refactor/contexts`
- [x] Create application commands hook (`useCanvasCommands`) under `@refactor/hooks`
- [x] Create view-model adapter (`useReactFlowViewModel`) under `@refactor/view-models`
- [x] Create event adapter (`useReactFlowEventAdapter`) under `@refactor/adapters`
- [x] Create README.md documentation under `@refactor/`
- [x] Drop interim repository wrappers; call server actions directly from commands

## Phase 2 – Wire providers (internal route only)

- [x] Build a parallel provider that composes stores and exposes cleaned contexts
- [x] Integrate `useCanvasCommands` with server actions via providers
- [x] Create a sample page using the new provider to validate behaviour
- [x] Add debug panel (`RefactorDebugPanel`) to visualize new store and context values

## Phase 3 – Migrate handlers

- [x] Add refactor handler with legacy-compatible API: `@refactor/handlers/useReactFlowHandler`
- [x] Introduce compatibility bridge provider for legacy pages: `@refactor/compat/LegacyCanvasBridgeProviders`
- [x] Wrap legacy page provider stack with bridge in `app/(dashboard)/[orgSlug]/(canvas)/[workspaceId]/page.tsx`
- [x] Swap handler implementation in `domains/canvas/components/canvas/react-flow-renderer.tsx`
  - [x] Replace import `@/domains/canvas/hooks/handler/useReactFlowHandler` → `@refactor/handlers/useReactFlowHandler`
  - [x] Keep the rest intact (uses legacy nodes/edges for now) to minimize risk
- [x] Migrate create flows to `useCanvasCommands`
  - [x] `ReactFlowRenderer` onDrop → `commands.createBlockInPage`
  - [x] `BlockInsertPanel` click → `commands.createBlockInPage`
  - [x] PageExplorer “Add Page” → `commands.createNewPage`
- [x] Start replacing display data with view-model
  - [x] `ReactFlowRenderer` now uses `useReactFlowViewModel` output (nodes/edges)
- [x] Selection wiring
  - [x] Remove legacy `setSelectedNodeIds` writes in layer explorer (use selection context)
  - [x] Page explorer selection uses `selectPage` from selection context
  - [x] Assets explorer selection uses `selectComponent` from selection context

## Phase 4 – Narrow legacy context

- [x] Annotate deprecations in `CanvasContext` (remove direct XYFlow type imports, mark `displayNodes/displayEdges/selectedNodeIds` as deprecated)
- [x] Migrate component-canvas renderer to refactor handler + view-model
- [x] Update explorers to selection context (pages/layers/assets)
- [x] Move tab state consumption out of `CanvasContext` (use `useUiLayoutState` in `SideExplorer`)
- [x] Remove `displayNodes`/`displayEdges` from `CanvasContext` type and provider value
- [x] Remove `selectedNodeIds`/`setSelectedNodeIds` from `CanvasContext`
- [ ] Move panel orchestration out of `CanvasContext` surface: expose only UI state via separate `UiLayoutContext` (or keep `useUiLayoutState` local)
- [ ] Update remaining consumers to import panel actions from UI layer instead of `CanvasContext`

## Phase 5 – Persistence boundaries

- [ ] Remove DB writes from `useEdgeState` and other slice hooks
- [ ] Ensure all persistence goes through actions from commands

## Phase 6 – Adoption & cleanup

- [ ] Swap consumers to new contexts incrementally
- [ ] Delete deprecated APIs once adoption reaches 100%
