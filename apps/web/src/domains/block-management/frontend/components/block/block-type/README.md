# Block Types

모든 블럭 타입의 구현을 포함하는 폴더입니다. 각 블럭은 자체 포함된(self-contained) 구조로 관리됩니다.

## 구조

```
block-type/
├── youtube/
│   ├── index.tsx                    # 메인 블럭 컴포넌트
│   ├── use-youtube-actions.ts       # 액션 훅
│   ├── toolbar-items/               # 툴바 아이템들
│   │   ├── index.ts
│   │   ├── youtube-url-toolbar-item.tsx
│   │   └── ...
│   └── action-items/                # 액션 아이템들
│       ├── index.ts
│       ├── extract-script-action.tsx
│       └── ...
├── pdf/
├── image/
├── link/
├── python/
├── audio/
├── text/
├── markdown/
├── shape/
└── base-block/
```

## 각 블럭의 구성 요소

### 1. index.tsx
- 메인 블럭 컴포넌트
- React Flow 노드로 렌더링됨
- BaseBlock을 확장하여 구현

### 2. use-[blocktype]-actions.ts
- 블럭별 액션 로직을 훅으로 추출
- UI 컴포넌트와 AI Agent에서 재사용
- 각 액션은 `use[BlockType][ActionName]` 형식

**예시:**
```typescript
// use-youtube-actions.ts
export function useYoutubeExtractScript(blockId, blockData) {
  return useCallback(() => {
    // 스크립트 추출 로직
  }, [blockId, blockData]);
}
```

### 3. toolbar-items/
- 블럭 상단 툴바에 표시되는 항목들
- 블럭 속성 편집 (URL, 스타일 등)
- BlockOriginalToolbar에서 사용

### 4. action-items/
- 블럭 우측 액션 바에 표시되는 항목들
- AI 기반 액션 (요약, 추출, 생성 등)
- BlockActionBar에서 사용

## 블럭 추가 가이드

새 블럭 타입을 추가하려면:

1. **폴더 생성**
   ```bash
   mkdir block-type/new-block
   cd block-type/new-block
   ```

2. **index.tsx 생성**
   ```tsx
   export function NewBlock() {
     return <BaseBlock>...</BaseBlock>;
   }
   ```

3. **use-new-block-actions.ts 생성**
   ```tsx
   export function useNewBlockAction(blockId, blockData) {
     return useCallback(() => {
       // 액션 로직
     }, [blockId, blockData]);
   }
   ```

4. **Block Actions Registry 등록**
   ```typescript
   // backend/repositories/implementations/drizzle-tool.repository.ts
   export const BLOCK_ACTIONS_REGISTRY = {
     'new-block': {
       actions: [
         { name: 'action', description: '...' }
       ]
     }
   };
   ```

5. **Dynamic Executor 등록**
   ```typescript
   // frontend/hooks/use-block-action-executor.ts
   const BLOCK_ACTION_MODULES = {
     'new-block': 'new-block',
   };
   ```

## Component Development Guidelines 준수

✅ **Self-Contained**: 각 블럭 관련 코드가 모두 한 폴더에
✅ **로직 분리**: use-*-actions.ts로 훅 추출
✅ **명확한 구조**: toolbar-items, action-items 폴더 분리
✅ **index.tsx 패턴**: 메인 엔트리 포인트
✅ **NoCode 호환**: Props로 전달, 함수 Props 최소화

