# Status Option

STATUS 타입 속성의 상태 그룹 관리 옵션 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있습니다:

```
status-option/
├── components/          # UI 컴포넌트들
│   ├── section-header.tsx        # "Status Options" 라벨
│   ├── status-group/              # 개별 그룹 컴포넌트
│   │   ├── index.tsx              # 그룹 래퍼
│   │   ├── group-header.tsx       # 그룹 라벨 + Plus 버튼 + Popover
│   │   └── group-options-list.tsx # 그룹별 옵션 목록
│   └── empty-state.tsx             # Empty state
├── core/                # 비즈니스 로직
│   ├── use-add-status-option.ts # 새 옵션 추가 로직 관리 (그룹 정보 포함)
│   ├── context.tsx       # Context 정의
│   └── provider.tsx     # Provider 컴포넌트
├── index.tsx             # 메인 컴포넌트 (컴포넌트 조합)
├── types.ts              # 타입 정의
└── README.md
```

## 역할

- **상태 그룹 관리**: 상태를 그룹별로 관리 (Not Started, In Progress, Completed 등)
- **그룹별 옵션 표시**: 각 그룹에 속한 상태 옵션들을 표시
- **옵션 추가**: 각 그룹의 Plus 버튼 클릭 시 즉시 "새 옵션" 생성 및 팝오버 열기
- **기본 그룹 제공**: 기본적으로 3개의 상태 그룹 제공
  - Not Started (gray)
  - In Progress (yellow)
  - Completed (green)

## 비즈니스 로직

`use-add-status-option.ts`에서 수행하는 주요 로직:

1. **옵션 추가 플로우**:
   - 그룹의 Plus 버튼 클릭 시 즉시 `handleCreateOption` 호출 (그룹 ID 포함)
   - DB에 저장 (optimistic update)
   - 저장된 옵션을 받아서 `pendingOption` 설정
   - 해당 그룹의 팝오버 자동 열림
   - 사용자가 팝오버에서 라벨/색상 편집 (자동 저장)

2. **상태 관리**:
   - `isAddPopoverOpen`: 팝오버 열림/닫힘 상태
   - `pendingOption`: 추가 중인 옵션 데이터 (그룹 정보 포함)

3. **그룹별 Popover 관리**:
   - 각 그룹마다 독립적인 Popover 컴포넌트
   - `pendingOption.group`과 현재 그룹 ID를 비교하여 해당 그룹의 Popover만 열림

4. **옵션 관리**:
   - `OptionManagementProvider`를 `withGroups={true}`로 설정하여 사용
   - `defaultGroups`로 기본 상태 그룹 제공
   - 그룹 기능을 활용하여 상태를 그룹별로 관리
   - 옵션 저장 시 그룹 정보는 제거하고 순수 옵션만 저장

## 사용 예시

```tsx
<StatusOption />
```

## 특징

- **직관적인 UX**: Plus 버튼 클릭 시 즉시 새 옵션 생성 및 편집 시작
- **프랙탈 구조**: 작고 집중된 컴포넌트들로 구성
- **단일 책임 원칙**: 각 컴포넌트가 하나의 명확한 책임만 가짐
- **그룹별 관리**: 각 그룹마다 독립적인 Plus 버튼과 Popover
- **일관성**: select-like-option과 동일한 패턴 적용

## 하위 컴포넌트

- **SectionHeader**: "Status Options" 라벨 표시
- **StatusGroup**: 개별 그룹 렌더링
  - **GroupHeader**: 그룹 라벨, Plus 버튼, Popover 및 옵션 추가 관련 모든 로직 포함
    - Popover 상태 관리
    - PopoverTrigger (Plus 버튼)
    - PopoverContent (OptionEditPopover 렌더링, 해당 그룹의 옵션만)
  - **GroupOptionsList**: 그룹별 옵션 목록 렌더링
- **EmptyState**: 옵션이 없을 때 표시
- **Core**: 옵션 추가에 공통으로 사용되는 훅 및 Context

