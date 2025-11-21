# Custom Property Add Popover Core

커스텀 속성 추가 팝오버의 비즈니스 로직을 담당하는 core 모듈입니다.

## 파일 구조

```
core/
├── context.tsx                              # Context 정의 및 훅
├── provider.tsx                             # Provider 컴포넌트
├── types.ts                                 # 타입 정의
└── use-custom-property-add-popover.ts       # 메인 비즈니스 로직 훅
```

## 역할

### context.tsx
- `CustomPropertyAddPopoverContext` 정의
- `useCustomPropertyAddPopoverContext` 훅 제공
- Context 값 타입 정의: `CustomPropertyAddPopoverContextValue`

### provider.tsx
- `CustomPropertyAddPopoverProvider` 컴포넌트
- `useCustomPropertyAddPopover` 훅을 사용하여 Context 값 생성
- 하위 컴포넌트에 Context 제공

### types.ts
- `CustomPropertyAddPopoverProps` 타입 정의
- 컴포넌트의 props 인터페이스

### use-custom-property-add-popover.ts
메인 비즈니스 로직을 담당하는 훅:

1. **팝오버 상태 관리**
   - `open` 상태로 팝오버 열림/닫힘 관리
   - `handleOpenChange`: 상태 변경 핸들러 (열기/닫기 모두 처리, 닫을 때 상태 초기화)

2. **속성 이름 관리**
   - `propertyName` 상태로 입력된 이름 관리
   - `setPropertyName`으로 이름 업데이트
   - 팝오버 닫을 때 자동 초기화

3. **아이콘 관리**
   - `icon` 상태로 선택된 아이콘 관리
   - `setIcon`으로 아이콘 업데이트
   - 팝오버 닫을 때 자동 초기화

4. **타입 선택 처리**
   - `handleSelectType`: 타입 선택 시 호출
   - 속성 이름이 없으면 `fallbackName` 사용
   - 타입에 맞는 기본 아이콘 자동 설정 (`resolveIconForType`)
   - `createField`를 통해 속성 생성
   - 생성 성공 시 상위 섹션에 새 속성 ID 전달
   - 생성 실패 시 팝오버 다시 열기 및 상태 복원

5. **입력 필드 참조**
   - `inputRef`로 이름 입력 필드 참조 관리
   - 유효성 검사 실패 시 포커스 이동

## Context Value

```typescript
interface CustomPropertyAddPopoverContextValue {
  blockId: string;                                          // 블록 ID
  open: boolean;                                            // 팝오버 열림 상태
  propertyName: string;                                     // 입력된 속성 이름
  setPropertyName: (value: string) => void;                // 속성 이름 설정
  icon: string | null;                                      // 선택된 아이콘
  setIcon: (value: string | null) => void;                 // 아이콘 설정
  handleSelectType: (type: PropertyType, fallbackName: string) => Promise<void>; // 타입 선택 핸들러
  handleOpenChange: (nextOpen: boolean) => void;           // 팝오버 상태 변경 핸들러 (열기/닫기 모두 처리)
  inputRef: React.RefObject<HTMLInputElement | null>;      // 입력 필드 참조
}
```

## 기본 아이콘 매핑

각 속성 타입에 대한 기본 아이콘이 정의되어 있습니다:

- TEXT: 'Type'
- NUMBER: 'Hash'
- SELECT: 'List'
- MULTISELECT: 'ListChecks'
- STATUS: 'Star'
- DATE: 'Calendar'
- BOOLEAN: 'CheckSquare'
- URL: 'Link'
- EMAIL: 'Mail'
- PHONE: 'Phone'
- COLOR: 'Palette'
- PROFILE: 'User'
- 기본값: 'FileText'

## 사용 방법

```tsx
// Provider로 감싸기
<CustomPropertyAddPopoverProvider blockId={blockId}>
  {/* 하위 컴포넌트 */}
</CustomPropertyAddPopoverProvider>

// 하위 컴포넌트에서 Context 사용
const { propertyName, setPropertyName, handleSelectType } = 
  useCustomPropertyAddPopoverContext();
```

