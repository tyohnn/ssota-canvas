# Frontend Architecture Check — Reference

Layer-by-layer criteria and anti-patterns for `frontend-architecture-check`. Source: `docs/patterns/frontend/component-development-guidelines.md`.

---

## Quick Reference: Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Container** | `index.tsx` | One orchestration hook; pass props to View only |
| **Presentational (View)** | `components/*.tsx` | Props only; no hooks, no server calls |
| **Domain hook** | `domains/{domain}/frontend/hooks/` | One per server action; TanStack Query (useQuery/useMutation) |
| **Component UI hook** | `core/use-*.ui.ts` | Local UI state only |
| **Component business hook** | `core/use-*.business.ts` | Compose domain hooks; no direct server action |
| **Orchestration hook** | `core/use-*.ts` | Gather deps; inject into UI/business; return value for Container |

---

## Container Checklist

- [ ] Single entry hook (e.g. `useMembersTab`) used in index
- [ ] Hook result passed as props to View(s); no inline logic in JSX beyond mapping hook → props
- [ ] Optional `businessLogic` injection supported for tests/Storybook
- [ ] No direct server action or useQuery/useMutation in index

---

## Presentational (View) Checklist

- [ ] Receives only props (data + callbacks)
- [ ] No `useQuery`, `useMutation`, server action, or domain-specific Context
- [ ] Same component renderable in Storybook with mock props
- [ ] Controlled/Semi-Controlled/Uncontrolled via props only

---

## Domain Hook Checklist

- [ ] Lives under `domains/{domain}/frontend/hooks/`
- [ ] Wraps one (or a cohesive set of) server action(s)
- [ ] Uses `useQuery` for reads / `useMutation` for writes when state is shared or cacheable
- [ ] Returns `{ data, isLoading, error, refetch }` or `{ mutate, isPending }`-style API
- [ ] No component-specific UI state (that stays in component `.ui.ts`)

---

## Component Hook Checklist

- [ ] **UI** (`.ui.ts`): `useState`, `useReducer`, form state; no API/domain hooks
- [ ] **Business** (`.business.ts`): uses domain hooks only; no `createXxxAction()` or raw `useQuery`/`useMutation`
- [ ] **Orchestration** (`use-*.ts`): calls external hooks (React Flow, auth, etc.); bundles deps; injects into UI + business; returns one object for Container
- [ ] Business logic can be injected (e.g. `businessLogic?: XxxBusinessLogic`) for testing

---

## TanStack Query Checklist

- [ ] Server-backed reads: `useQuery` in domain hook with stable `queryKey`
- [ ] Server-backed writes: `useMutation` in domain hook; optimistic updates use `onMutate` + `onError` rollback
- [ ] Component uses domain hook’s `refetch`/`mutate`, not raw action

---

## Folder Structure Checklist

- [ ] Component: `index.tsx`, `components/`, `core/` (hooks, types, context)
- [ ] Domain hooks: `domains/{domain}/frontend/hooks/use-*.ts`
- [ ] Fractal: subcomponents can repeat `components/` + `core/` when complex

---

## Anti-Patterns Summary

| Avoid | Prefer |
|-------|--------|
| View with useQuery/useMutation/actions | View with props only |
| Direct server action in component/hook | Domain hook → component hook → Container |
| Single huge hook | UI + business + orchestration split |
| Render props / many function props for layout | Compound components or value props (Storybook-friendly) |
| Global Context for local state | Props or local Context scoped to feature |

---

**See also (reference/):**
- [reference/container-presentational.md](reference/container-presentational.md)
- [reference/hooks-and-tanstack-query.md](reference/hooks-and-tanstack-query.md)
- [reference/folder-structure.md](reference/folder-structure.md)
