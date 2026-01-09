# Base Block Component

모든 블록의 공통 래퍼 컴포넌트입니다. Compound Component Pattern과 로직 분리를 적용하여 재사용성과 유지보수성을 높였습니다.

## 구조

이 컴포넌트는 `components/` + `core/` 패턴을 따르며, **Presentation/Container 패턴**을 적용합니다:

```
base-block/
├── components/                    # UI 컴포넌트들
│   ├── base-block-view.tsx        # Presentational (렌더링만)
│   ├── content.tsx                # Presentational (컨텐츠 래퍼)
│   ├── action-bar.tsx             # Presentational (우측 액션바)
│   ├── toolbar.tsx                # Presentational (상단 툴바)
│   ├── handles.tsx                # Presentational (연결점)
│   ├── resize-control.tsx         # Presentational (리사이즈 핸들)
│   ├── resize-icon.tsx            # Presentational (리사이즈 아이콘)
│   └── add-button-zones/          # Add Button Zones 컴포넌트
│       ├── components/
│       │   ├── add-button-view.tsx
│       │   └── add-button-zone-view.tsx
│       ├── core/
│       │   ├── types.ts
│       │   ├── use-add-buttons.ui.ts
│       │   └── use-add-buttons.business.ts
│       ├── index.tsx              # Container
│       └── README.md
├── core/                          # 비즈니스 로직
│   ├── types.ts                   # 타입 정의
│   ├── use-base-block.ui.ts       # UI 상태
│   ├── use-base-block.business.ts # 비즈니스 로직
│   ├── use-base-block.ts          # 통합 훅
│   └── README.md                  # Core 로직 설명
├── index.tsx                      # Container (Hook → Props 변환)
└── README.md                      # 컴포넌트 문서 (현재 파일)
```

## 기능

BaseBlock은 모든 블록 타입에 공통으로 필요한 다음 기능을 제공합니다:

1. **리사이즈 핸들**: 우측 하단에서 블록 크기 조절
2. **연결점 (Handles)**: 상하좌우 4개의 연결점으로 블록 간 연결
3. **툴바**: 블록 속성 편집 (BlockMountToolbar)
4. **액션바**: 블록 타입별 액션 (BlockActionBar)
5. **스타일 관리**: 색상, 텍스트 스타일 등

## 사용법

### 1. 기본 사용 (권장)

가장 일반적인 사용 방법입니다. 내부적으로 모든 서브 컴포넌트가 조합됩니다:

```tsx
import { BaseBlock } from './base-block';

<BaseBlock
  data={blockData}
  selected={true}
  isConnectable={true}
  width={400}
  height={300}
>
  <MyBlockContent />
</BaseBlock>
```

### 2. 서브 컴포넌트 직접 사용

서브 컴포넌트는 모두 Presentational 컴포넌트이므로 Props를 직접 전달해야 합니다:

```tsx
import { 
  BaseBlockView, 
  Handles, 
  Toolbar, 
  Content 
} from './base-block/components';
import { useBaseBlock } from './base-block/core/use-base-block';

function CustomBaseBlock({ data, ...props }) {
  const contextValue = useBaseBlock({ data, ...props });
  
  return (
    <BaseBlockView {...contextValue}>
      <Handles 
        isConnectable={contextValue.isConnectable}
        hoverDirection={contextValue.hoverDirection}
      />
      <Toolbar {...contextValue} />
      <Content textColorClass={contextValue.textColorClass}>
        <MyBlockContent />
      </Content>
    </BaseBlockView>
  );
}
```

### 3. 노코드 툴 (Mock 로직)

Framer 등 노코드 툴에서 디자인 작업 시 Mock 비즈니스 로직 사용:

```tsx
import { BaseBlock, useMockBaseBlockBusiness } from './base-block';

const mockBusiness = useMockBaseBlockBusiness();

<BaseBlock
  data={blockData}
  businessLogic={mockBusiness}
>
  <MyBlockContent />
</BaseBlock>
```

## Props

### BaseBlockProps

```typescript
interface BaseBlockProps {
  data: BlockNodeData;           // 블록 데이터 (필수)
  selected?: boolean;             // 선택 여부
  isConnectable?: boolean;        // 연결 가능 여부
  children?: React.ReactNode;     // 블록 컨텐츠
  width?: number;                 // 너비
  height?: number;                // 높이
  styleProps?: {                  // 스타일 속성
    color?: string;
    richStyle?: boolean;
    textAlign?: string;
    fontSize?: string;
  };
  noBorder?: boolean;             // 테두리 제거
  noBackground?: boolean;         // 배경 제거
  businessLogic?: BaseBlockBusinessLogic;  // 비즈니스 로직 주입 (선택)
}
```

## Props 기반 데이터 전달

BaseBlock은 **Context를 사용하지 않고** Props를 통해 모든 서브 컴포넌트에 데이터를 전달합니다:

```typescript
// Container에서 Hook으로 데이터 가져오기
const contextValue = useBaseBlock(props, { businessLogic });

// Props로 전달
<ResizeControl
  data={contextValue.data}
  selected={contextValue.selected}
  isSingleSelection={contextValue.isSingleSelection}
  handleResizeStart={contextValue.handleResizeStart}
  handleResizeEnd={contextValue.handleResizeEnd}
/>
```

이 패턴의 장점:
- ✅ **명시적 데이터 흐름**: Props를 통해 데이터 흐름이 명확함
- ✅ **테스트 용이성**: Presentational 컴포넌트를 독립적으로 테스트 가능
- ✅ **Storybook 호환**: Props만으로 컴포넌트를 렌더링 가능
- ✅ **타입 안전성**: TypeScript가 모든 Props를 검증

## 로직 분리

BaseBlock은 UI/Business 로직을 3개 레이어로 분리합니다:

### 1. UI State (`use-base-block.ui.ts`)
- 리사이즈 상태 관리
- API 호출 없음
- 노코드 툴에서 독립적으로 사용 가능

```typescript
const uiState = useBaseBlockUI();
// { isResizing, setIsResizing, handleResizeStart, handleResizeComplete }
```

### 2. Business Logic (`use-base-block.business.ts`)
- DB 저장 (리사이즈 정보)
- Prefetch 전략 (툴바, 액션바)
- Mock 버전 제공

```typescript
const business = useBaseBlockBusiness();
// { saveBlockSize, prefetchBlockTools }

// Mock 버전
const mockBusiness = useMockBaseBlockBusiness();
```

### 3. Combined Hook (`use-base-block.ts`)
- UI + Business 통합
- Optional Injection 지원

```typescript
const combined = useBaseBlock(props, { businessLogic: customBusiness });
```

## 서브 컴포넌트

### ResizeControl
우측 하단 리사이즈 핸들. 단일 선택 시에만 표시됩니다.

### Handles
상하좌우 4개의 연결점. 블록 간 연결에 사용됩니다.

### Toolbar
상단 툴바. 블록 속성을 편집할 수 있습니다. (BlockMountToolbar)

### ActionBar
우측 액션바. 블록 타입별 액션을 제공합니다. (BlockActionBar)

### Content
실제 블록 컨텐츠를 렌더링하는 래퍼입니다.

### AddButtonZones
블록 바깥 영역에 Add Button을 표시하는 컴포넌트입니다. 단일 선택 시에만 표시됩니다.
- `components/add-button-view.tsx`: Add Button Presentational 컴포넌트
- `components/add-button-zone-view.tsx`: Add Button Zone Presentational 컴포넌트
- `index.tsx`: Container (Hook 사용, Props 전달)

## 스타일 관리

BaseBlock은 블록의 색상과 스타일을 자동으로 계산합니다:

```tsx
<BaseBlock
  data={blockData}
  styleProps={{
    color: 'blue',      // ColorToken
    richStyle: true,    // 리치 스타일 활성화
    textAlign: 'center',
    fontSize: '14px'
  }}
>
  <MyBlockContent />
</BaseBlock>
```

지원하는 ColorToken:
- `gray`, `blue`, `red`, `green`, `yellow`, `purple`, `pink`, `orange`

## 선택 상태

BaseBlock은 캔버스 선택 상태를 자동으로 추적합니다:

- **단일 선택**: 툴바, 액션바, 리사이즈 핸들 표시
- **다중 선택**: 위 UI 요소들 숨김
- **선택되지 않음**: 기본 상태

## 리사이즈 동작

1. 사용자가 우측 하단 핸들을 드래그
2. `handleResizeStart` 호출 → `isResizing = true`
3. 리사이즈 중 UI 업데이트
4. `handleResizeEnd` 호출 → DB 저장 → `isResizing = false`

실패 시 자동 롤백은 없으므로, 필요 시 비즈니스 로직에서 처리해야 합니다.

## Prefetch 전략

마우스 호버 시 툴바와 액션바를 미리 로드하여 UX를 개선합니다:

```typescript
handleMouseEnter() {
  prefetchToolbar(blockType);
  prefetchAction(blockType);
}
```

## 참고 자료

- [Component Development Guidelines](../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [Block Management Domain](../../../../../../shared/types/block-data.types.ts)
- [Style Tokens](../../../../../../shared/types/style-tokens.types.ts)

