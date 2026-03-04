# ssota-blocks Extraction Reference

## Boundary Design (경계 설계)

**경계 설계** = 도메인 특화 vs 범용 개념을 구분하고, 추상화 수준·네이밍을 정하는 과정.

### 소유권 판별

| 대상 | ssota-blocks | block-management / canvas |
|------|--------------|---------------------------|
| registerBlockInteractions, loadBlockInteractions | ❌ 직접 사용 금지 | ✅ 콜백으로 주입받아 사용 |
| BlockWrapper, renderOriginalView, renderCardView 조합 | ❌ combined는 domain에서 | ✅ Link/PDF처럼 직접 조립 |
| blockMountId, nodeData, selected (React Flow 용어) | ❌ 범용 이름으로 변경 | - |

### Deps 추상화 매핑

| 도메인 | 범용 |
|--------|------|
| BlockInteractionDeps, registerBlockInteractions | onProvideCallbacks, onUnmount |
| blockMountId | instanceId |
| blockId, nodeId | id, resourceId |
| nodeData | data |
| selected (선택/활성 상태) | isActive, isHighlighted |
| loadBlockInteractions('youtube') | 블록이 콜백만 제공; 호출부가 등록 |
| setAutoSummaryBlockId | onRequestSummary? |
| canvasMode | interactionContext, viewContext |

### 체크리스트

- [ ] deps에 registerBlockInteractions를 넣지 않고 콜백으로 추상화했는가?
- [ ] combined를 ssota-blocks에 두지 않고 block-management에서 조립하는가?
- [ ] blockMountId, nodeData, selected를 범용 이름으로 바꿀 수 있는가?

---

## Backward Compatibility

- Do not delete existing files or change export paths until all consumers have been migrated and verified.
- Prefer re-export during transition: keep old path and re-export from ssota-blocks (e.g. `export { YoutubeView } from '@workspace/ssota-blocks'`).
- Delete only after: (1) all imports updated, (2) tests pass, (3) build succeeds.

## File Mapping (YouTube example)

| Source (block-management) | Target (ssota-blocks) |
|--------------------------|------------------------|
| components/youtube.view.tsx | youtube/components/youtube.view.tsx |
| components/youtube-preview-card.tsx | youtube/components/youtube-preview-card.tsx |
| components/youtube-player-overlay.tsx | youtube/components/youtube-player-overlay.tsx |
| components/ui-states/* | youtube/components/ui-states/* |
| core/use-youtube-block.ts, use-youtube-block.ui.ts | youtube/logic/* |
| core/use-youtube-block.business.ts | youtube/logic/business/ (필요 시 분할) |
| core/types.ts, core/utils.ts | youtube/logic/* |
| index.tsx (Container) | youtube/combined/youtube-block.tsx |

## Logic: business/ 폴더

비즈니스 로직을 단일 파일이 아닌 `logic/business/` 폴더에 분리:

```
logic/
├── use-youtube-block.ts
├── use-youtube-block.ui.ts
├── business/
│   ├── index.ts         # useYoutubeBlockBusiness 또는 sub-모듈 조합
│   ├── fetch-metadata.ts
│   ├── update-properties.ts
│   └── ...
├── types.ts
└── utils.ts
```

- business 내부 모듈은 deps로 외부 의존성 수신. domain 직접 import 금지.

## Deps Injection Shape (Logic)

**@xyflow/react import 불필요**: getNode/updateNode는 최소 인터페이스로 타이핑.

```ts
interface NodeLike { id?: string; data?: unknown }

interface UseYoutubeBlockDeps {
  updateProperties: (blockId: string, props: Partial<...>, nodeData: ...) => Promise<void>;
  updateBlockTitle: (blockId: string, title: string, ...) => Promise<void>;
  fetchMetadata: (url: string) => Promise<{ success: boolean; blockUuid?: string }>;
  getNode: (id: string) => NodeLike | undefined;
  updateNode: (nodeId: string, options: { data: unknown }) => void;
  workspaceId: string;
  canvasMode: CanvasModeContextValue;
  setAutoSummaryBlockId: (id: string) => void;
}
```

## Combined Props Shape

```tsx
interface YoutubeBlockProps {
  data: YoutubeBlockNodeData;  // generic or from caller
  selected: boolean;
  draggable?: boolean;
  width?: number;
  height?: number;
  BlockWrapper: React.ComponentType<DataBlockProps>;
  CardViewComponent: React.ComponentType<CardViewProps>;
  deps: UseYoutubeBlockDeps;
}
```

## Type Strategy

- **components**: Define minimal interface (e.g. `YoutubeMetadata { youtubeTitle?; channelName?; ... }`). Avoid importing domain types.
- **logic**: Accept `createVO`, `getVideoId`, `getThumbnailUrl` in deps if VO stays in block-management.
- **combined**: Accept `data` as generic or from caller; do not import block-management shared types.

## Testing Strategy

### components (View)
- Render with mock props.
- Assert state UI: empty / loading / preview / error.
- Assert events: `userEvent.type`, `fireEvent.submit`, expect `onUrlSubmit` called.
- Tools: `render`, `screen`, `userEvent` from React Testing Library.

### logic (Hooks)
- Mock domain Context and actions.
- `renderHook` with `act`.
- Assert returned state and handler calls.
- Tools: `renderHook`, `act`, `vi.mock`.

### combined (Container)
- Mock `BlockWrapper`, `deps`.
- Render with mock `data`.
- Assert View receives correct props (e.g. placeholder for URL input).
- Tools: `render`, `screen`.

### Test File Layout
```
youtube/
├── components/__tests__/
│   ├── youtube.view.test.tsx
│   ├── youtube-preview-card.test.tsx
│   └── ui-states/youtube-empty-state.test.tsx
├── logic/__tests__/
│   ├── use-youtube-block.ui.test.ts
│   ├── use-youtube-block.test.ts
│   └── business/           # business 폴더 내 모듈별 테스트
│       └── fetch-metadata.test.ts
└── combined/__tests__/
    └── youtube-block.test.tsx
```

### Run Tests and Verify (mandatory)

1. From project root: `pnpm test` (runs turbo test across workspace).
2. From apps/web: `pnpm test` (runs vitest).
3. From packages/ssota-blocks (if package has test script): `pnpm test`.
4. If tests fail:
   - Read the failure message and stack trace.
   - Fix the cause (assertion, mock, or source code).
   - Rerun tests.
5. Migration is not complete until all tests pass and `pnpm build` succeeds.

## apps/web Import Updates

| File | Change |
|------|--------|
| node-types.config.ts | Import YoutubeBlock from @workspace/ssota-blocks; pass BlockWrapper, CardViewComponent, deps |
| TutorialYoutubeBlockNode | Import YoutubeView from @workspace/ssota-blocks |
| SummarizeYoutubeBlock, MockYoutubeBlock | Import YoutubeView from @workspace/ssota-blocks |
| LinkYoutubePreviewSection | Import YoutubePreviewCard, YoutubeLoadingState from @workspace/ssota-blocks |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Complex deps injection | Single deps object with typed interface |
| YoutubeBlockPropertiesVO in logic | Pass createVO, getVideoId via deps |
| DataBlock interface mismatch | Export DataBlockProps from block-management; ssota-blocks receives generic |
| @xyflow/react coupling | getNode/updateNode via deps; NodeLike minimal interface (no import needed) |
