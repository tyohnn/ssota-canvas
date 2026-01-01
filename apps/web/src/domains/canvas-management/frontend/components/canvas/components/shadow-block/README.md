# Shadow Block System

블록 생성 모드에서 마우스를 따라다니는 Shadow Block 시스템입니다.

## 구조

```
shadow-block/
├── components/
│   └── shadow-block-view.tsx        # Presentational 컴포넌트 (Props만)
├── core/
│   ├── types.ts                      # 타입 정의
│   ├── use-shadow-block.ui.ts       # UI 상태 관리
│   ├── use-shadow-block.business.ts # 비즈니스 로직
│   └── use-shadow-block.ts          # 통합 훅 (오케스트레이션)
├── index.tsx                         # Container 컴포넌트
├── shadow-block-preview-registry.tsx # Preview 매핑
├── previews/
│   ├── default-shadow-preview.tsx    # 기본 Preview
│   ├── text-shadow-preview.tsx       # 텍스트 블록 Preview
│   └── shape-shadow-preview.tsx      # 도형 블록 Preview
└── index.ts                          # Export
```

## 아키텍처

### Container/Presentational 패턴

```
┌─────────────────────────────────┐
│  ShadowBlockContainer           │
│  (Container)                    │
│  - Hook으로 데이터 가져오기      │
│  - Props로 Presentational에 전달 │
└──────────┬──────────────────────┘
           │ Props (그룹화)
           ↓
┌─────────────────────────────────┐
│  ShadowBlockView                │
│  (Presentational)               │
│  - Props만 받음                 │
│  - 순수 함수                     │
│  - Storybook 테스트 쉬움 ✅      │
└─────────────────────────────────┘
```

### Hook 계층 구조

```
┌─────────────────────────────────┐
│  useShadowBlock                 │
│  (오케스트레이션)                │
│  - UI + Business Hook 조합      │
│  - 이벤트 리스너 등록            │
│  - View Props 생성               │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
┌─────────┐  ┌──────────────┐
│ UI Hook │  │ Business Hook│
│         │  │              │
│ 상태    │  │ Canvas Mode  │
│ 관리    │  │ 블록 생성    │
└─────────┘  └──────────────┘
```

## 사용 방법

### Canvas에서 사용

```typescript
import { ShadowBlockContainer } from '@/domains/canvas-management/frontend/components/canvas/components/shadow-block';

<ShadowBlockContainer
  pageId={pageId}
  orgId={orgId}
  workspaceId={workspaceId}
/>
```

### Storybook에서 테스트 (Presentational)

```typescript
import { ShadowBlockView } from './components/shadow-block-view';
import { TextShadowPreview } from './previews/text-shadow-preview';

export const Default = () => (
  <ShadowBlockView
    renderInfo={{
      screenPosition: { x: 100, y: 100 },
      blockWidth: 100,
      blockHeight: 75,
      PreviewComponent: TextShadowPreview,
    }}
    blockInfo={{
      blockType: 'text',
      width: 100,
      height: 75,
    }}
  />
);
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
  → useShadowBlock (오케스트레이션)
    → useShadowBlockUI (마우스 상태)
    → useShadowBlockBusiness (모드 확인, 핸들러)
  → 이벤트 리스너 등록 (마우스, ESC, 클릭)
  → getShadowPreview(blockType)
  → ShadowBlockView 렌더링
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

## 리팩토링 이력

### 2025-01-XX: Container/Presentational 패턴 적용

- 단일 파일(249줄) → 5개 파일로 분리
- UI Hook / Business Hook / 오케스트레이션 분리
- Props 그룹화 (의미 단위)
- Storybook 테스트 가능한 구조

## Migration Notes

기존 `SkeletonBlock`은 deprecated 처리되었습니다.
새로운 코드에서는 `ShadowBlockContainer`를 사용하세요.
