# Container / Presentational Pattern

View와 Container 분리로 **동일 UI를 다른 곳에서 재사용**하고 **Storybook 등으로 테스트**하기 쉽게 하는 패턴.

---

## 역할

| 역할 | 담당 | 위치 |
|------|------|------|
| **Container** | 로직: 훅으로 데이터·상태 취득, View에 props로 전달 | `index.tsx` |
| **Presentational (View)** | 렌더링만: props만 받음, 훅/API 없음 | `components/*.tsx` |

---

## 규칙

1. **Container**
   - 진입 훅 하나만 사용 (보통 컴포넌트명 훅, e.g. `useMembersTab`).
   - 훅 반환값을 View에 **props로만** 전달.
   - 필요 시 `businessLogic` 주입으로 테스트/Storybook 대체 로직 지원.

2. **View (Presentational)**
   - **Props만** 받음 (데이터 + 콜백).
   - `useQuery`, `useMutation`, server action, 도메인 Context 사용 금지.
   - 동일한 View를 Storybook에서 mock props로 그대로 사용 가능.

3. **테스트·재사용**
   - View는 “같은 UI, 다른 데이터 소스”로 다른 화면에서 재사용 가능.
   - Storybook: 디자이너/개발자가 props만 바꿔가며 상태(로딩, 에러, 빈 목록 등) 검증.

---

## 예시

**Container (index.tsx):**
```tsx
export function MembersTab({ workspaceId, businessLogic }: MembersTabProps) {
  const {
    memberRows,
    isLoadingMembersQuery,
    isInviteDialogOpen,
    refetch,
    setIsInviteDialogOpen,
  } = useMembersTab({ workspaceId }, businessLogic);

  return (
    <>
      <MembersTabContent
        memberRows={memberRows}
        isLoading={isLoadingMembersQuery}
        onInviteClick={() => setIsInviteDialogOpen(true)}
      />
      <InviteDialogWrapper ... />
    </>
  );
}
```

**Presentational (components/members-tab-content.tsx):**
```tsx
interface MembersTabContentProps {
  memberRows: MemberRow[];
  isLoading: boolean;
  onInviteClick: () => void;
}

export function MembersTabContent({
  memberRows,
  isLoading,
  onInviteClick,
}: MembersTabContentProps) {
  return (
    <Box>
      <WorkspaceMemberListTable ... />
    </Box>
  );
}
```

---

## 검사 포인트

- [ ] View 파일에 `useQuery`/`useMutation`/server action import 없음
- [ ] View가 받는 건 props뿐 (Context 소비는 도메인/전역만, 로컬 데이터는 props)
- [ ] Container가 훅 → props 매핑만 하고, 복잡한 로직은 훅 안에 있음
