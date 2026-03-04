---
name: adapter-boundary-design
description: Defines adapter boundaries for view/hooks/contracts and decides correct file placement in apps/web vs shared packages. Use when creating or refactoring adapters, migrating to ssota-blocks/editor-panel, or deciding where runtime deps and UI deps should live.
---

# Adapter Boundary Design

Use this skill to decide **what belongs where** when introducing or refactoring adapters.

## When to Use

- ssota-blocks extraction/migration
- View/Hook abstraction boundary decisions
- Runtime deps injection (Canvas/Drive/Standalone)
- Deciding placement for files like `runtime-deps.ts`, `*-deps.tsx`, adapter hooks

## Core Rule

Always separate into 3 layers:

1. **Contract layer (domain-neutral interface)**
2. **Adapter logic layer (domain/application orchestration)**
3. **Runtime binding layer (Canvas/Drive/Mock wiring)**

Do not mix these in one file.

## Placement Rules

### 1) Contract files

- Purpose: interface/type contract only
- No framework/runtime reads (`useReactFlow`, context, server action calls)
- Should not import heavy domain UI modules

Recommended locations:

- Package-shared contract: `packages/editor-panel/src/tabs/deps-contracts.ts`
- App-only contract: `apps/web/src/domains/<domain>/frontend/adapters/contracts/*`

Example:

- `runtime-deps.ts` is a contract. It should stay near adapter contracts (not in a view folder).

### 2) Adapter logic files

- Purpose: compose hooks/use-cases from contracts
- Can import domain hooks and query logic
- Must receive runtime dependencies via params

Recommended locations:

- `apps/web/src/domains/source-management/frontend/adapters/source-summary/*`
- `apps/web/src/domains/source-management/frontend/adapters/source-timeline/*`
- `apps/web/src/domains/source-management/frontend/adapters/source-markdown/*`

### 3) Runtime binding files

- Purpose: connect concrete runtime implementations (Canvas/Drive/Mock)
- Can touch runtime-specific APIs/context
- Should be thin; mostly mapping/callback injection

Recommended locations:

- Canvas binding: `apps/web/src/domains/block-management/frontend/adapters/*`
- Drive binding: `apps/web/src/domains/drive/frontend/adapters/*`
- Mock/Tutorial binding: corresponding mock/tutorial domain adapter path

## UI Deps Placement Rule

Files like `summary-tab-deps.tsx` (TipTap/editor mapping, markdown conversion, language labels):

- Not a pure source domain contract
- Not reusable in shared package as-is
- Best placed in **app-level UI adapter** area

Recommended:

- `apps/web/src/domains/editor-panel/frontend/adapters/summary-content-deps.ts`
  or
- `apps/web/src/domains/block-management/frontend/adapters/summary-content-deps.ts`

Avoid keeping this under a domain that it does not semantically belong to.

## Naming Rules

- Contract: `*-deps.contract.ts` or `contracts/*`
- Adapter logic: `use-*.ts`
- Runtime binding: `*-canvas-deps.ts`, `*-drive-deps.ts`
- Avoid ambiguous names like `utils.ts` for boundary-critical files

## Quick Checklist

Copy and update during refactor:

```
Task Progress:
- [ ] Contract extracted (interface/type only)
- [ ] Adapter hook receives deps via params
- [ ] Runtime-specific reads moved to binding adapter
- [ ] View remains props-only
- [ ] Canvas/Drive wiring separated
- [ ] Imports from old components layer removed
```

## Decision Workflow

1. Identify dependency type:
   - Interface/type only?
   - Domain orchestration hook?
   - Runtime API/context binding?
2. Map it to layer:
   - Contract / Adapter logic / Runtime binding
3. Place file in matching path by scope:
   - Shared package vs apps/web
4. Verify direction:
   - `Contract <- Adapter logic <- Runtime binding`
   - Reverse import is forbidden
5. Run checks:
   - no context reads in contract/logic (unless explicitly runtime binding)
   - no cross-runtime leakage (Drive importing Canvas-only deps)

## Anti-Patterns

- Contract file importing React Flow or context hooks
- Source domain adapter importing canvas-specific APIs directly
- Runtime binding hidden inside view component
- Shared package importing app domain modules

## Related Skills

- `ssota-blocks-extraction`: extraction workflow and boundary migration
- `ssota-blocks-deps-decision`: package dependency vs deps injection
- `view-component-abstraction`: parameterization/result injection boundary
