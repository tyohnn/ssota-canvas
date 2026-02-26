---
name: server-side-ddd-architecture-check
description: Inspects server-side code for compliance with layered DDD architecture (Trust Boundary → Service → Aggregate → Repository). Use when reviewing backend code, checking DDD conventions, verifying layered architecture, or auditing SafeDTO–Command–Event flow against project patterns.
---

# Server-Side DDD Layered Architecture Check

This skill inspects server-side TypeScript/JavaScript code for compliance with the project's layered DDD architecture. Use when the user asks to review backend code, verify DDD conventions, or check layered architecture implementation.

## Before You Begin: Identify Scope

1. **Target files**: Server Actions, internal handlers, Service functions, Aggregates, Repositories
2. **Reference convention**: `docs/patterns/backend/server-side-ddd-conventions.md`

---

## Inspection Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Identify layers and file roles
- [ ] Step 2: Server Action / Trust Boundary
- [ ] Step 3: Internal Function
- [ ] Step 4: Service Layer
- [ ] Step 5: Aggregate Layer
- [ ] Step 6: Repository Layer
- [ ] Step 7: Report violations and recommendations
```

### Step 1: Identify layers and file roles

- Map files to layers: Server Action, Internal Function, Service, Aggregate, Repository
- Confirm data flow: `unknown → SafeDTO → Command → Event → Database`

### Step 2: Server Action (Trust Boundary)

- [ ] Accepts `unknown` as input (never typed DTO before validation)
- [ ] Uses Zod `safeParse` for runtime validation
- [ ] Returns validation errors with `INVALID_REQUEST` code
- [ ] Passes validated data (SafeDTO) to internal function only after success

### Step 2b: Secure Action (when using HOF / preset)

When the project uses **withSecureAction** or preset wrappers (e.g. `withPageSecureAction`):

- [ ] Action is defined via a secure wrapper (no raw `request: unknown` handler)
- [ ] Schema and `actionName` are passed; handler receives `(validatedRequest, context)`
- [ ] Preset matches resource: page → `withPageSecureAction`, workspace → `withWorkspaceSecureAction`, etc.
- [ ] Domain-specific wrapper (e.g. `withSingleEdgeSecureAction`) lives in that domain’s `secure-action.ts` and is used only by that domain’s actions
- [ ] Action file only imports wrapper and defines export (no inline validation/auth); see [reference/actions-folder-structure.md](reference/actions-folder-structure.md)

### Step 3: Internal Function

- [ ] Receives SafeDTO (no `unknown`)
- [ ] Performs auth check (e.g., Supabase Auth)
- [ ] Adds `userId` or auth context to SafeDTO
- [ ] Passes SafeDTO to Service (does **not** create Command)
- [ ] Does **not** create Value Objects or Commands

### Step 4: Service Layer

- [ ] Uses **Service Function** pattern (not Service Class for pass-through)
- [ ] Accepts SafeDTO as first parameter
- [ ] Accepts Repository/ies as parameters (dependency injection)
- [ ] Performs SafeDTO → Command conversion (creates Value Objects)
- [ ] Calls Aggregate with Command (not raw DTO or individual params)
- [ ] Handles Domain Events after Aggregate execution

### Step 5: Aggregate Layer

- [ ] Accepts Command as input (not individual params)
- [ ] Static factory or instance method receives Command
- [ ] Emits Domain Event(s) (1 Command : 1 Event)
- [ ] Uses `addDomainEvent`, `getUncommittedEvents`, `markEventsAsCommitted`
- [ ] Event has `occurredAt` timestamp

### Step 6: Repository Layer

- [ ] Accepts Aggregate/Entity (not SafeDTO or Command)
- [ ] Maps domain objects to DB row format (VO → primitive)
- [ ] Implements interface; implementation injected from outside

---

## Report Format

Use this template when reporting results:

```markdown
# Layered Architecture Check: [Feature/Module Name]

## Summary
- **Status**: ✅ Pass | ⚠️ Partial | ❌ Fail
- **Scope**: [files reviewed]

## By Layer

### Server Action
- [Status] Findings...

### Internal Function
- [Status] Findings...

### Service Layer
- [Status] Findings...

### Aggregate Layer
- [Status] Findings...

### Repository Layer
- [Status] Findings...

## Violations

| Severity | Layer | Issue | Location |
|----------|-------|-------|----------|
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
| Server Action accepts typed DTO | Accept `unknown`, validate with Zod |
| Internal creates Command | Internal passes SafeDTO; Service creates Command |
| Service receives Command | Service receives SafeDTO, creates Command |
| Aggregate receives individual params | Aggregate receives Command |
| State change without Event | Emit Domain Event on state change |
| Service Class (pass-through) | Service Function with Repository params |
| Command with ID for instance method | Omit ID; Aggregate instance holds it |

---

## Additional Resources

- **Full conventions**: [docs/patterns/backend/server-side-ddd-conventions.md](../../../docs/patterns/backend/server-side-ddd-conventions.md) — Trust Boundary, SafeDTO, Command-Event, naming
- **Detailed checklists**: [reference.md](reference.md) — Layer-by-layer criteria, anti-patterns, examples
- **Secure Action**: [reference/secure-action-definition.md](reference/secure-action-definition.md) — HOF/preset 정의, withPageSecureAction, 도메인 전용 wrapper
- **Actions 구조**: [reference/actions-folder-structure.md](reference/actions-folder-structure.md) — 도메인별 actions 폴더, “불러서 함수 정의만” 규칙
