# Hooks & TanStack Query

훅 계층(도메인 훅 / 컴포넌트 UI·비즈니스·오케스트레이션)과 TanStack Query 사용 규칙.

---

## 1. 도메인 훅 (Domain Hooks)

**위치**: `domains/{domain}/frontend/hooks/`

- **역할**: 서버 액션을 TanStack Query로 래핑해 재사용 가능한 API 제공.
- **규칙**:
  - 서버 액션마다 대응하는 훅을 두는 것을 원칙으로 (e.g. `createWorkspaceAction` → `useCreateWorkspace`).
  - 읽기: `useQuery` (queryKey, queryFn에서 action 호출), `staleTime` 등 설정.
  - 쓰기: `useMutation` (mutationFn에서 action 호출), 필요 시 Optimistic Update (`onMutate` / `onError` 롤백).
- **반환**: `{ data, isLoading, error, refetch }` 또는 `{ mutate, mutateAsync, isPending }` 형태.

**예 (조회):**
```ts
// domains/workspace-management/frontend/hooks/use-get-all-workspaces-by-org.ts
export function useGetAllWorkspacesByOrg(enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-workspaces-by-org'],
    queryFn: async () => { /* validate + getAllWorkspacesByOrgAction */ },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  return { data, isLoading, isError: !!error, error, refetch };
}
```

**예 (쓰기 + Optimistic):**
```ts
// useMutation, onMutate에서 낙관적 업데이트, onError에서 롤백
const mutation = useMutation({
  mutationFn: (values) => createWorkspaceAction(values),
  onMutate: async (values) => { /* backup & optimistic update */ },
  onError: (err, variables, context) => { /* rollback from context */ },
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workspaces'] }); },
});
return { createWorkspace: mutation.mutateAsync, isCreating: mutation.isPending };
```

---

## 2. 컴포넌트 훅 (Component-Local)

**위치**: 해당 컴포넌트의 `core/`

| 파일 | 역할 | 허용 | 금지 |
|------|------|------|------|
| `use-*.ui.ts` | UI 상태·계산 | useState, useReducer, form state | 서버 액션, useQuery, useMutation |
| `use-*.business.ts` | 컴포넌트 특화 비즈니스 | 도메인 훅만 사용 | 직접 server action, raw useQuery/useMutation |
| `use-*.ts` (메인) | 오케스트레이션 | 외부 훅 호출, 의존성 묶어서 UI/비즈니스 훅에 주입, 반환값 하나로 합침 | 비즈니스 로직 직접 구현 (가능한 한 UI/business에 위임) |

- **의존성 주입**: 메인 훅에서만 React Flow·auth 등 외부 훅 호출; `FlowDependencies` / `DomainDependencies` 등으로 묶어서 하위 훅에 전달 (object-based dependency injection).
- **비즈니스 주입**: `businessLogic?: XxxBusinessLogic` 으로 테스트/Storybook용 대체 로직 주입 가능.

---

## 3. TanStack Query 사용 규칙

- **서버 상태(조회/캐시)**: 도메인 훅에서 `useQuery` 사용. 컴포넌트는 해당 도메인 훅만 사용.
- **서버 상태(변경)**: 도메인 훅에서 `useMutation` 사용. 복잡한 낙관적 업데이트는 `onMutate`/`onError`로 처리.
- **금지**: Presentational 또는 `use-*.ui.ts`에서 `useQuery`/`useMutation`/server action 직접 호출.
- **선택**: 로컬 UI만 있는 단순 폼 등은 TanStack Query 없이 도메인 훅만으로도 가능 (가이드라인 “도메인 훅 불필요” 케이스 참고).

---

## 검사 포인트

- [ ] 서버 액션 호출이 도메인 훅 밖에 없음 (컴포넌트/비즈니스 훅은 도메인 훅만 호출)
- [ ] `use-*.ui.ts`에 useQuery/useMutation/action 없음
- [ ] `use-*.business.ts`에 직접 action 호출 없음
- [ ] 메인 훅이 외부 의존성 수집 후 하위 훅에 주입하는 구조인지
