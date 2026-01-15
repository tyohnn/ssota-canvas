# Custom Properties Section Core

커스텀 속성 섹션의 비즈니스 로직을 담당하는 core 모듈입니다.

## 파일 구조

```
core/
├── context.tsx                          # Context 정의 및 훅
├── provider.tsx                         # Provider 컴포넌트
├── types.ts                             # 타입 정의
└── use-custom-properties-section.ts     # 메인 비즈니스 로직 훅
```

## 역할

### context.tsx
- `CustomPropertiesSectionContext` 정의
- `useCustomPropertiesSectionContext` 훅 제공
- Context 값 타입 정의: `CustomPropertiesSectionContextValue`

### provider.tsx
- `CustomPropertiesSectionProvider` 컴포넌트
- `useCustomPropertiesSection` 훅을 사용하여 Context 값 생성
- 하위 컴포넌트에 Context 제공

### types.ts
- `CustomPropertiesSectionProps` 타입 정의
- 컴포넌트의 props 인터페이스

### use-custom-properties-section.ts
메인 비즈니스 로직을 담당하는 훅:

1. **블록 데이터 조회**
   - ReactFlow에서 블록 노드 가져오기
   - 블록이 없을 경우 에러 처리 및 토스트 알림

2. **커스텀 속성 목록 관리**
   - `blockData.customProperties`에서 속성 목록 추출
   - `order` 기준으로 정렬

3. **속성 값 계산**
   - `blockData.properties`에서 각 속성의 현재 값 추출
   - 값이 없으면 속성의 `defaultValue` 사용
   - 계산된 값들을 `propertyValues` 객체로 제공

4. **최근 추가된 속성 추적**
   - `lastAddedPropertyId` 상태 관리
   - 새로 추가된 속성의 ID를 추적하여 하위 컴포넌트에서 사용

## Context Value

```typescript
interface CustomPropertiesSectionContextValue {
  blockId: string;                                    // 블록 ID
  resolvedBlockData: BlockNodeData;                   // 해석된 블록 데이터
  customProperties: CustomPropertyDefinition[];      // 정렬된 커스텀 속성 목록
  propertyValues: Record<string, unknown>;            // 속성 ID별 현재 값
  lastAddedPropertyId: string | null;                 // 최근 추가된 속성 ID
  setLastAddedPropertyId: (id: string | null) => void; // 최근 추가된 속성 ID 설정
}
```

## 사용 방법

```tsx
// Provider로 감싸기
<CustomPropertiesSectionProvider blockId={blockId} blockData={blockData}>
  {/* 하위 컴포넌트 */}
</CustomPropertiesSectionProvider>

// 하위 컴포넌트에서 Context 사용
const { customProperties, propertyValues } = useCustomPropertiesSectionContext();
```

