# Shadow Block System

블록 생성 모드에서 마우스를 따라다니는 Shadow Block 시스템입니다.

## 구조

```
shadow-block/
├── shadow-block-container.tsx        # 공통 컨테이너 (로직)
├── shadow-block-preview-registry.tsx # Preview 매핑
├── previews/
│   ├── default-shadow-preview.tsx    # 기본 Preview
│   ├── text-shadow-preview.tsx       # 텍스트 블록 Preview
│   └── shape-shadow-preview.tsx      # 도형 블록 Preview
└── index.ts                          # Export
```

## 사용 방법

### Canvas에서 사용

```typescript
import { ShadowBlockContainer } from '@/domains/canvas-management/frontend/components/shadow-block';

<ShadowBlockContainer
  pageId={pageId}
  orgId={orgId}
  workspaceId={workspaceId}
/>
```

### 새로운 블록 Preview 추가

1. **Preview 컴포넌트 생성**:

```typescript
// previews/my-block-shadow-preview.tsx
export function MyBlockShadowPreview({ blockType, width, height }: ShadowPreviewProps) {
  return (
    <div style={{ width, height }}>
      {/* 커스텀 Preview UI */}
    </div>
  );
}
```

2. **Registry에 등록**:

```typescript
// shadow-block-preview-registry.tsx
import { MyBlockShadowPreview } from './previews/my-block-shadow-preview';

const SHADOW_PREVIEW_MAP = {
  // ...
  [BlockType.MY_BLOCK]: MyBlockShadowPreview,
};
```

## 데이터 흐름

```
BlockAddDialog
  → canvasMode.enterBlockCreationMode(blockType)
  → ShadowBlockContainer 렌더링
  → getShadowPreview(blockType)
  → 블록별 Preview 렌더링
  → 사용자 클릭
  → blockLifecycle.createAndMountBlock()
  → 실제 Block 생성
```

## 공통 기능 (Container)

- ✅ 마우스 추적
- ✅ ESC 취소
- ✅ 클릭 생성
- ✅ 블록 크기 계산
- ✅ 화면 위치 계산

## 블록별 커스텀 (Preview)

각 블록 타입별로 고유한 미리보기를 제공:

- **Text Block**: 회색 점선, 텍스트 라인 미리보기
- **Shape Block**: 파란색 점선, 기본 사각형 도형
- **Default**: 파란색 점선, 아이콘 + 블록명

## Migration Notes

기존 `SkeletonBlock`은 deprecated 처리되었습니다.
새로운 코드에서는 `ShadowBlockContainer`를 사용하세요.



