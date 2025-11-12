# Custom Property Add Popover

새로운 커스텀 속성을 추가하기 위한 팝오버 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있으며, **노코드 워크플로우를 위한 로직 분리** 패턴을 적용했습니다:

```
custom-property-add-popover/
├── components/          # UI 컴포넌트들
│   ├── trigger-button.tsx      # 🎨 팝오버 트리거 버튼 (Framer용, 순수 UI)
│   ├── label.tsx                # 라벨 표시
│   ├── name-input.tsx           # 속성 이름 입력 필드
│   ├── type-grid.tsx            # 속성 타입 선택 그리드
│   └── type-grid-item.tsx       # 개별 타입 아이템
├── core/                # 비즈니스 로직
│   ├── context.tsx                      # Context 정의
│   ├── provider.tsx                     # Provider 컴포넌트
│   ├── types.ts                         # 타입 정의
│   ├── use-custom-property-add-popover.ui.ts      # 🎨 UI 상태 훅 (디자이너용)
│   ├── use-custom-property-add-popover.business.ts # 💼 비즈니스 로직 훅 (엔지니어용)
│   └── use-custom-property-add-popover.ts          # 🔗 통합 훅
└── index.tsx            # UI와 비즈니스 로직 연결 (PopoverTrigger/Content 직접 사용)
```

## 아키텍처 패턴

### 3-Layer 구조

1. **UI Component** (`index.tsx`): Popover 구조만 선언
2. **UI State Hook** (`.ui.ts`): 디자이너가 Framer에서 사용
3. **Business Logic Hook** (`.business.ts`): 엔지니어가 배선

### 컴포넌트 분리

- **`trigger-button.tsx`**: 순수 Presentational 컴포넌트 (Framer용)
  - Radix UI, Context 의존성 없음
  - Props만으로 동작
- **`index.tsx`**: `PopoverTrigger`와 `PopoverContent` 직접 사용
  - 불필요한 래퍼 제거

## 역할

- **속성 이름 입력**: 사용자가 새 속성의 이름을 입력할 수 있도록 함
- **속성 타입 선택**: 다양한 속성 타입(텍스트, 숫자, 선택, 상태 등) 중 선택
- **아이콘 설정**: 속성 타입에 따른 기본 아이콘 자동 설정 및 커스텀 아이콘 지원
- **속성 생성**: 입력된 정보로 새로운 커스텀 속성을 생성하고 블록에 추가

## 로직 분리

### UI 상태 (`use-custom-property-add-popover.ui.ts`)

디자이너가 Framer에서 사용하는 순수 UI 상태:

1. **팝오버 상태 관리**: `open`, `setOpen`, `handleOpenChange`
2. **속성 이름 관리**: `propertyName`, `setPropertyName`
3. **아이콘 관리**: `icon`, `setIcon`
4. **입력 필드 참조**: `inputRef`

### 비즈니스 로직 (`use-custom-property-add-popover.business.ts`)

엔지니어가 배선하는 비즈니스 로직:

1. **속성 생성**: `onSubmit` - API 호출 및 Context 업데이트
2. **검증**: `validate` - 속성 이름 검증
3. **에러 처리**: API 실패 시 에러 throw

### 통합 훅 (`use-custom-property-add-popover.ts`)

UI + Business 로직을 통합:

1. **타입 선택 처리**: 
   - 타입 선택 시 속성 이름이 없으면 fallback 이름 사용
   - 타입에 맞는 기본 아이콘 자동 설정
   - 비즈니스 로직 호출 (검증 → 생성)
2. **Optimistic Update**: 팝오버 즉시 닫기
3. **에러 처리**: 실패 시 팝오버 다시 열기 및 상태 복원

## 사용 예시

### Production (기본)

```tsx
<CustomPropertyAddPopover blockId={blockId} />
// businessLogic 생략 → usePropertyAddBusiness(blockId) 자동 사용
```

### Test/Mock

```tsx
import { useMockPropertyAddBusiness } from './core/use-custom-property-add-popover.business';

const mockBusiness = useMockPropertyAddBusiness();

<CustomPropertyAddPopover
  blockId={blockId}
  businessLogic={mockBusiness} // 🧪 Mock 로직 주입
/>
```

### Framer (디자이너)

```tsx
import { TriggerButton } from './components/trigger-button';
import { usePropertyAddPopoverUI } from './core/use-custom-property-add-popover.ui';

const uiState = usePropertyAddPopoverUI();

<TriggerButton
  title="Add Property"
  isOpen={uiState.open}
  onClick={() => uiState.setOpen(!uiState.open)}
/>
```

## 특징

- ✅ **타입 선택 시 자동으로 속성 생성**
- ✅ **속성 이름이 없어도 타입별 기본 이름 사용 가능**
- ✅ **각 속성 타입에 맞는 기본 아이콘 자동 할당**
- ✅ **생성 성공 시 상위 섹션에 새 속성 ID 전달하여 자동으로 상세 팝오버 열기**
- ✅ **노코드 워크플로우 지원**: UI/Business 로직 분리로 디자이너-엔지니어 협업 용이
- ✅ **테스트 용이**: Mock 비즈니스 로직 주입 가능
- ✅ **Framer 호환**: 순수 UI 컴포넌트로 독립적 사용 가능

