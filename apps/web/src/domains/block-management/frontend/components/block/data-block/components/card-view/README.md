# Card View Component

블록의 커스텀 속성을 카드 형태로 표시하는 동적 컴포넌트입니다.

## 개요

CardView는 모든 블록 타입에서 공통으로 사용되는 동적 카드뷰 컴포넌트입니다. 블록의 커스텀 속성(`customProperties`)을 가로 레이아웃으로 표시하며, 각 속성 타입에 맞는 렌더링을 제공합니다.

## 특징

- **동적 렌더링**: 모든 블록 타입에서 재사용 가능
- **커스텀 속성만 표시**: `data.customProperties` 배열의 속성만 표시
- **가로 레이아웃**: 속성명과 값을 한 행에 배치 (예: `Source: Unsplash`)
- **타입별 렌더링**: 각 속성 타입에 맞는 적절한 UI 제공
- **폴더 구조**: `note-view` 패턴을 따르는 계층적 구조

## 아키텍처

### 폴더 구조

```
card-view/
├── components/
│   ├── card-view-view.tsx          # Presentational 컴포넌트
│   └── custom-property-row.tsx     # 커스텀 속성 한 행 렌더링
├── core/
│   ├── types.ts                    # 타입 정의
│   ├── use-card-view.ts            # 메인 훅 (오케스트레이션)
│   └── use-card-view.business.ts   # 비즈니스 훅 (커스텀 속성 필터링)
├── index.tsx                        # Container 컴포넌트
└── README.md
```

### 컴포넌트 계층

```
Container (index.tsx)
  ↓ Hook 사용
useCardView (core/use-card-view.ts)
  ↓ 비즈니스 로직
useCardViewBusiness (core/use-card-view.business.ts)
  ↓ Props 변환
CardViewView (components/card-view-view.tsx)
  ↓ 각 속성 렌더링
CustomPropertyRow (components/custom-property-row.tsx)
```

## 사용법

### 기본 사용

```tsx
import { CardView } from '../../data-block/components/card-view';

// Card View 렌더러
const renderCardView = () => {
  return <CardView data={nodeData} />;
};
```

### 비즈니스 로직 주입 (테스트/Mock용)

```tsx
import { CardView } from '../../data-block/components/card-view';
import type { CardViewBusinessLogic } from '../../data-block/components/card-view/core/types';

const customBusiness: CardViewBusinessLogic = {
  getCustomPropertyValues: (customProperties, properties) => {
    // 커스텀 필터링 로직
    return customProperties
      .filter(prop => prop.visible !== false)
      .map(property => ({
        property,
        value: properties[property.id] ?? property.defaultValue,
      }));
  },
};

const renderCardView = () => {
  return <CardView data={nodeData} businessLogic={customBusiness} />;
};
```

## 속성 타입별 렌더링

`CustomPropertyRow` 컴포넌트는 각 속성 타입에 맞는 렌더링을 제공합니다:

- **BOOLEAN**: `Yes` / `No`
- **COLOR**: 색상 박스 + 색상 코드
- **URL**: 클릭 가능한 링크
- **EMAIL**: `mailto:` 링크
- **PHONE**: `tel:` 링크
- **SELECT/STATUS**: 옵션에서 label 찾아서 표시
- **MULTISELECT**: 여러 개의 Badge로 표시
- **NUMBER**: 숫자 포맷팅 (천 단위 구분)
- **DATE**: 날짜 포맷팅
- **기타**: 문자열로 표시

## 데이터 흐름

1. **Container** (`index.tsx`): `data` prop을 받아 Hook에 전달
2. **Hook** (`use-card-view.ts`): 비즈니스 로직을 호출하여 커스텀 속성 값 추출
3. **Business Hook** (`use-card-view.business.ts`): `data.properties[property.id]`에서 값 추출, `visible` 필터링
4. **View** (`card-view-view.tsx`): 필터링된 커스텀 속성들을 렌더링
5. **Property Row** (`custom-property-row.tsx`): 각 속성 타입에 맞는 렌더링

## 참고 패턴

- **Container/Presentational 패턴**: [`component-development-guidelines.md`](../../../../../../../../docs/patterns/frontend/component-development-guidelines.md)
- **훅 레이어 아키텍처**: UI/비즈니스 로직 분리
- **프랙탈 구조**: `note-view` 컴포넌트와 동일한 구조

## 마이그레이션

기존 정적 카드뷰들(`ImageCardView`, `ShapeCardView`, `YoutubeCardView`, `MarkdownCardView`)은 모두 삭제되었으며, 이제 모든 블록 타입에서 동일한 `CardView` 컴포넌트를 사용합니다.

**Before:**
```tsx
import { ImageCardView } from './components/image-card-view';
const renderCardView = () => <ImageCardView data={nodeData} />;
```

**After:**
```tsx
import { CardView } from '../../data-block/components/card-view';
const renderCardView = () => <CardView data={nodeData} />;
```
