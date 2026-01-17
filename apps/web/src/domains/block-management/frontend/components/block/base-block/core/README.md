# Base Block Core

BaseBlock의 비즈니스 로직을 담당하는 core 모듈입니다.

## 파일 구조

```
core/
├── context.tsx                   # Context 정의 및 훅
├── provider.tsx                  # Provider 컴포넌트
├── types.ts                      # 타입 정의
├── use-base-block.ui.ts          # UI 상태 훅
├── use-base-block.business.ts    # 비즈니스 로직 훅
├── use-base-block.ts             # 통합 훅
└── README.md                     # Core 로직 설명 (현재 파일)
```

## 역할

### context.tsx
- `BaseBlockContext` 정의
- `useBaseBlockContext` 훅 제공
- Context 값 타입: `BaseBlockContextValue`

### provider.tsx
- `BaseBlockProvider` 컴포넌트
- `useBaseBlock` 훅을 사용하여 Context 값 생성
- 하위 컴포넌트에 Context 제공

### types.ts
주요 타입 정의:
- `BaseBlockProps`: 컴포넌트 Props
- `BaseBlockContextValue`: Context 값
- `ResizeData`: 리사이즈 데이터
- `BlockSizeUpdateParams`: 블록 크기 업데이트 파라미터

### use-base-block.ui.ts
**UI 상태 관리 (비즈니스 로직 없음)**

```typescript
interface BaseBlockUIState {
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
  handleResizeStart: () => void;
  handleResizeComplete: () => void;
}

const uiState = useBaseBlockUI();
```

**특징:**
- ✅ 로컬 상태 관리만
- ✅ API 호출 없음
- ✅ 노코드 툴에서 독립적으로 사용 가능

### use-base-block.business.ts
**비즈니스 로직 (DB 저장, Prefetch)**

```typescript
interface BaseBlockBusinessLogic {
  saveBlockSize: (
    blockMountId: string,
    resizeData: ResizeData,
    params: Omit<BlockSizeUpdateParams, 'width' | 'height'>
  ) => Promise<{ ok: boolean; error?: string }>;
  
  prefetchBlockTools: (blockType: string) => void;
}

// Production 로직
const business = useBaseBlockBusiness();

// Mock 로직 (노코드 툴용)
const mockBusiness = useMockBaseBlockBusiness();
```

**특징:**
- ✅ API 호출 (블록 크기 저장)
- ✅ Prefetch 전략 (툴바, 액션바)
- ✅ Mock 버전 제공

**주요 로직:**

1. **saveBlockSize**: 리사이즈 완료 시 DB에 저장
   - `useBlockCommands`의 `updateBlockSize` 호출
   - 실패 시 에러 로깅

2. **prefetchBlockTools**: 마우스 호버 시 Prefetch
   - `prefetchToolbar(blockType)`: 툴바 아이템 미리 로드
   - `prefetchAction(blockType)`: 액션 아이템 미리 로드

### use-base-block.ts
**UI + Business 통합 훅**

```typescript
interface UseBaseBlockOptions {
  businessLogic?: BaseBlockBusinessLogic;  // Optional injection
}

const combined = useBaseBlock(props, options);
```

**역할:**

1. **UI State 통합**
   - `useBaseBlockUI`에서 UI 상태 가져오기

2. **Business Logic 통합**
   - 기본: `useBaseBlockBusiness()` 사용
   - 커스텀: `options.businessLogic` 주입 가능

3. **스타일 계산**
   - ColorToken → 스타일 클래스 변환
   - `getRichStyleClasses`, `getTextColorClass`, `getSelectedRingClasses`

4. **선택 상태 계산**
   - `useCanvasSelection`으로 현재 블록 선택 여부 확인
   - 단일/다중 선택 판단

5. **Combined 액션**
   - `handleMouseEnter`: Prefetch 트리거
   - `handleResizeEnd`: DB 저장 + UI 상태 업데이트

## Context Value

```typescript
interface BaseBlockContextValue {
  // 블록 데이터
  data: BlockNodeData;
  selected: boolean;
  isConnectable: boolean;

  // 크기
  width?: number;
  height?: number;

  // 스타일
  styleProps?: BaseBlockProps['styleProps'];
  noBorder: boolean;
  noBackground: boolean;

  // 색상 토큰
  colorToken: ColorToken;
  richStyle: boolean;

  // 계산된 스타일 클래스
  styleClasses: string;
  textColorClass: string;
  selectedRingClasses: string;

  // 선택 상태
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;

  // UI 상태
  isResizing: boolean;

  // UI 액션
  handleMouseEnter: () => void;
  handleResizeStart: () => void;
  handleResizeEnd: (event: any, resizeData: ResizeData) => void;
}
```

## 사용 방법

### Provider로 감싸기

```tsx
import { BaseBlockProvider } from './core/provider';

<BaseBlockProvider data={blockData} selected={true}>
  {/* 하위 컴포넌트 */}
</BaseBlockProvider>
```

### 하위 컴포넌트에서 Context 사용

```tsx
import { useBaseBlockContext } from './core/context';

function MySubComponent() {
  const {
    data,
    selected,
    isResizing,
    handleMouseEnter,
  } = useBaseBlockContext();
  
  // ...
}
```

### 커스텀 비즈니스 로직 주입

```tsx
import { BaseBlockProvider, useMockBaseBlockBusiness } from './base-block';

const mockBusiness = useMockBaseBlockBusiness();

<BaseBlockProvider
  data={blockData}
  businessLogic={mockBusiness}
>
  {/* 하위 컴포넌트 */}
</BaseBlockProvider>
```

## 로직 분리 패턴

BaseBlock은 **3-Layer 아키텍처**를 따릅니다:

```
┌─────────────────────────────────────────┐
│  Designer (Framer)                      │
│  ↓ UI State Hook (.ui.ts)               │
│  → isResizing, handleResizeStart        │
│  → Mock 비즈니스 로직으로 테스트          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Engineer (Production)                  │
│  ↓ Business Logic (.business.ts)        │
│  → saveBlockSize, prefetchBlockTools    │
│  → Combined Hook에서 통합                │
└─────────────────────────────────────────┘
```

**장점:**
- ✅ **노코드 툴 호환**: 디자이너가 UI만 테스트
- ✅ **테스트 용이**: UI/Business 독립 테스트
- ✅ **유연성**: Mock/Prod 로직 쉽게 교체
- ✅ **재사용성**: UI 훅을 다른 컴포넌트에서 재사용

## 참고 자료

- [Component Development Guidelines](../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [Block Commands Hook](../../../../../hooks/use-block-commands.ts)
- [Canvas Selection Hook](../../../../../../canvas-management/frontend/hooks/use-canvas-selection.ts)

