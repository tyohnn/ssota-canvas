# Custom Property Item

개별 커스텀 속성을 표시하고 편집하는 아이템 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있습니다:

```
custom-property-item/
├── components/          # UI 컴포넌트들
│   ├── wrapper.tsx                    # 아이템 래퍼
│   ├── label.tsx                      # 속성 라벨 표시
│   ├── property-icon.tsx              # 속성 아이콘 표시
│   ├── input-box.tsx                  # 입력 박스 컨테이너
│   ├── input-renderer.tsx             # 타입별 입력 컴포넌트 렌더러
│   ├── detail-popover-trigger.tsx     # 상세 팝오버 트리거
│   └── property-detail-popover/       # 속성 상세 편집 팝오버
│       ├── components/
│       ├── core/
│       └── index.tsx
├── core/                # 비즈니스 로직
│   ├── context.tsx      # Context 정의
│   ├── provider.tsx     # Provider 컴포넌트
│   ├── types.ts         # 타입 정의
│   └── use-custom-property-item.ts  # 메인 훅
└── index.tsx            # UI와 비즈니스 로직 연결
```

## 역할

- **속성 표시**: 속성의 라벨, 아이콘, 현재 값을 표시
- **값 편집**: 속성 타입에 맞는 입력 컴포넌트를 통해 값을 직접 편집
- **상세 편집**: 팝오버를 통해 속성의 이름, 아이콘, 옵션 등을 편집

## 비즈니스 로직

`use-custom-property-item.ts`에서 수행하는 주요 로직:

1. **속성 값 관리**: 상위 섹션의 `propertyValues`에서 현재 속성의 값을 가져옴
2. **값 변경 처리**: `updateProperty`를 통해 속성 값을 업데이트
3. **팝오버 상태 관리**: 상세 편집 팝오버의 열림/닫힘 상태 관리
4. **자동 팝오버 열기**: 새로 추가된 속성인 경우 자동으로 상세 팝오버 열기

## 사용 예시

```tsx
<CustomPropertyItem property={property} />
```

## 특징

- 속성 타입에 따라 적절한 입력 컴포넌트 자동 렌더링
- 라벨 클릭 시 상세 편집 팝오버 열기
- 값 변경 시 즉시 블록 데이터 업데이트
- 새로 추가된 속성은 자동으로 상세 팝오버가 열려 편집 가능

