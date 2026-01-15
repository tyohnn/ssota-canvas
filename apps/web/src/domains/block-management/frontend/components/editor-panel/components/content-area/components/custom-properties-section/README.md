# Custom Properties Section

커스텀 속성 섹션의 최상위 컴포넌트입니다. 블록의 커스텀 속성을 관리하는 전체 UI를 제공합니다.

## 구조

이 컴포넌트는 프랙탈 구조로 설계되어 있습니다:

```
custom-properties-section/
├── components/          # UI 컴포넌트들
│   ├── custom-property-add-popover/    # 속성 추가 팝오버
│   ├── custom-property-item/           # 개별 속성 아이템
│   ├── properties-list.tsx             # 속성 리스트 컨테이너
│   └── properties-list-box.tsx         # 속성 리스트 박스 레이아웃
├── core/                # 비즈니스 로직
│   ├── context.tsx      # Context 정의
│   ├── provider.tsx     # Provider 컴포넌트
│   ├── types.ts         # 타입 정의
│   └── use-custom-properties-section.ts  # 메인 훅
└── index.tsx            # UI와 비즈니스 로직 연결
```

## 역할

- **블록의 커스텀 속성 목록 표시**: `blockData.customProperties`를 순서대로 정렬하여 표시
- **속성 값 관리**: 각 속성의 현재 값을 `propertyValues`로 계산하여 제공
- **최근 추가된 속성 추적**: 새로 추가된 속성의 ID를 추적하여 자동으로 상세 팝오버 열기

## 비즈니스 로직

`use-custom-properties-section.ts`에서 수행하는 주요 로직:

1. **블록 데이터 조회**: ReactFlow에서 블록 노드를 가져와 데이터 추출
2. **커스텀 속성 정렬**: `order` 기준으로 정렬된 속성 목록 생성
3. **속성 값 계산**: 각 속성의 현재 값 또는 기본값을 계산하여 제공
4. **에러 처리**: 블록을 찾을 수 없는 경우 토스트 알림 표시

## 사용 예시

```tsx
<CustomPropertiesSection 
  blockId={blockId} 
/>
```

## 하위 컴포넌트

- **CustomPropertyAddPopover**: 새로운 커스텀 속성을 추가하는 팝오버
- **CustomPropertyItem**: 개별 커스텀 속성을 표시하고 편집하는 아이템 컴포넌트

