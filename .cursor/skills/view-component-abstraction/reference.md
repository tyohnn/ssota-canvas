# View Component Abstraction Reference

## 언제 어떤 방법을 쓸까

| 대상 | 방법 | 예시 |
|------|------|------|
| **렌더링 상태** | Result Injection | showPlayer, isVisible |
| **동작/인터랙션** | Parameterization | onProvideCallbacks, onUnmount |

---

## Result Injection 예시: canvasMode → showPlayer

**원칙**: showPlayer는 렌더링 상태. View는 boolean 하나만 받고, 계산은 호출부가 수행.

### Before (도메인 의존)

```ts
// View 훅이 canvasMode, blockMountId에 직접 의존
const isDragging = useMemo(() => { ... }, [canvasMode, blockMountId]);
const isMultiSelection = canvasMode.isMultiSelectionMode();
const showPlayer = selected && !!url && !isDragging && !isMultiSelection;
```

### After (Result Injection)

```ts
// showPlayer를 호출부가 계산해서 전달
interface UseYoutubeBlockUIProps {
  url: string;
  isActive: boolean;
  showPlayer: boolean;  // 호출부가 계산
  instanceId: string;
  ...
}
```

호출부에서:
```ts
const isDragging = /* canvasMode 기반 계산 */;
const isMultiSelection = canvasMode.isMultiSelectionMode();
const showPlayer = selected && !!url && !isDragging && !isMultiSelection;
useYoutubeBlockUI({ url, isActive: selected, showPlayer, instanceId, ... });
```

---

## Parameterization 예시: registerBlockInteractions

### Before

```ts
// deps에 loadBlockInteractions, registerBlockInteractions 직접
const registerInteractions = useCallback(async () => {
  const interactions = await loadBlockInteractions('youtube');
  registerBlockInteractions(blockMountId, boundInteractions);
}, [blockMountId, loadBlockInteractions, registerBlockInteractions]);
```

### After (onProvideCallbacks)

```ts
// deps: onProvideCallbacks?: (provide: () => Promise<Record<string, Function>>) => void
const provideCallbacks = async () => ({
  seekTo: (seconds: number) => playerRef.current?.seekTo(seconds),
});
if (deps.onProvideCallbacks && isActive && playerRef.current) {
  deps.onProvideCallbacks(provideCallbacks);
}
```

호출부에서:
```ts
onProvideCallbacks: (provide) => {
  provide().then(callbacks => registerBlockInteractions(blockMountId, callbacks));
}
```

---

## Abstraction Boundary 예시: combined → domain

### Before (ssota-blocks에 combined)

```
packages/ssota-blocks/src/youtube/
├── components/
├── logic/
└── combined/youtube-block.tsx  ← BlockWrapper, renderOriginalView, renderCardView
```

ssota-blocks가 DataBlock/BlockWrapper 개념을 알아야 함.

### After (block-management에서 조립)

```
packages/ssota-blocks/src/youtube/
├── components/  (YoutubeView)
└── logic/       (useYoutubeBlock)

block-management/block-type/youtube/index.tsx:
  useYoutubeBlock(deps)
  renderOriginalView = () => <YoutubeView {...hookResult} />
  renderCardView = () => <CardView ... />
  <DataBlock renderOriginalView={...} renderCardView={...} />
```

Link/PDF/Audio 패턴과 동일. ssota-blocks는 View + logic만 export.

---

## View가 모르는 것 / 훅 위치

- View/훅은 **node, title, properties** 같은 도메인 개념을 모른다.
- **훅을 domain으로 옮기지 않고** shared에 두되, **콜백 기반**으로 설계한다.
- 이유: Drive·Landing 등 React Flow 없는 맥락에서도 URL submit 후 동작을 정의할 수 있고, 공통 인터페이스가 명확하며 새 훅을 만들 필요가 없다.

## Parameterization 예시: createVO → 콜백

### Before (VO 의존)

```ts
createVO: (p) => YoutubeBlockPropertiesVO.fromJSON(p)
// 훅이 vo.getThumbnailUrl(), vo.getVideoId() 호출
```

### After (콜백)

```ts
interface UseYoutubeBlockDeps {
  onUrlSubmit: (url: string) => Promise<void>;
  getThumbnailUrl: (properties: Record<string, unknown>) => string | null;
  getVideoId: (properties: Record<string, unknown>) => string | undefined;
  getEmbedUrl?: (properties: Record<string, unknown>) => string;
}
```

호출부에서:
```ts
onUrlSubmit: async (url) => {
  const result = await fetchMetadata(url);
  await updateProperties(blockId, { url, ...metadata }, nodeData);
  // ...
},
getThumbnailUrl: (p) => YoutubeBlockPropertiesVO.fromJSON(p).getThumbnailUrl(),
getVideoId: (p) => YoutubeBlockPropertiesVO.fromJSON(p).getVideoId(),
```

---

## 의사결정 표

| 상황 | 방법 | 예시 |
|------|------|------|
| **렌더링 상태** (보여줄까?) | Result Injection | showPlayer를 props로 |
| **동작/인터랙션** (seekTo, 등록 등) | Parameterization | onProvideCallbacks |
| **도메인 동작** (URL submit, properties 파싱) | Parameterization | onUrlSubmit, getThumbnailUrl, getVideoId |
| createVO, VO 의존 | Parameterization | getThumbnailUrl, getVideoId 콜백 |
| Container/조합이 shared 패키지에 있음 | Boundary 밀기 | combined → domain으로 이동 |
| 훅 위치 | shared 유지, 콜백 기반 | 여러 맥락(block-management, Drive, Landing)에서 재사용 가능 |
