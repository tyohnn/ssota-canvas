# Select Like Option

SELECT 및 MULTISELECT 타입 속성의 옵션 관리 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있습니다:

```
select-like-option/
├── components/          # UI 컴포넌트들
│   ├── section-header.tsx    # "Options" 라벨 + 추가 버튼 + Popover (옵션 추가 관련 모든 로직 포함)
│   └── options-list.tsx      # 옵션 목록 렌더링
├── core/                # 비즈니스 로직
│   ├── use-add-option.ts # 새 옵션 추가 로직 관리
│   ├── context.tsx       # Context 정의
│   └── provider.tsx     # Provider 컴포넌트
├── index.tsx             # 메인 컴포넌트 (컴포넌트 조합)
├── types.ts              # 타입 정의
└── README.md
```

## 역할

- **옵션 목록 표시**: SELECT/MULTISELECT 속성의 옵션 목록을 표시
- **옵션 추가**: Plus 버튼 클릭 시 즉시 "새 옵션" 생성 및 팝오버 열기
- **옵션 관리**: 옵션 수정, 삭제, 복제 기능 제공
- **그룹 없는 옵션 관리**: 그룹 기능 없이 단순한 옵션 목록 관리

## 비즈니스 로직

`use-add-option.ts`에서 수행하는 주요 로직:

1. **옵션 추가 플로우**:
   - Plus 버튼 클릭 시 즉시 `pendingOption` 생성 (label: "새 옵션", color: GRAY)
   - 팝오버 자동 열림
   - 사용자가 팝오버에서 라벨/색상 편집 후 색상 선택 시 저장
   - 저장 완료 후 팝오버 닫힘

2. **상태 관리**:
   - `isAddPopoverOpen`: 팝오버 열림/닫힘 상태
   - `pendingOption`: 추가 중인 임시 옵션 데이터

3. **옵션 관리**:
   - `OptionManagementProvider`를 `withGroups={false}`로 설정하여 사용
   - 그룹 기능 없이 옵션을 평면적으로 관리
   - 옵션의 라벨, 색상, 순서 등을 관리

## 사용 예시

```tsx
<SelectLikeOption />
```

## 특징

- **직관적인 UX**: Plus 버튼 클릭 시 즉시 새 옵션 생성 및 편집 시작
- **프랙탈 구조**: 작고 집중된 컴포넌트들로 구성
- **단일 책임 원칙**: 각 컴포넌트가 하나의 명확한 책임만 가짐
- **재사용성**: 작은 컴포넌트들을 다른 곳에서도 사용 가능
- **유지보수성**: 변경 사항이 특정 파일에만 영향

## 하위 컴포넌트

- **SectionHeader**: "Options" 라벨, Plus 버튼, Popover 및 옵션 추가 관련 모든 로직 포함
  - Popover 상태 관리
  - PopoverTrigger (Plus 버튼)
  - PopoverContent (OptionEditPopover 렌더링)
- **OptionsList**: 옵션 목록 렌더링 및 Empty state 처리
- **Core**: 옵션 추가에 공통으로 사용되는 훅 및 Context

