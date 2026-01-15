# Custom Property Item Core

커스텀 속성 아이템의 비즈니스 로직을 담당하는 core 모듈입니다.

## 파일 구조

```
core/
├── context.tsx                      # Context 정의 및 훅
├── provider.tsx                     # Provider 컴포넌트
├── types.ts                         # 타입 정의
└── use-custom-property-item.ts      # 메인 비즈니스 로직 훅
```

## 역할

### context.tsx
- `CustomPropertyItemContext` 정의
- `useCustomPropertyItemContext` 훅 제공
- Context 값 타입 정의: `CustomPropertyItemContextValue`

### provider.tsx
- `CustomPropertyItemProvider` 컴포넌트
- `useCustomPropertyItem` 훅을 사용하여 Context 값 생성
- 하위 컴포넌트에 Context 제공

### types.ts
- `CustomPropertyItemProps` 타입 정의
- 컴포넌트의 props 인터페이스

### use-custom-property-item.ts
메인 비즈니스 로직을 담당하는 훅:

1. **상위 Context 의존성**
   - `useCustomPropertiesSectionContext`를 통해 블록 ID, 속성 값, 최근 추가된 속성 ID 등에 접근

2. **속성 값 관리**
   - `propertyValues`에서 현재 속성의 값을 가져옴
   - `value`로 제공하여 하위 컴포넌트에서 사용

3. **값 변경 처리**
   - `handleValueChange`: 속성 값 변경 핸들러
   - `updateProperty`를 통해 `properties.{propertyId}` 경로로 값 업데이트
   - 블록 데이터와 함께 업데이트하여 최신 상태 유지

4. **팝오버 상태 관리**
   - `popoverOpen` 상태로 상세 편집 팝오버의 열림/닫힘 관리
   - `setPopoverOpen`으로 상태 업데이트

5. **자동 팝오버 열기**
   - `lastAddedPropertyId`가 현재 속성 ID와 일치하면 자동으로 팝오버 열기
   - 팝오버 열기 후 `lastAddedPropertyId` 초기화

## Context Value

```typescript
interface CustomPropertyItemContextValue {
  blockId: string;                                    // 블록 ID
  property: CustomPropertyDefinition;                 // 속성 정의
  value: unknown;                                      // 현재 속성 값
  handleValueChange: (nextValue: unknown) => void;    // 값 변경 핸들러
  popoverOpen: boolean;                                // 상세 팝오버 열림 상태
  setPopoverOpen: (open: boolean) => void;            // 상세 팝오버 상태 설정
}
```

## 사용 방법

```tsx
// Provider로 감싸기
<CustomPropertyItemProvider property={property}>
  {/* 하위 컴포넌트 */}
</CustomPropertyItemProvider>

// 하위 컴포넌트에서 Context 사용
const { value, handleValueChange, popoverOpen, setPopoverOpen } = 
  useCustomPropertyItemContext();
```

## 특징

- 상위 섹션의 Context와 연동하여 블록 데이터 접근
- 속성 값 변경 시 즉시 블록 데이터 업데이트
- 새로 추가된 속성은 자동으로 상세 팝오버가 열려 편집 가능

