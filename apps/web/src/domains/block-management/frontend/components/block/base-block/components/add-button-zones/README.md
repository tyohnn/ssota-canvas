# Add Button Zones Component

블록 바깥 영역에 투명한 hover 영역을 배치하여 Add Button의 hover 트리거를 핸들과 분리하는 컴포넌트입니다.

## 구조

이 컴포넌트는 **Presentation/Container 패턴**을 따릅니다:

```
add-button-zones/
├── components/                          # Presentational 컴포넌트들
│   ├── add-button-view.tsx             # Add Button (렌더링만)
│   └── add-button-zone-view.tsx        # Add Button Zone (렌더링만)
├── core/                                # 비즈니스 로직
│   ├── types.ts                         # 타입 정의
│   ├── use-add-buttons.ui.ts           # UI 상태
│   └── use-add-buttons.business.ts     # 비즈니스 로직
├── index.tsx                            # Container (Hook → Props 변환)
└── README.md                            # 이 문서
```

## 기능

- **Hover 영역**: 블록 바깥 20px 영역에 투명한 hover zone 배치
- **Add Button 표시**: 호버 시 해당 방향에 Add Button 표시
- **방향별 Zone**: right, bottom 방향 지원 (left, top은 주석 처리)
- **블록 추가**: 클릭 시 해당 방향에 새 블록 추가

## 사용법

### 기본 사용

```tsx
import { AddButtonZonesContainer } from './add-button-zones';

<AddButtonZonesContainer
  show={isSelected && isSingleSelection}
  setHoverDirection={setHoverDirection}
/>
```

### Props

```typescript
interface AddButtonZonesContainerProps {
  show: boolean;                                    // 표시 여부
  setHoverDirection: (direction: HoverDirection | null) => void;  // 블록 핸들 hover 방향 설정
}
```

## 컴포넌트 구조

### AddButtonZonesContainer (Container)

- Hook을 사용하여 데이터를 가져옴
- `useAddButtonsUI()`: UI 상태 (hover direction 등)
- `useAddButtonsBusiness()`: 비즈니스 로직 (블록 추가)

### AddButtonZoneView (Presentational)

- Zone 영역과 버튼을 렌더링
- Props만 받음 (Hook 사용 없음)
- Storybook에서 독립적으로 테스트 가능

**Props:**
```typescript
interface AddButtonZoneViewProps {
  direction: AddButtonDirection;                    // 'right' | 'bottom'
  addButtonHoverDirection: HoverDirection;         // 현재 hover 방향
  setAddButtonHoverDirection: (direction: HoverDirection) => void;
  setHoverDirection: (direction: HoverDirection | null) => void;
  onAddBlock: (direction: AddButtonDirection) => void;
}
```

### AddButtonView (Presentational)

- Add Button 자체를 렌더링
- Plus 아이콘과 hover 상태 스타일링

**Props:**
```typescript
interface AddButtonViewProps {
  direction: AddButtonDirection;
  onClick: () => void;
  isHovered: boolean;
}
```

## 동작 방식

1. **Hover 감지**: Zone 영역에 마우스 진입 시 `setAddButtonHoverDirection` 호출
2. **버튼 표시**: `addButtonHoverDirection === direction`일 때 버튼 표시
3. **블록 핸들 초기화**: Zone hover 시 블록의 핸들 hover 방향을 `null`로 설정
4. **블록 추가**: 버튼 클릭 시 `onAddBlock` 호출하여 새 블록 생성

## 스타일

- **Zone 크기**: `w-8 h-8` (32px × 32px)
- **버튼 크기**: `w-7 h-7` (28px × 28px)
- **버튼 색상**: `bg-blue-500` (hover 시 `bg-blue-600`)
- **투명도**: hover 상태에 따라 `opacity-100` 또는 `opacity-30`

## 참고 자료

- [Component Development Guidelines](../../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [Base Block README](../README.md)
