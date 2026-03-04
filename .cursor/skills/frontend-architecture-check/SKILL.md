---
name: frontend-architecture-check
description: Inspects frontend React code for compliance with Container/Presentational pattern, hook layering (domain hooks + UI/business/orchestration), and TanStack Query usage. Use when reviewing frontend components, checking hook architecture, verifying View/Container separation, or auditing reusability and testability against project guidelines.
---

# Frontend Architecture Check

This skill inspects frontend React/TypeScript code for compliance with the project's component and hook architecture. Use when the user asks to review frontend code, verify Container/Presentational separation, check hook layers, or ensure TanStack Query and reusability patterns.

## Before You Begin: Identify Scope

1. **Target**: Components (Container/View), hooks (domain + component-local), domain hooks wrapping server actions
2. **Reference**: `docs/patterns/frontend/component-development-guidelines.md`

---

## Inspection Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Identify component and hook roles
- [ ] Step 2: Container / Presentational separation
- [ ] Step 3: Hook layers (domain vs component)
- [ ] Step 4: TanStack Query usage
- [ ] Step 5: Folder structure
- [ ] Step 6: Report violations and recommendations
```

### Step 1: Identify component and hook roles

- Map each file: Container (index), Presentational (components/), domain hook (domains/…/frontend/hooks/), component hook (core/ use-*.ui.ts, use-*.business.ts, use-*.ts)

### Step 2: Container / Presentational separation

- [ ] Container (index.tsx) uses a single orchestration hook (usually named after the component, e.g. `useMembersTab`)
- [ ] Container passes only **props** (plain values/callbacks) to View; no Context or hooks inside View
- [ ] Presentational components receive **props only**; no `useQuery`, `useMutation`, or server action calls
- [ ] Same View can be reused with different data (Storybook, other screens)

### Step 3: Hook layers

- [ ] **Domain hooks** (`domains/{domain}/frontend/hooks/`): one hook per server action; use TanStack Query (`useQuery`/`useMutation`) where server state is involved
- [ ] **Component UI hook** (`use-*.ui.ts`): local UI state only (useState, form state); no server actions or domain API calls
- [ ] **Component business hook** (`use-*.business.ts`): composes domain hooks; no direct server action calls (use domain hooks)
- [ ] **Orchestration hook** (`use-*.ts`, component-named): gathers dependencies (framework/domain); injects into UI and business hooks; returns single value for Container

### Step 4: TanStack Query

- [ ] Server action calls that affect shared/cacheable data are wrapped in domain hooks using `useQuery` or `useMutation`
- [ ] Optimistic updates use `useMutation` with `onMutate` / `onError` (rollback) where applicable
- [ ] No direct `createXxxAction()` inside Presentational or inside `.ui.ts`; only inside domain hooks or `.business.ts` via domain hooks

### Step 5: Folder structure

- [ ] Component: `index.tsx` (Container), `components/` (Presentational), `core/` (hooks, types, context if any)
- [ ] Domain hooks live under `domains/{domain}/frontend/hooks/` (e.g. `use-create-workspace.ts`)

---

## Report Format

Use this template when reporting results:

```markdown
# Frontend Architecture Check: [Feature/Component Name]

## Summary
- **Status**: ✅ Pass | ⚠️ Partial | ❌ Fail
- **Scope**: [files reviewed]

## Container/Presentational
- [Status] Findings...

## Hook Layers
- [Status] Findings...

## TanStack Query
- [Status] Findings...

## Folder Structure
- [Status] Findings...

## Violations

| Severity | Area | Issue | Location |
|----------|------|-------|----------|
| 🔴 Critical | ... | ... | ... |
| 🟡 Suggestion | ... | ... | ... |

## Recommendations
1. ...
2. ...
```

---

## Anti-Patterns to Flag

| Anti-pattern | Correct pattern |
|--------------|-----------------|
| View uses hooks (useQuery, server action) | View receives props only; Container/hook holds logic |
| Component calls server action directly | Wrap in domain hook; component uses domain hook |
| Business hook calls server action directly | Business hook uses domain hooks only |
| UI hook calls API or mutation | UI hook: local state only |
| Single monolithic hook (UI + business + deps) | Split: use-*.ui.ts, use-*.business.ts, use-*.ts (orchestration) |
| No domain hook for shared server action | Add domain hook per server action (TanStack Query where appropriate) |
| Render props / function props for layout | Compound components or props (values); Storybook-friendly |

---

## Additional Resources

- **Full guidelines**: [docs/patterns/frontend/component-development-guidelines.md](../../../docs/patterns/frontend/component-development-guidelines.md)
- **Layer checklists**: [reference.md](reference.md)
- **Container/Presentational**: [reference/container-presentational.md](reference/container-presentational.md)
- **Hooks & TanStack Query**: [reference/hooks-and-tanstack-query.md](reference/hooks-and-tanstack-query.md)
- **Folder structure**: [reference/folder-structure.md](reference/folder-structure.md)
- **Dependency injection**: [docs/patterns/frontend/object-based-dependency-injection.md](../../../docs/patterns/frontend/object-based-dependency-injection.md)
- **Type layering**: [docs/patterns/frontend/dependency-based-type-layering.md](../../../docs/patterns/frontend/dependency-based-type-layering.md)
