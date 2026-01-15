# Option Sections

필드 타입에 따라 적절한 옵션 관리 섹션을 렌더링하는 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있습니다:

```
option-sections/
├── components/          # UI 컴포넌트들
│   ├── option-item.tsx              # 개별 옵션 아이템 컴포넌트
│   ├── option-edit-popover.tsx      # 옵션 편집 팝오버 컴포넌트
│   ├── select-like-option/          # SELECT/MULTISELECT 타입 옵션
│   │   ├── index.tsx
│   │   ├── options-section.tsx
│   │   ├── types.ts
│   │   └── README.md
│   └── status-option/               # STATUS 타입 옵션
│       ├── index.tsx
│       ├── status-groups-section.tsx
│       ├── types.ts
│       └── README.md
├── core/                # 비즈니스 로직
│   ├── context.tsx      # Context 정의
│   ├── provider.tsx     # Provider 컴포넌트
│   ├── use-option-management.ts  # 메인 훅
│   └── README.md        # Core 모듈 문서
└── index.tsx            # UI와 비즈니스 로직 연결
```

## 역할

- **타입별 옵션 섹션 렌더링**: 필드 타입(`PropertyType`)에 따라 적절한 옵션 관리 섹션을 렌더링
  - STATUS: 상태 그룹 관리 섹션
  - SELECT/MULTISELECT: 옵션 목록 관리 섹션
  - 기타 타입: null 반환

## 비즈니스 로직

- `OptionManagementProvider`로 감싸져 있어야 함
- 필드 타입만 props로 받아 노코드 툴에서 사용하기 쉬운 인터페이스 제공

## 사용 예시

```tsx
<OptionManagementProvider withGroups={false}>
  <OptionSections type={PropertyType.SELECT} />
</OptionManagementProvider>
```

## 특징

- 필드 타입만 props로 받아 간단한 인터페이스
- 노코드 툴에서 사용하기 좋은 구조
- 타입별로 다른 옵션 관리 UI 제공
- Property Detail Popover와 일관된 프랙탈 구조

## 하위 컴포넌트

- **SelectLikeOption**: SELECT/MULTISELECT 타입의 옵션 관리 UI
- **StatusOption**: STATUS 타입의 상태 그룹 관리 UI
- **OptionItem**: 개별 옵션 아이템 표시 및 편집
- **OptionEditPopover**: 옵션 편집 팝오버

