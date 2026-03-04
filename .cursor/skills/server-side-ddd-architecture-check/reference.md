# Server-Side DDD Architecture Check — Reference

Detailed layer-by-layer criteria and anti-patterns for `server-side-ddd-architecture-check` skill. Source: `docs/patterns/backend/server-side-ddd-conventions.md`.

**See also (reference/)**:
- [reference/secure-action-definition.md](reference/secure-action-definition.md) — Secure Action 정의 (withSecureAction, preset, 도메인 전용 wrapper)
- [reference/actions-folder-structure.md](reference/actions-folder-structure.md) — Actions 폴더 도메인별 분리, “불러서 함수 정의만” 규칙

---

## Layer Responsibilities (Quick Reference)

| Layer | Input | Output | Responsibility |
|-------|-------|--------|-----------------|
| **Server Action** | `unknown` | SafeDTO | Trust Boundary: Zod validation |
| **Internal Function** | SafeDTO | SafeDTO + Auth | Auth & permissions |
| **Service** | SafeDTO | Command | SafeDTO → Command (VO creation) |
| **Aggregate** | Command | Event | Business logic + Event emission |
| **Repository** | Aggregate/Entity | DB Row | Persistence |

---

## Server Action Checklist (Trust Boundary)

### ✅ Must have

- [ ] Function parameter type is `unknown` (not `CreateBlockRequest` etc.)
- [ ] Uses `SomeRequestSchema.safeParse(request)` before using data
- [ ] On parse failure: returns error with `code: 'INVALID_REQUEST'`, `meta: { errors: parseResult.error.issues }`
- [ ] On success: passes `parseResult.data` (SafeDTO) to internal function
- [ ] Does **not** pass raw `request` to internal logic

### ❌ Anti-patterns

```typescript
// ❌ Typed param without runtime validation
export async function createBlockAction(request: CreateBlockRequest) { ... }

// ❌ Skipping validation
if (!parseResult.success) return err('Invalid');  // Missing meta.errors

// ✅ Good
export async function createBlockAction(request: unknown) {
  const parseResult = CreateBlockRequestSchema.safeParse(request);
  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }
  return await createBlockInternal(parseResult.data);
}
```

---

## Internal Function Checklist

### ✅ Must have

- [ ] Accepts SafeDTO (typed, validated DTO)
- [ ] Performs auth (e.g., Supabase Auth `getUser()`)
- [ ] Adds auth context (e.g., `userId`) to SafeDTO
- [ ] Calls Service with SafeDTO only
- [ ] Does **not** create Command or Value Objects

### ❌ Anti-patterns

```typescript
// ❌ Internal creates Command
const command: CreateEdgeCommand = {
  pageId: new PageId(safeDto.pageId),
  // ...
};
return await service.createEdge(command);

// ❌ Internal accepts unknown
async function createBlockInternal(request: unknown) { ... }

// ✅ Good
async function createBlockInternal(safeDto: CreateBlockRequest) {
  const user = await getCurrentUser();
  const enrichedDto = { ...safeDto, userId: user.id };
  return await createAndMountBlock(enrichedDto, blockMountRepository);
}
```

---

## Service Layer Checklist

### ✅ Must have

- [ ] **Service Function** (exported async function, not class)
- [ ] First param: SafeDTO
- [ ] Subsequent params: Repository interfaces (injected)
- [ ] Converts SafeDTO → Command (creates Value Objects)
- [ ] Calls Aggregate with Command
- [ ] Handles Domain Events after Aggregate execution
- [ ] Calls `aggregate.markEventsAsCommitted()` after event handling

### ❌ Anti-patterns

```typescript
// ❌ Service Class (pass-through)
export class EdgeService {
  async createEdge(safeDto: CreateEdgeRequest) {
    return createEdge(safeDto, this.repo1, this.repo2);
  }
}

// ❌ Service accepts Command (should accept SafeDTO)
export async function createEdge(
  command: CreateEdgeCommand,
  ...
)

// ❌ Service creates Repository internally (should inject)
const repository = new DrizzleBlockRepository();

// ✅ Good
export async function createEdge(
  safeDto: CreateEdgeRequest,
  blockMountRepository: BlockMountRepository,
  edgeRepository: EdgeRepository
): Promise<Result<EdgeAggregate, Error>> {
  const command: CreateEdgeCommand = {
    pageId: new PageId(safeDto.pageId),
    sourceBlockMountId: new BlockMountId(safeDto.sourceBlockMountId),
    // ...
  };
  const aggregate = EdgeAggregate.createEdge(command);
  await edgeRepository.create(aggregate);
  const events = aggregate.getUncommittedEvents();
  await handleDomainEvents(events);
  aggregate.markEventsAsCommitted();
  return Result.success(aggregate);
}
```

---

## Aggregate Layer Checklist

### ✅ Must have

- [ ] Accepts Command object as input (not individual parameters)
- [ ] Static factory or instance method: `create(command)` or `updatePosition(command)`
- [ ] Emits Domain Event on state change (1 Command : 1 Event)
- [ ] Event includes `occurredAt: Date`
- [ ] Methods: `addDomainEvent`, `getUncommittedEvents`, `markEventsAsCommitted`
- [ ] Instance method Commands: no ID in Command (Aggregate already has it)
- [ ] Static factory Commands: ID included when creating new Aggregate

### ❌ Anti-patterns

```typescript
// ❌ Aggregate receives individual params
static createEdge(edgeId, pageId, sourceId, targetId, shape) { ... }

// ❌ State change without Event
updatePosition(newPosition: Position) {
  this.position = newPosition;
}

// ❌ Instance method Command with redundant ID
interface UpdateBlockContentCommand {
  blockId: BlockId;  // ❌ Aggregate already has blockId
  content: unknown;
}

// ✅ Good
static createEdge(command: CreateEdgeCommand): EdgeAggregate {
  const aggregate = new EdgeAggregate(...);
  aggregate.addDomainEvent(new EdgeCreatedEvent({
    edgeId: aggregate.id.value,
    occurredAt: new Date(),
    // ...
  }));
  return aggregate;
}
```

---

## Repository Layer Checklist

### ✅ Must have

- [ ] Implements Repository interface (not concrete DB client as public API)
- [ ] Accepts Aggregate/Entity or Value Objects for IDs
- [ ] Maps domain objects to DB row format (VO → primitive)
- [ ] No SafeDTO or Command in Repository signatures
- [ ] Injected into Service (or Action) as parameter

### ❌ Anti-patterns

```typescript
// ❌ Repository accepts SafeDTO
async create(safeDto: CreateBlockRequest) { ... }

// ❌ Repository instantiates itself in Service
export async function createBlock(safeDto: CreateBlockRequest) {
  const repo = new DrizzleBlockRepository();  // ❌ Should be injected
}

// ✅ Good
async save(block: Block): Promise<void> {
  const row = {
    id: block.id.value,
    block_type: block.blockType.value,
    // ...
  };
  await this.db.insert(blocks).values(row);
}
```

---

## Naming Conventions (Quick Reference)

| Type | Pattern | Example |
|------|---------|---------|
| Request DTO | `[Action][Domain]Request` | `CreateBlockRequest` |
| Response DTO | Domain meaning (not action) | `BlockMountedDTO` |
| Command | `[Action][Domain]Command` | `CreateAndMountBlockCommand` |
| Event | Past tense | `EdgeCreatedEvent`, `BlockPositionUpdatedEvent` |
| Value Object | `[Concept]` | `PageId`, `Position` |
| Aggregate | `[Domain]Aggregate` | `BlockMountAggregate` |

---

## Command–Event 1:1 Mapping

| Command | Event |
|---------|-------|
| `CreateEdgeCommand` | `EdgeCreatedEvent` |
| `UpdateEdgeShapeCommand` | `EdgeShapeUpdatedEvent` |
| `CreateAndMountBlockCommand` | `BlockMountedEvent` |
| `UpdateBlockPositionCommand` | `BlockPositionUpdatedEvent` |
