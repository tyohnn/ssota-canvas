# 프론트엔드 컴포넌트 개발 가이드라인

## 목차
- [개요](#개요)
- [핵심 원칙](#핵심-원칙)
- [컴포넌트 패턴](#컴포넌트-패턴)
- [폴더 구조](#폴더-구조)
- [Props 설계](#props-설계)
- [상태 관리](#상태-관리)
- [노코드 워크플로우를 위한 로직 분리](#노코드-워크플로우를-위한-로직-분리)
- [Optimistic Updates with TanStack Query](#optimistic-updates-with-tanstack-query)
- [실전 예제](#실전-예제)
- [안티패턴](#안티패턴)

---

## 개요

이 가이드라인은 SSOTA 프로젝트의 프론트엔드 컴포넌트 개발 표준을 정의합니다. 특히 다음 두 가지 목표를 염두에 두고 설계되었습니다:

1. **노코드 툴 호환성**: Framer, Webflow와 같은 노코드 개발 툴에서 사용 가능한 컴포넌트 구조
2. **선언적 UI 구성**: 비즈니스 로직과 UI 표현을 명확히 분리하여 가독성과 유지보수성 향상

---

## 핵심 원칙

### 1. Compound Component Pattern 우선

복잡한 UI를 구성할 때는 단일 컴포넌트보다 여러 서브 컴포넌트의 조합으로 설계합니다.

**✅ 좋은 예:**
```tsx
<PropertyAddPopover>
  <PropertyNameInput />
  <PropertyTypeGrid />
</PropertyAddPopover>
```

**❌ 나쁜 예:**
```tsx
<PropertyAddPopover 
  renderInput={(props) => <input {...props} />}
  renderGrid={(props) => <div {...props} />}
/>
```

### 2. Context를 통한 상태 공유

부모-자식 간 로직 공유는 Props Drilling이 아닌 Context를 사용합니다.

**✅ 좋은 예:**
```tsx
// 내부 훅으로 로직 캡슐화
const usePropertyAddPopoverContext = () => {
  const context = useContext(PropertyAddPopoverContext);
  if (!context) {
    throw new Error('Must be used within PropertyAddPopover');
  }
  return context;
};

// 자식 컴포넌트에서 자동으로 연결
const PropertyNameInput = () => {
  const { propertyName, setPropertyName } = usePropertyAddPopoverContext();
  return <Input value={propertyName} onChange={setPropertyName} />;
};
```

**❌ 나쁜 예:**
```tsx
// Props로 함수와 상태를 직접 전달
<PropertyNameInput 
  value={propertyName}
  onChange={setPropertyName}
  onEscape={handleClose}
/>
```

### 3. 로직 분리와 테스트 가능성

컴포넌트는 **UI 상태**와 **비즈니스 로직**을 분리하여 테스트와 재사용이 쉬워야 합니다.

**파일 구조:**
```
component/
├── index.tsx                      # UI 구조 (선언적)
├── use-component.ui.ts            # UI 상태 (로컬 상태 관리)
├── use-component.business.ts      # 비즈니스 로직 (API, 검증)
├── use-component.ts               # 통합 (UI + Business)
└── context.tsx                    # Context Provider
```

**장점:**
- ✅ **노코드 툴 호환**: 디자이너는 `.ui.ts`만 사용
- ✅ **테스트 용이**: UI/Business 로직 각각 독립 테스트
- ✅ **Mock 지원**: 비즈니스 로직을 쉽게 교체 가능

> 💡 **자세한 내용**: [노코드 워크플로우를 위한 로직 분리](#노코드-워크플로우를-위한-로직-분리) 참조

---

## 컴포넌트 패턴

### Static Member Compound Pattern (FlyOut 스타일, 내부 조합)

실제 리팩토링 결과, **Provider + 서브 컴포넌트 분리** 구조는 유지하면서도 정적 멤버를 외부로 노출하지 않고 `index.tsx`에서 미리 조합한 레이아웃을 반환하는 방식을 채택했습니다. 커스텀 속성 추가 플로우의 UI 구성이 모든 화면에서 동일하다는 점을 반영한 결정입니다.

#### 왜 이렇게 조정했는가?
- **소비자 코드 단순화**: `PropertyAddPopover`를 호출하기만 하면 내부적으로 Trigger → Content → Label → NameInput → TypeGrid 순서가 구성되어, 추가적인 선언 없이 바로 사용할 수 있습니다.
- **Radix Popover 연동 간소화**: `PopoverTrigger`가 자체적으로 열림/닫힘을 관리하므로, Trigger에서 context의 `toggleOpen`을 직접 호출할 필요가 없어졌습니다.
- **확장성 확보**: 서브 컴포넌트는 여전히 별도 파일로 분리되어 있어, 필요 시 정적 멤버 형태로 재노출하거나 커스터마이징 버전을 제공하기 쉽습니다.

#### 현재 구성 요소
- `property-add-popover/index.tsx`: Provider + Trigger + Content + Label + PropertyNameInput + PropertyTypeGrid를 조합한 최종 엔트리
- `property-add-popover/provider.tsx`: Context Provider와 Radix `Popover` 래핑
- `property-add-popover/property-add-popover.context.tsx`: Context와 커스텀 훅 정의
- `property-add-popover/use-property-add-popover.ts`: 상태 및 비즈니스 로직
- `property-add-popover/trigger.tsx`: 버튼 UI (`title` 텍스트 커스터마이즈 허용)
- `property-add-popover/content.tsx`: PopoverContent 래퍼 (`onEscapeKeyDown`에서 닫기 처리)
- `property-add-popover/property-name-input.tsx`: 이름 입력 필드 + 내부 IconPicker 상태 관리
- `property-add-popover/property-type-grid.tsx`: 타입 선택 그리드
- `property-add-popover/property-type-grid-item.tsx`: 타입 선택 버튼

#### 실제 코드 스니펫
```tsx
// index.tsx (요약)
export function PropertyAddPopover({ blockId }: PropertyAddPopoverProps) {
  return (
    <PropertyAddPopoverProvider blockId={blockId}>
      <Trigger />
      <Content>
        <Label
          htmlFor="property-name"
          className="text-xs font-medium text-muted-foreground"
        >
          커스텀 속성 추가
        </Label>
        <PropertyNameInput />
        <PropertyTypeGrid />
      </Content>
    </PropertyAddPopoverProvider>
  );
}
```

필요 시 아래와 같이 서브 컴포넌트를 독립적으로 export해 정적 멤버 패턴으로 재구성할 수 있습니다. 현재는 요구 사항이 없어 기본 엔트리만 공개합니다.

```tsx
// 확장 예시 (필요 시)
export { Trigger as PropertyAddPopoverTrigger } from './trigger';
export { Content as PropertyAddPopoverContent } from './content';
```

#### 권장 폴더 구조
```
property-add-popover/
├── index.tsx                        # Provider + 내부 조합
├── provider.tsx                     # Provider 컴포넌트 (Context Provider + Popover 구조)
├── property-add-popover.context.tsx # Context 정의 및 커스텀 훅
├── use-property-add-popover.ts      # 상태∙비즈니스 로직
├── trigger.tsx                      # Popover Trigger UI
├── content.tsx                      # Popover Content 래퍼
├── property-name-input.tsx          # 이름 입력 필드
├── property-type-grid.tsx           # 타입 선택 그리드
├── property-type-grid-item.tsx      # 타입 선택 버튼
└── types.ts                         # 공유 타입 정의
```

> 💡 **노트:** 노코드 툴에서 블록 구조를 임의로 재배치해야 하는 요구가 생기면, 기존에 문서화해 둔 정적 멤버 패턴을 다시 도입하여 외부에 공개하는 것을 권장합니다. 두 접근 모두 동일한 컨텍스트/훅 로직을 재사용할 수 있습니다.

---

## 폴더 구조

### 기본 구조

```
component-name/
├── index.tsx                # 메인 컴포넌트 (export default)
├── context.tsx              # Context 정의 (선택)
├── use-component-name.ts    # 비즈니스 로직 훅 (선택)
├── types.ts                 # 공유 타입
├── sub-component-a.tsx      # 서브 컴포넌트
├── sub-component-b.tsx      # 서브 컴포넌트
└── utils.ts                 # 유틸리티 함수 (선택)
```

### 파일명 규칙

- **index.tsx**: 메인 컴포넌트, 폴더 대표 export
- **use-xxx.ts**: Custom Hook (use- prefix 필수)
- **xxx-context.tsx**: Context Provider와 Consumer
- **types.ts**: 타입 정의만 포함
- 모든 파일은 kebab-case 사용

---

## Props 설계

### 노코드 친화적 Props

**✅ 노출해야 할 Props:**
- 디자인 관련: `className`, `style`, `variant`, `size`
- 텍스트 콘텐츠: `label`, `placeholder`, `title`
- 불리언 플래그: `disabled`, `required`, `readOnly`
- 단순 값: `defaultValue`, `maxLength`

**❌ 노출하지 말아야 할 Props:**
- 함수: `onChange`, `onClick`, `onSubmit`
- 복잡한 객체: `config`, `options` (객체 타입)
- Ref: `inputRef`, `ref`
- 상태: `value`, `isOpen`

### 타입 정의

```tsx
// types.ts
export interface PropertyAddPopoverProps {
  blockId: string;              // 외부에서 전달받는 필수 Props
  children?: React.ReactNode;   // 추후 커스텀 구성을 위해 예약 (기본 조합 사용 시 생략)
}

// 내부 타입은 export하지 않음
interface InternalState {
  propertyName: string;
  open: boolean;
}
```

`Trigger`, `Content`, `PropertyNameInput`, `PropertyTypeGrid` 등 서브 컴포넌트는 노코드 호환을 위해 다음과 같이 최소한의 값/스타일 Props만 노출합니다.

- `TriggerProps`: `{ title?: string }`
- `ContentProps`: `{ className?: string }`
- `PropertyNameInputProps`: `{ placeholder?: string; className?: string; autoFocus?: boolean }`
- `PropertyTypeGridProps`: `{ options?: PropertyTypeOption[] }`

함수 Props 없이도 커스터마이징이 가능하도록, 모든 액션은 Context에서 제공하는 핸들러를 직접 호출합니다. IconPicker와 같이 추가 UI 상태가 필요한 경우에도 컴포넌트 내부에서 캡슐화하여 외부 노출을 최소화합니다.

---

## 상태 관리

### 로컬 상태 (useState, useReducer)

컴포넌트 내부에서만 사용하는 UI 상태는 로컬 상태로 관리합니다.

```tsx
const [open, setOpen] = useState(false);
const [propertyName, setPropertyName] = useState('');
```

### 공유 상태 (Context)

서브 컴포넌트 간 공유가 필요한 상태는 Context로 관리합니다.

```tsx
const PropertyAddPopoverContext = createContext<ContextValue>(null);
```

### 도메인 상태 (Custom Hook)

서버 데이터나 도메인 로직은 별도 훅으로 분리합니다.

```tsx
const { createField } = useCustomProperty();
```

---

## 노코드 워크플로우를 위한 로직 분리

### Why: 디자이너-엔지니어 협업

노코드 툴(Framer 등)에서 디자이너가 UI를 작업하고, 엔지니어가 비즈니스 로직을 배선하는 워크플로우를 지원합니다.

**핵심 아이디어:**
- 🎨 **디자이너**: UI 상태만 다루며 Framer에서 독립적으로 작업
- 💼 **엔지니어**: 비즈니스 로직만 집중하여 나중에 배선
- 🔌 **통합**: Optional Injection으로 유연하게 연결

```
┌─────────────────────────────────────────┐
│  Designer (Framer)                      │
│  ↓ UI State Hook (.ui.ts)               │
│  → open, propertyName 등                │
│  → Mock 비즈니스 로직으로 테스트          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Engineer (Production)                  │
│  ↓ Business Logic (.business.ts)        │
│  → API 호출, 검증, 에러 처리             │
│  → Combined Hook에서 통합                │
└─────────────────────────────────────────┘
```

### 워크플로우

#### Phase 1: 디자이너 작업 (Framer)

디자이너는 UI State Hook만 사용하여 Framer에서 독립적으로 작업합니다:

```tsx
// Framer 환경
function CustomPropertyAddPopover_Designer({ blockId }: { blockId: string }) {
  // UI 상태만 사용 (비즈니스 로직 없음)
  const uiState = usePropertyAddPopoverUI();

  // Mock 비즈니스 로직
  const mockBusiness = useMockPropertyAddBusiness();

  return (
    <Popover open={uiState.open} onOpenChange={uiState.handleOpenChange}>
      <PopoverTrigger>+ Add Property</PopoverTrigger>
      <PopoverContent>
        <Input
          ref={uiState.inputRef}
          value={uiState.propertyName}
          onChange={(e) => uiState.setPropertyName(e.target.value)}
        />
        <TypeGrid onSelect={mockBusiness.onSubmit} />
      </PopoverContent>
    </Popover>
  );
}
```

**디자이너가 할 수 있는 것:**
- ✅ UI 레이아웃 디자인
- ✅ 인터랙션 테스트 (open/close, input)
- ✅ 애니메이션, 스타일링
- ✅ Framer에서 실시간 프리뷰

**디자이너가 할 필요 없는 것:**
- ❌ API 연동
- ❌ 데이터 검증
- ❌ 에러 처리

#### Phase 2: 엔지니어 배선

엔지니어는 비즈니스 로직을 주입하여 Production 환경을 구성합니다:

```tsx
// Production 환경
function CustomPropertyAddPopover({ blockId }: { blockId: string }) {
  // 실제 비즈니스 로직 주입 (또는 생략하면 기본값 사용)
  const business = usePropertyAddBusiness(blockId);

  return (
    <CustomPropertyAddPopoverComponent
      blockId={blockId}
      businessLogic={business} // 🔌 비즈니스 로직 배선
    />
  );
}

// 또는 기본값 사용 (businessLogic 생략 시 자동으로 production 로직 사용)
<CustomPropertyAddPopover blockId={blockId} />
```

### 1️⃣ UI State Hook (`.ui.ts`)

```tsx
// use-custom-property-add-popover.ui.ts
export interface PropertyAddPopoverUIState {
  // UI 상태
  open: boolean;
  propertyName: string;
  icon: string | null;
  
  // UI 액션
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
  handleOpenChange: (open: boolean) => void;
  
  // Ref
  inputRef: RefObject<HTMLInputElement | null>;
}

export function usePropertyAddPopoverUI(): PropertyAddPopoverUIState {
  const [open, setOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPropertyName('');
      setIcon(null);
    }
  }, []);

  return {
    open,
    propertyName,
    icon,
    setOpen,
    setPropertyName,
    setIcon,
    handleOpenChange,
    inputRef,
  };
}
```

**핵심 특징:**
- ✅ 비즈니스 로직 없음
- ✅ 로컬 상태 관리만
- ✅ 노코드 환경에서 독립적으로 테스트 가능
- ✅ API 호출 없음

### 2️⃣ Business Logic Hook (`.business.ts`)

```tsx
// use-custom-property-add-popover.business.ts
export interface PropertyAddBusinessLogic {
  onSubmit: (params: {
    name: string;
    type: PropertyType;
    icon: string;
  }) => Promise<void>;
  
  validate?: (name: string) => string | null;
  onCancel?: () => void;
}

/**
 * Production 비즈니스 로직
 */
export function usePropertyAddBusiness(
  blockId: string
): PropertyAddBusinessLogic {
  const { createField } = useCustomProperty();
  const { setLastAddedPropertyId } = useCustomPropertiesSectionContext();

  const onSubmit = useCallback(
    async (params) => {
      try {
        const newPropertyId = await createField(blockId, params);
        setLastAddedPropertyId(newPropertyId);
      } catch (error) {
        console.error('Failed to create property:', error);
        throw error;
      }
    },
    [blockId, createField, setLastAddedPropertyId]
  );

  const validate = useCallback((name: string) => {
    if (!name.trim()) return 'Property name is required';
    if (name.length > 50) return 'Property name is too long';
    return null;
  }, []);

  return { onSubmit, validate };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockPropertyAddBusiness(): PropertyAddBusinessLogic {
  const onSubmit = useCallback(async (params) => {
    console.log('[Mock] Creating property:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  return { onSubmit };
}
```

**핵심 특징:**
- ✅ API 호출
- ✅ 데이터 검증
- ✅ 에러 처리
- ✅ 도메인 로직
- ✅ Mock 버전 제공

### 3️⃣ Combined Hook (통합)

```tsx
// use-custom-property-add-popover.ts
export function useCustomPropertyAddPopover(
  blockId: string,
  businessLogic?: PropertyAddBusinessLogic // 🎯 Optional injection
) {
  // UI State (디자이너 영역)
  const uiState = usePropertyAddPopoverUI();
  
  // Business Logic (엔지니어 영역)
  const defaultBusiness = usePropertyAddBusiness(blockId);
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic
  const handleSelectType = useCallback(
    async (type: PropertyType, fallbackName: string) => {
      const finalName = uiState.propertyName.trim() || fallbackName;

      // Business: Validation
      const error = business.validate?.(finalName);
      if (error) {
        console.warn('Validation error:', error);
        return;
      }

      // UI: Close optimistically
      uiState.setOpen(false);

      try {
        // Business: Submit
        await business.onSubmit({
          name: finalName,
          type,
          icon: uiState.icon || 'FileText',
        });
        
        // UI: Reset on success
        uiState.setPropertyName('');
        uiState.setIcon(null);
      } catch (error) {
        // UI: Restore on error
        uiState.setOpen(true);
      }
    },
    [uiState, business]
  );

  return {
    blockId,
    ...uiState,
    handleSelectType,
  };
}
```

**핵심 특징:**
- ✅ UI + Business 통합
- ✅ Optional injection 지원
- ✅ Production: 기본 비즈니스 로직 사용
- ✅ Test/Mock: 커스텀 로직 주입 가능

### 사용 예시

#### Production 환경

```tsx
// 기본 비즈니스 로직 사용 (businessLogic 생략)
<CustomPropertyAddPopover blockId={blockId} />

// 커스텀 비즈니스 로직 주입
const customBusiness = useCustomBusiness();
<CustomPropertyAddPopover blockId={blockId} businessLogic={customBusiness} />
```

#### Test 환경

```tsx
const mockBusiness = useMockPropertyAddBusiness();
<CustomPropertyAddPopover blockId="test-id" businessLogic={mockBusiness} />
```

#### Framer 환경

```tsx
// UI State Hook만 직접 사용
const uiState = usePropertyAddPopoverUI();
const mockBusiness = useMockPropertyAddBusiness();

// UI 컴포넌트 직접 구성
<Popover open={uiState.open}>
  <Input value={uiState.propertyName} />
  {/* ... */}
</Popover>
```

### 이 패턴이 해결하는 문제

**Before (단일 훅):**
```tsx
// ❌ UI + Business 로직이 섞여있어 Framer에서 사용 불가
const { open, propertyName, handleSubmit } = usePropertyAddPopover(blockId);
// handleSubmit 내부에 API 호출이 있어 디자이너가 테스트 불가
```

**After (분리된 훅):**
```tsx
// ✅ 디자이너: UI 로직만 사용
const uiState = usePropertyAddPopoverUI();
const mockBusiness = useMockPropertyAddBusiness();

// ✅ 엔지니어: 비즈니스 로직 배선
const business = usePropertyAddBusiness(blockId);
<CustomPropertyAddPopover blockId={blockId} businessLogic={business} />
```

**장점:**
- ✅ **노코드 툴 호환**: 디자이너가 Framer에서 독립적으로 작업
- ✅ **테스트 용이**: UI/Business 각각 독립 테스트
- ✅ **유연성**: Mock/Prod 로직 쉽게 교체
- ✅ **재사용성**: UI 훅을 다른 컴포넌트에서 재사용

---

## Optimistic Updates with TanStack Query

복잡한 상태 관리와 Optimistic Update를 간단하게 처리하기 위해 TanStack Query를 사용합니다.

### 개념

**Optimistic Update란?**
서버 응답을 기다리지 않고 UI를 먼저 업데이트하여 사용자 경험을 개선하는 패턴입니다.

```
1. 사용자 액션 → UI 즉시 업데이트 (Optimistic)
2. 백그라운드에서 서버 요청
3. 성공 → 그대로 유지
4. 실패 → 자동 롤백
```

### 문제점 (Before TanStack Query)

```tsx
// ❌ 복잡한 수동 Optimistic Update
export function useBlockPropertyUpdate() {
  const updateProperty = async (blockId, path, value, blockData) => {
    // 1. 원본 백업
    const originalData = blockData;
    
    // 2. Optimistic update
    const updatedData = updateNestedProperty(blockData, path, value);
    updateNode(blockId, { data: updatedData });
    
    try {
      // 3. 검증
      if (!blockData.workspaceId) {
        updateNode(blockId, { data: originalData }); // Rollback
        return;
      }
      
      // 4. Server action
      const result = await updateBlockPropertyAction(...);
      
      if (isFailure(result)) {
        updateNode(blockId, { data: originalData }); // Rollback
      }
    } catch (error) {
      updateNode(blockId, { data: originalData }); // Rollback
    }
  };
}
```

**문제점:**
- ✅ Rollback 로직이 3곳에 중복
- ✅ 로딩 상태 수동 관리
- ✅ 에러 처리 반복
- ✅ 코드 가독성 저하

### 해결 (After TanStack Query)

```tsx
// ✅ TanStack Query로 간결하게
import { useMutation } from '@tanstack/react-query';

export function useBlockPropertyUpdate() {
  const { updateNode, getNode } = useReactFlow();

  const mutation = useMutation({
    // Server action
    mutationFn: async ({ blockData, propertyPath, value }) => {
      // Validation
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Missing workspaceId or orgId');
      }

      const request = {
        blockId: blockData.blockId,
        propertyPath,
        value,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const result = await updateBlockPropertyAction(request);
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result;
    },

    // Optimistic Update
    onMutate: async ({ blockId, propertyPath, value, blockData }) => {
      // Get latest data
      const latestNode = getNode(blockId);
      const currentData = latestNode?.data || blockData;

      // Backup for rollback
      const previousData = currentData;

      // Apply optimistic update
      const updatedData = updateNestedProperty(currentData, propertyPath, value);
      updateNode(blockId, { data: updatedData });

      // Return context for rollback
      return { previousData, blockId };
    },

    // Auto rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
      toast.error(error.message);
    },
  });

  return {
    updateProperty: mutation.mutateAsync,
    isUpdating: mutation.isPending, // 🎯 로딩 상태 자동 관리
  };
}
```

**장점:**
- ✅ Rollback 자동 처리 (onError)
- ✅ 로딩 상태 자동 관리 (isPending)
- ✅ 에러 처리 한 곳에 집중
- ✅ 코드 가독성 향상 (70% 감소)
- ✅ 업계 표준 패턴

### 설정

#### 1. 패키지 설치

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

#### 2. QueryClient Provider 설정

```tsx
// lib/query-client.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5분
          },
          mutations: {
            retry: false, // Optimistic update는 즉시 롤백
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 3. Root Layout에 추가

```tsx
// app/provider.tsx
import { QueryProvider } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </NextThemesProvider>
    </QueryProvider>
  );
}
```

### 사용 예시

#### Before (수동 Optimistic Update)

```tsx
// ❌ 296 lines of code
export function useBlockPropertyUpdate() {
  const updateProperty = async (blockId, path, value, blockData) => {
    const originalData = blockData;
    const updatedData = updateNestedProperty(blockData, path, value);
    updateNode(blockId, { data: updatedData });

    try {
      if (!blockData.workspaceId || !blockData.orgId) {
        updateNode(blockId, { data: originalData });
        return;
      }

      const request = { ... };
      const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);
      if (!parseResult.success) {
        updateNode(blockId, { data: originalData });
        return;
      }

      const result = await updateBlockPropertyAction(parseResult.data);
      if (isFailure(result)) {
        updateNode(blockId, { data: originalData });
      }
    } catch (error) {
      updateNode(blockId, { data: originalData });
    }
  };

  // updateProperties, updatePropertyImmediate... (반복)
}
```

#### After (TanStack Query)

```tsx
// ✅ ~100 lines of code (66% 감소)
export function useBlockPropertyUpdate() {
  const { updateNode, getNode } = useReactFlow();

  const mutation = useMutation({
    mutationFn: async ({ blockData, propertyPath, value }) => {
      // Validation & Server action
      const result = await updateBlockPropertyAction(...);
      if (isFailure(result)) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ blockId, propertyPath, value, blockData }) => {
      const previousData = blockData;
      const updatedData = updateNestedProperty(blockData, propertyPath, value);
      updateNode(blockId, { data: updatedData });
      return { previousData, blockId };
    },
    onError: (error, variables, context) => {
      updateNode(context.blockId, { data: context.previousData });
      toast.error(error.message);
    },
  });

  return {
    updateProperty: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
```

### 주요 API

#### useMutation

```tsx
const mutation = useMutation({
  mutationFn: async (variables) => {
    // Server action
    return await serverAction(variables);
  },
  
  onMutate: async (variables) => {
    // Optimistic update
    // Return context for rollback
    return { previousData: ... };
  },
  
  onError: (error, variables, context) => {
    // Auto rollback
  },
  
  onSuccess: (data, variables, context) => {
    // Success handling
  },
});

// Usage
mutation.mutate(variables);           // Fire and forget
await mutation.mutateAsync(variables); // Wait for result

// State
mutation.isPending  // Loading state
mutation.isError    // Error state
mutation.isSuccess  // Success state
mutation.data       // Result data
mutation.error      // Error object
```

### 고급 패턴

#### 1. Multiple Mutations

```tsx
export function useBlockPropertyUpdate() {
  const propertyMutation = useMutation({ ... });
  const propertiesMutation = useMutation({ ... });

  return {
    updateProperty: propertyMutation.mutateAsync,
    updateProperties: propertiesMutation.mutateAsync,
    isUpdating: propertyMutation.isPending || propertiesMutation.isPending,
  };
}
```

#### 2. Query Invalidation (Cache Refresh)

```tsx
import { useQueryClient } from '@tanstack/react-query';

const mutation = useMutation({
  mutationFn: updateBlock,
  onSuccess: () => {
    // Refetch related queries
    queryClient.invalidateQueries({ queryKey: ['blocks'] });
  },
});
```

#### 3. Optimistic Update with useQuery

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['block', blockId],
  queryFn: () => fetchBlock(blockId),
});

const mutation = useMutation({
  mutationFn: updateBlock,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['block', blockId] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['block', blockId]);
    
    // Optimistically update
    queryClient.setQueryData(['block', blockId], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback
    queryClient.setQueryData(['block', blockId], context.previous);
  },
});
```

### 언제 사용하는가?

#### ✅ TanStack Query 사용 (권장)
- Optimistic update가 필요한 경우
- 서버 상태 관리가 복잡한 경우
- 캐싱, 재시도, 로딩 상태가 필요한 경우
- 여러 컴포넌트에서 같은 데이터를 사용하는 경우

#### ❌ TanStack Query 불필요
- 로컬 UI 상태만 관리하는 경우
- 서버 통신이 없는 경우
- 단순한 폼 상태 (React Hook Form 사용)

### 참고 자료

- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [useMutation API](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)

---

## 실전 예제

이 가이드라인의 핵심 개념을 실제로 적용한 예시를 확인하세요:

### 1. Compound Component Pattern
→ [컴포넌트 패턴](#컴포넌트-패턴) 섹션 참조

### 2. 로직 분리 (UI + Business)
→ [노코드 워크플로우를 위한 로직 분리](#노코드-워크플로우를-위한-로직-분리) 섹션 참조

### 3. Optimistic Updates
→ [Optimistic Updates with TanStack Query](#optimistic-updates-with-tanstack-query) 섹션 참조

**실제 리팩토링 케이스:**
- `CustomPropertyAddPopover`: UI/Business 로직 분리 패턴 적용
- `useBlockPropertyUpdate`: TanStack Query로 Optimistic Update 구현 (코드 66% 감소)

---

## 안티패턴

### 1. Render Props 과용

```tsx
// ❌ 노코드 툴에서 사용 불가
<PropertyAddPopover
  renderInput={(props) => <Input {...props} />}
  renderGrid={(props) => <Grid {...props} />}
/>
```

### 2. 함수 Props 남발

```tsx
// ❌ 노코드 툴에서 함수를 전달할 수 없음
<PropertyNameInput 
  onChange={handleChange}
  onBlur={handleBlur}
  onFocus={handleFocus}
/>
```

### 3. 복잡한 객체 Props

```tsx
// ❌ 노코드 툴에서 객체를 구성하기 어려움
<PropertyTypeGrid 
  config={{
    columns: 2,
    gap: 8,
    options: [...],
    handlers: {...}
  }}
/>
```

### 4. Context 남용

```tsx
// ❌ 전역 Context로 만들면 안 됨
// 폴더 로컬 Context로 제한
export const GlobalPropertyAddPopoverContext = ...
```

---

## 체크리스트

새 컴포넌트를 만들 때 다음을 확인하세요:

### 기본 구조
- [ ] 폴더 구조가 가이드라인을 따르는가?
- [ ] Props에 함수가 포함되어 있지 않은가?
- [ ] 서브 컴포넌트가 Context를 통해 상태를 공유하는가?
- [ ] index.tsx가 UI 구조만 표현하는가?
- [ ] Context가 폴더 로컬로 제한되어 있는가?
- [ ] 타입이 명확히 정의되어 있는가?
- [ ] 노코드 툴에서 사용 가능한 구조인가?

### 로직 분리 (노코드 워크플로우)
- [ ] UI 로직이 `.ui.ts` 파일로 분리되어 있는가?
- [ ] 비즈니스 로직이 `.business.ts` 파일로 분리되어 있는가?
- [ ] 통합 훅이 Optional Injection을 지원하는가?
- [ ] Mock 비즈니스 로직이 제공되는가?
- [ ] UI 훅이 비즈니스 로직 없이 독립적으로 동작하는가?
- [ ] 디자이너가 Framer에서 테스트할 수 있는 구조인가?

### Optimistic Updates
- [ ] 복잡한 상태 업데이트에 TanStack Query를 사용하는가?
- [ ] useMutation으로 Optimistic update를 구현했는가?
- [ ] onMutate에서 backup 데이터를 반환하는가?
- [ ] onError에서 자동 rollback을 처리하는가?
- [ ] isPending으로 로딩 상태를 관리하는가?

---

## 참고 자료

### 영향을 받은 라이브러리

- **Radix UI**: Compound Component 패턴의 모범 사례
- **Headless UI**: 로직과 표현 분리
- **Chakra UI**: Context 기반 테마 시스템
- **React Hook Form**: Context를 활용한 폼 상태 관리
- **TanStack Query**: Optimistic Update와 서버 상태 관리

### 추가 읽을거리

- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Framer Component Guidelines](https://www.framer.com/developers/)
- [Radix UI Architecture](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-11-10 | 3.0.0 | TanStack Query를 활용한 Optimistic Updates 패턴 추가 |
| 2025-11-10 | 2.0.0 | 노코드 워크플로우를 위한 로직 분리 패턴 추가 (UI/Business 3-Layer 아키텍처) |
| 2025-11-08 | 1.0.0 | 초안 작성 (PropertyAddPopover 리팩토링 기반) |


