# 데이터 흐름 코드 컨벤션 가이드

**작성일**: 2025-11-03  
**버전**: v1.0

## 🎯 개요

이 문서는 **클라이언트(React Hook)부터 서버(Action → Service → Aggregate → Repository)까지**의 전체 데이터 흐름을 정의하는 코드 컨벤션 가이드입니다.

**핵심 원칙**: 각 레이어가 자신의 책임만 담당하고, 데이터 변환과 검증을 체계적으로 처리합니다.

---

## 📊 전체 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React Hook (Frontend Hook)                                      │
│  ├── Optimistic UI Update                                        │
│  ├── 1차 Request 검증 (Zod Schema)                                │
│  └── Server Action 호출                                           │
│       ↓                                                           │
└─────────────────────────────────────────────────────────────────┘
                            HTTP Request
                            (Trust Boundary)
┌─────────────────────────────────────────────────────────────────┐
│                      Server Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Server Action ('use server')                                     │
│  ├── 2차 Request 검증 (Zod Schema)                                │
│  ├── 권한 검증 (Authentication + Authorization)                   │
│  ├── Service 호출 (params 전달)                                   │
│  └── DTO 변환하여 반환                                            │
│       ↓                                                           │
│  Service (Application Service)                                   │
│  ├── Business Logic                                              │
│  ├── Aggregate 호출 (Command 전달)                                │
│  ├── 이벤트 처리 (handleDomainEvents)                             │
│  └── Aggregate 반환                                              │
│       ↓                                                           │
│  Aggregate (Domain Aggregate)                                    │
│  ├── Command 처리                                                 │
│  ├── 비즈니스 규칙 검증                                           │
│  ├── Entity 상태 변경                                             │
│  └── 이벤트 생성 (getUncommittedEvents)                          │
│       ↓                                                           │
│  Repository (Infrastructure)                                      │
│  ├── Aggregate 조회/저장                                         │
│  └── Aggregate 반환                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 레이어별 상세 규칙

### 1. React Hook 레이어 (Client)

#### 1.1 핵심 원칙

**✅ 규칙**: Hook은 **항상 Optimistic Update**로 구현하고, **여러 개의 작은 함수로 분리**합니다.

#### 1.2 구조 패턴

```typescript
/**
 * Hook 구현 예시: Block Property Update
 */
export function useBlockPropertyUpdate(): UseBlockPropertyUpdateResult {
  const { updateNode } = useReactFlow();

  // ✅ 여러 개의 함수로 분리
  const updateNestedProperty = useCallback(
    <T>(data: BlockNodeData, propertyPath: string, value: T) => {
      // 중첩 객체 경로 처리
      const updatedData = { ...data };
      const pathParts = propertyPath.split('.');
      // ... 구현
      return updatedData;
    },
    []
  );

  const validateRequest = useCallback(
    (blockId: string, propertyPath: string, value: any, blockData: BlockNodeData) => {
      // 1차 Request 검증 (Zod Schema)
      const rawRequest: UpdateBlockPropertyRequestInput = {
        blockId: blockData.blockId,
        propertyPath,
        value,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const parseResult = UpdateBlockPropertyRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        return null; // 검증 실패
      }
      return parseResult.data; // ✅ 검증된 데이터
    },
    []
  );

  const updateProperty = useCallback(
    async <T>(
      blockId: string,
      propertyPath: string,
      value: T,
      blockData: BlockNodeData
    ): Promise<void> => {
      // 1. 원본 데이터 백업 (롤백용)
      const originalData = blockData;

      // 2. Optimistic Update: React Flow Store 즉시 업데이트
      const updatedData = updateNestedProperty<T>(blockData, propertyPath, value);
      updateNode(blockId, { data: updatedData });

      try {
        // 3. 1차 Request 검증
        const validatedRequest = validateRequest(blockId, propertyPath, value, blockData);
        if (!validatedRequest) {
          updateNode(blockId, { data: originalData }); // 롤백
          return;
        }

        // 4. Server Action 호출 (검증된 데이터)
        const result = await updateBlockPropertyAction(validatedRequest);

        if (isFailure(result)) {
          // 실패 시 롤백
          updateNode(blockId, { data: originalData });
          console.error('Failed to update block property:', result.error);
        }
      } catch (error) {
        // 에러 시 롤백
        updateNode(blockId, { data: originalData });
        console.error('Error updating block property:', error);
      }
    },
    [updateNode, updateNestedProperty, validateRequest]
  );

  return { updateProperty };
}
```

#### 1.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **Optimistic Update 필수** | 서버 응답 전에 UI를 먼저 업데이트 | `updateNode(blockId, { data: updatedData })` |
| **함수 분리** | 단일 책임 원칙에 따라 작은 함수로 분리 | `validateRequest`, `updateNestedProperty`, `updateProperty` |
| **1차 검증** | Hook에서 Zod Schema로 검증 | `UpdateBlockPropertyRequestSchema.safeParse()` |
| **롤백 처리** | 실패 시 원본 데이터로 복원 | `updateNode(blockId, { data: originalData })` |

---

### 2. Server Action 레이어 (Trust Boundary)

#### 2.1 핵심 원칙

**✅ 규칙**: Server Action은 **클라이언트를 절대 신뢰하지 않습니다**. 모든 입력을 `unknown`으로 받고 **강력한 검증**을 수행합니다.

#### 2.2 구조 패턴

```typescript
/**
 * Server Action 구현 예시: Block Property Update
 */
export async function updateBlockPropertyAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  // 1. 2차 Runtime Validation (필수)
  const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to updateBlockPropertyAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: UpdateBlockPropertyRequest

  // 3. 인증 확인 (Supabase Auth)
  try {
    const user = await getAuthenticatedUser();

    // 4. 권한 검증 (조직 & 워크스페이스 접근 권한)
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 5. 검증 완료 - Internal 함수 호출
    return await updateBlockPropertyInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateBlockPropertyAction] Authentication error:', error);
    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'UNAUTHORIZED' }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 */
async function updateBlockPropertyInternal(
  request: UpdateBlockPropertyRequest, // ✅ 이미 검증됨
  user: AuthenticatedUser // ✅ 이미 인증됨
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  try {
    // ✅ Service 인스턴스 생성 (Repository는 Service 내부에서 주입)
    const repository = new DrizzleBlockRepository();
    const blockPropertyService = new BlockPropertyService(repository);

    // ✅ BlockId Value Object 생성 (타입 안전 - 이미 검증됨)
    const blockId = new BlockId(request.blockId);

    // ✅ Service 호출 (params 사용)
    const command: UpdateBlockPropertyCommand = {
      blockId,
      propertyPath: request.propertyPath,
      value: request.value,
      workspaceId: request.workspaceId,
    };

    const updateResult = await blockPropertyService.updateProperty(command);

    // ✅ Response DTO 생성
    const responseData: BlockPropertyUpdatedDTO = {
      blockId: request.blockId,
      propertyPath: request.propertyPath,
      value: request.value,
      updatedAt: updateResult.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockPropertyAction] Internal error:', error);
    return err(
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}
```

#### 2.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **`unknown` 타입 사용** | 모든 외부 입력은 `unknown`으로 받음 | `request: unknown` |
| **2차 검증 필수** | Zod Schema로 런타임 검증 | `UpdateBlockPropertyRequestSchema.safeParse()` |
| **권한 검증** | 인증 + 조직/워크스페이스 접근 권한 확인 | `verifyAccess(orgId, workspaceId, userId)` |
| **Repository 노출 금지** | Service를 통해서만 데이터 접근 | `new BlockPropertyService(repository)` |
| **DTO 반환** | Aggregate를 DTO로 변환하여 반환 | `BlockPropertyUpdatedDTO` |

---

### 3. Service 레이어 (Application Logic)

#### 3.1 핵심 원칙

**✅ 규칙**: Service는 **params를 받아서 Aggregate에 Command를 전달**하고, **이벤트 처리**를 담당합니다.

#### 3.2 구조 패턴

```typescript
/**
 * Service 구현 예시: Block Management Service
 */
export class BlockManagementService {
  constructor(private readonly blockRepository: BlockRepository) {}

  /**
   * 블록 생성
   *
   * @param params - 블록 생성 파라미터 (Action에서 전달)
   * @returns 생성된 블록 Aggregate
   */
  async createBlock(params: {
    userId: UserId;
    workspaceId: WorkspaceId;
    blockType: BlockType;
    title: string;
  }): Promise<BlockAggregate> {
    try {
      // 1. Command 생성 (Service → Aggregate)
      const createBlockCommand: CreateBlockCommand = {
        userId: params.userId,
        workspaceId: params.workspaceId,
        blockId: BlockId.generate(),
        blockType: params.blockType,
        title: params.title,
      };

      // 2. Aggregate 생성 및 Command 처리
      const aggregate = BlockAggregate.create(createBlockCommand);

      // 3. Repository 저장
      await this.blockRepository.create(aggregate.getBlock());

      // 4. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 6. Aggregate 반환
      return aggregate;
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_CREATION_FAILED',
        `Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 도메인 이벤트 처리 (비동기 병렬 처리)
   *
   * @param events - 처리할 도메인 이벤트 목록
   */
  private async handleDomainEvents(events: Array<any>): Promise<void> {
    const results = await Promise.allSettled(
      events
        .filter(event => this.isBlockManagementEvent(event))
        .map(async event => {
          if (event instanceof BlockCreatedEvent) {
            return await this.handleBlockCreated(event);
          } else if (event instanceof BlockUpdatedEvent) {
            return await this.handleBlockUpdated(event);
          }
          // ...
        })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[BlockManagementService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * Policy: 블럭이 생성되었을 때
   */
  private async handleBlockCreated(event: BlockCreatedEvent): Promise<void> {
    console.log('[Block Management] Block Created:', {
      type: event.type,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 블럭 생성 통계 업데이트
    // - 생성자별 활동 추적
    // - 워크스페이스별 블럭 수 증가
  }
}
```

#### 3.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **params 사용** | Action에서 Service 호출 시 params 전달 | `createBlock(params: { ... })` |
| **Command 패턴** | Service에서 Aggregate 호출 시 Command 사용 | `CreateBlockCommand` |
| **이벤트 처리** | Aggregate 작업 후 이벤트 처리 및 커밋 | `handleDomainEvents()` → `markEventsAsCommitted()` |
| **Repository 주입** | 생성자에서 Repository 주입 | `constructor(private readonly blockRepository: BlockRepository)` |

---

### 4. Aggregate 레이어 (Domain Logic)

#### 4.1 핵심 원칙

**✅ 규칙**: Aggregate는 **Command를 받아서 처리**하고, **이벤트를 생성**합니다. 이벤트는 `getUncommittedEvents()`로 조회하고, `markEventsAsCommitted()`로 커밋합니다.

#### 4.2 구조 패턴

```typescript
/**
 * Aggregate 구현 예시: Block Aggregate
 */
type BlockManagementEvents =
  | BlockCreatedEvent
  | BlockUpdatedEvent
  | BlockDeletedEvent
  | BlockDuplicatedEvent;

export class BlockAggregate {
  private _block: Block;
  private _uncommittedEvents: Array<BlockManagementEvents> = [];

  private constructor(block: Block) {
    this._block = block;
  }

  /**
   * 새로운 BlockAggregate 생성
   *
   * @param command - CreateBlockCommand (Service에서 전달)
   */
  static create(command: CreateBlockCommand): BlockAggregate {
    const block = Block.create(
      command.blockId,
      command.workspaceId,
      command.userId,
      command.blockType,
      command.title
    );

    const aggregate = new BlockAggregate(block);

    // 도메인 이벤트 발생
    const event = new BlockCreatedEvent(
      block.id,
      {
        blockId: block.id.value,
        blockType: block.blockType.value,
        title: block.title,
        properties: block.properties.toJSON(),
        customProperties: block.customProperties.map(cp => cp.toJSON()),
        workspaceId: block.workspaceId.value,
        userId: block.userId.value,
      },
      block.createdAt // ✅ occurredAt은 생성자 파라미터로 전달
    );

    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * 블록 업데이트
   *
   * @param command - UpdateBlockCommand (Service에서 전달)
   */
  update(command: UpdateBlockCommand): void {
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update deleted block'
      );
    }

    // 속성 업데이트
    if (command.updateData.title !== undefined) {
      this._block.update({ title: command.updateData.title });
    }

    // 도메인 이벤트 발생
    const event = new BlockUpdatedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        updateData: command.updateData,
      },
      this._block.updatedAt
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 커밋되지 않은 이벤트들 반환
   */
  getUncommittedEvents(): Array<BlockManagementEvents> {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트 커밋 (이벤트 스토어에 저장 후 호출)
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * 현재 블록 상태 반환
   */
  getBlock(): Block {
    return this._block;
  }
}
```

#### 4.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **Command 패턴** | Service에서 Command를 받아 처리 | `update(command: UpdateBlockCommand)` |
| **이벤트 생성** | 작업 수행 시 이벤트 생성 | `new BlockCreatedEvent(...)` |
| **이벤트 조회** | `getUncommittedEvents()`로 이벤트 반환 | `aggregate.getUncommittedEvents()` |
| **이벤트 커밋** | 처리 후 `markEventsAsCommitted()` 호출 | `aggregate.markEventsAsCommitted()` |
| **occurredAt 분리** | 이벤트의 `occurredAt`은 data 밖으로 분리 | `new BlockCreatedEvent(aggregateId, data, occurredAt)` |

---

### 5. Repository 레이어 (Infrastructure)

#### 5.1 핵심 원칙

**✅ 규칙**: Repository는 **항상 Aggregate를 반환**합니다. Aggregate가 서버 레이어의 기본 "택배 상자" 역할을 합니다.

#### 5.2 구조 패턴

```typescript
/**
 * Repository 인터페이스 예시
 */
export interface BlockRepository {
  /**
   * 블록 ID로 조회
   *
   * @param id - 블록 ID
   * @returns Block Entity (Aggregate 재구성용)
   */
  findById(id: BlockId): Promise<Block | null>;

  /**
   * 블록 생성
   *
   * @param block - Block Entity
   */
  create(block: Block): Promise<void>;

  /**
   * 블록 업데이트
   *
   * @param block - Block Entity
   */
  update(block: Block): Promise<void>;
}

/**
 * Repository 구현 예시: Drizzle Block Repository
 */
export class DrizzleBlockRepository implements BlockRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: BlockId): Promise<Block | null> {
    const row = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.id, id.value))
      .limit(1);

    if (row.length === 0) {
      return null;
    }

    // ✅ Entity로 변환 (Aggregate 재구성용)
    return Block.fromPersistence(row[0]);
  }

  async create(block: Block): Promise<void> {
    const persistenceData = block.toPersistence();

    await this.db.insert(blocks).values({
      id: persistenceData.id,
      workspace_id: persistenceData.workspaceId,
      block_type: persistenceData.blockType,
      title: persistenceData.title,
      // ...
    });
  }

  async update(block: Block): Promise<void> {
    const persistenceData = block.toPersistence();

    await this.db
      .update(blocks)
      .set({
        title: persistenceData.title,
        properties: persistenceData.properties,
        updated_at: new Date(),
      })
      .where(eq(blocks.id, persistenceData.id));
  }
}
```

#### 5.3 Service에서 Repository 사용 패턴

```typescript
/**
 * Service에서 Repository 사용 예시
 */
export class BlockManagementService {
  constructor(private readonly blockRepository: BlockRepository) {}

  async getBlock(blockId: BlockId): Promise<BlockAggregate> {
    // ✅ Repository에서 Entity 조회
    const block = await this.blockRepository.findById(blockId);

    if (!block) {
      throw new BlockManagementError(
        'BLOCK_NOT_FOUND',
        `Block with ID ${blockId.value} not found`
      );
    }

    // ✅ Entity로 Aggregate 재구성
    return BlockAggregate.reconstitute(block);
  }

  async createBlock(params: { ... }): Promise<BlockAggregate> {
    // 1. Aggregate 생성 (Command 패턴)
    const aggregate = BlockAggregate.create(createBlockCommand);

    // 2. Repository에 Entity 저장
    await this.blockRepository.create(aggregate.getBlock());

    // 3. 이벤트 처리
    // ...

    // 4. Aggregate 반환
    return aggregate;
  }
}
```

#### 5.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **Aggregate 반환** | Repository는 Entity를 반환하여 Aggregate 재구성 | `BlockAggregate.reconstitute(block)` |
| **Entity 저장** | Aggregate에서 Entity를 추출하여 저장 | `aggregate.getBlock()` |
| **Repository 인터페이스** | 도메인 레이어에 인터페이스 정의 | `interface BlockRepository` |
| **구현 분리** | Infrastructure 레이어에서 구현 | `DrizzleBlockRepository` |

---

### 6. DTO 변환 레이어

#### 6.1 핵심 원칙

**✅ 규칙**: Server Action과 Client 사이에서는 **DTO(Data Transfer Object)로 변환**합니다. Aggregate는 서버 내부에서만 사용하고, 외부로는 노출하지 않습니다.

#### 6.2 구조 패턴

```typescript
/**
 * DTO 정의 예시
 */
export interface BlockPropertyUpdatedDTO {
  blockId: string;
  propertyPath: string;
  value: any;
  updatedAt: Date;
}

/**
 * Server Action에서 DTO 변환 예시
 */
async function updateBlockPropertyInternal(
  request: UpdateBlockPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  try {
    const repository = new DrizzleBlockRepository();
    const blockPropertyService = new BlockPropertyService(repository);

    const blockId = new BlockId(request.blockId);
    const command: UpdateBlockPropertyCommand = {
      blockId,
      propertyPath: request.propertyPath,
      value: request.value,
      workspaceId: request.workspaceId,
    };

    // ✅ Service 호출 (Aggregate 반환)
    const updateResult = await blockPropertyService.updateProperty(command);

    // ✅ DTO 변환 (Aggregate → DTO)
    const responseData: BlockPropertyUpdatedDTO = {
      blockId: request.blockId,
      propertyPath: request.propertyPath,
      value: request.value,
      updatedAt: updateResult.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    // ...
  }
}
```

#### 6.3 규칙 요약

| 규칙 | 설명 | 예시 |
|------|------|------|
| **DTO 변환** | Aggregate를 DTO로 변환하여 반환 | `BlockPropertyUpdatedDTO` |
| **Aggregate 비노출** | Aggregate는 서버 내부에서만 사용 | Service에서 Aggregate 반환, Action에서 DTO 변환 |

---

## 📋 전체 규칙 체크리스트

### ✅ Hook 레이어
- [ ] Optimistic Update 구현
- [ ] 여러 개의 작은 함수로 분리
- [ ] 1차 Request 검증 (Zod Schema)
- [ ] 롤백 처리 구현

### ✅ Server Action 레이어
- [ ] `unknown` 타입으로 외부 입력 받기
- [ ] 2차 Request 검증 (Zod Schema)
- [ ] 권한 검증 (인증 + 접근 권한)
- [ ] Repository 직접 사용 금지 (Service만 사용)
- [ ] Service 호출 시 params 사용
- [ ] DTO로 변환하여 반환

### ✅ Service 레이어
- [ ] Action에서 params 받기
- [ ] Aggregate에 Command 전달
- [ ] 이벤트 처리 (`handleDomainEvents`)
- [ ] 이벤트 커밋 (`markEventsAsCommitted`)
- [ ] Aggregate 반환

### ✅ Aggregate 레이어
- [ ] Command 패턴으로 작업 처리
- [ ] 이벤트 생성 (`_uncommittedEvents`)
- [ ] `getUncommittedEvents()` 메서드 제공
- [ ] `markEventsAsCommitted()` 메서드 제공
- [ ] `occurredAt`은 data 밖으로 분리

### ✅ Repository 레이어
- [ ] Entity 조회/저장
- [ ] Aggregate 재구성용 Entity 반환
- [ ] 인터페이스는 도메인 레이어에 정의
- [ ] 구현은 Infrastructure 레이어에 분리

---

## 🔍 실제 코드 예시: Edge 생성 플로우

### 1. Hook 레이어

```typescript
// use-canvas-edge-management.ts
export function useCanvasEdgeManagement(params: {
  pageId: string;
  orgId: string;
  workspaceId: string;
}) {
  const { addEdges } = useReactFlow();

  const createEdge = useCallback(
    async (
      sourceBlockMountId: string,
      targetBlockMountId: string,
      edgeShape: string = 'default',
      sourceHandle?: string,
      targetHandle?: string
    ) => {
      // 1. 1차 Request 검증
      const rawRequest: CreateEdgeRequestInput = {
        pageId: params.pageId,
        sourceBlockMountId,
        targetBlockMountId,
        edgeShape,
        sourceHandle,
        targetHandle,
        workspaceId: params.workspaceId,
        orgId: params.orgId,
      };

      const parseResult = CreateEdgeRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        console.error('[Frontend Validation] Invalid edge creation data');
        return;
      }

      // 2. Optimistic Update (선택적)
      // Edge는 생성 즉시 서버 동기화가 필요할 수 있으므로 선택적

      // 3. Server Action 호출
      const result = await createEdgeAction(parseResult.data);
      
      if (result.success && result.data) {
        // 4. React Flow에 엣지 추가
        addEdges([{
          id: result.data.edgeId,
          source: sourceBlockMountId,
          target: targetBlockMountId,
          sourceHandle,
          targetHandle,
          type: 'default',
          data: result.data,
        }]);
      }
    },
    [params, addEdges]
  );

  return { createEdge };
}
```

### 2. Server Action 레이어

```typescript
// edge.actions.ts
export async function createEdgeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<EdgeView>> {
  // 1. 2차 Runtime Validation
  const parseResult = CreateEdgeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 확인
  try {
    const authenticatedUser = await getAuthenticatedUser();

    // 3. 권한 검증
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      authenticatedUser.id
    );

    if (!accessResult.success) {
      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // 4. Internal 함수 호출
    return await createEdgeInternal(
      validatedRequest,
      authenticatedUser,
      accessResult.workspace!
    );
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      { code: 'UNAUTHORIZED' }
    );
  }
}

async function createEdgeInternal(
  request: CreateEdgeRequest,
  authenticatedUser: AuthenticatedUser,
  workspace: Workspace
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Value Objects 생성
    const pageIdVO = new PageId(request.pageId);
    const sourceBlockMountIdVO = new BlockMountId(request.sourceBlockMountId);
    const targetBlockMountIdVO = new BlockMountId(request.targetBlockMountId);
    const edgeShapeVO = request.edgeShape
      ? new EdgeShape(request.edgeShape)
      : undefined;

    // 2. Service 인스턴스 생성
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepository,
      edgeRepository
    );

    // 3. Service 호출 (params 사용)
    const result = await canvasEdgeService.createEdge({
      pageId: pageIdVO,
      sourceBlockMountId: sourceBlockMountIdVO,
      targetBlockMountId: targetBlockMountIdVO,
      sourceHandle: request.sourceHandle,
      targetHandle: request.targetHandle,
      edgeShape: edgeShapeVO,
      userId: authenticatedUser.id,
    });

    if (result.isError()) {
      return err(String(result.error), {
        code: 'EDGE_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 4. Aggregate → DTO 변환
    const aggregate = result.value;
    const edgeView: EdgeView = {
      edgeId: aggregate.edge.id.value,
      pageId: aggregate.edge.pageId.value,
      sourceBlockMountId: aggregate.edge.sourceBlockMountId.value,
      targetBlockMountId: aggregate.edge.targetBlockMountId.value,
      sourceHandle: aggregate.edge.sourceHandle,
      targetHandle: aggregate.edge.targetHandle,
      edgeShape: aggregate.edge.edgeShape.value,
      createdAt: aggregate.edge.createdAt.toISOString(),
      updatedAt: aggregate.edge.updatedAt.toISOString(),
    };

    return ok(edgeView);
  } catch (error) {
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
```

### 3. Service 레이어

```typescript
// canvas-edge.service.ts
export class CanvasEdgeService implements ICanvasEdgeService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

  async createEdge(params: {
    pageId: PageId;
    sourceBlockMountId: BlockMountId;
    targetBlockMountId: BlockMountId;
    sourceHandle?: string;
    targetHandle?: string;
    edgeShape?: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 비즈니스 로직 검증
      const sourceBlockMount = await this.blockMountRepository.findById(
        params.sourceBlockMountId
      );
      const targetBlockMount = await this.blockMountRepository.findById(
        params.targetBlockMountId
      );

      if (!sourceBlockMount || !targetBlockMount) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Source or target block mount not found'
          )
        );
      }

      // 2. Aggregate 생성 (Command 패턴 아님 - 직접 파라미터 전달)
      const edgeId = EdgeId.generate();
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        params.pageId,
        params.sourceBlockMountId,
        params.targetBlockMountId,
        params.edgeShape,
        params.sourceHandle,
        params.targetHandle
      );

      // 3. Repository 저장
      await this.edgeRepository.save(aggregate);

      // 4. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 6. Aggregate 반환
      return Result.success(aggregate);
    } catch (error) {
      return Result.error(
        new CanvasManagementError(
          'EDGE_CREATION_FAILED',
          `Failed to create edge: ${error}`
        )
      );
    }
  }

  private async handleDomainEvents(events: Array<any>): Promise<void> {
    const results = await Promise.allSettled(
      events
        .filter(event => this.isEdgeManagementEvent(event))
        .map(async event => {
          if (event instanceof EdgeCreatedEvent) {
            return await this.handleEdgeCreated(event);
          }
        })
    );

    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[CanvasEdgeService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  private async handleEdgeCreated(event: EdgeCreatedEvent): Promise<void> {
    console.log('[Canvas Edge Management] Edge Created:', {
      type: event.type,
      data: event.data,
      occurredAt: event.occurredAt,
    });
  }
}
```

### 4. Aggregate 레이어

```typescript
// edge.aggregate.ts
export class EdgeAggregate {
  private _uncommittedEvents: Array<EdgeManagementEvents> = [];

  constructor(public readonly edge: Edge) {}

  static createEdge(
    edgeId: EdgeId,
    pageId: PageId,
    sourceBlockMountId: BlockMountId,
    targetBlockMountId: BlockMountId,
    edgeShape?: EdgeShape,
    sourceHandle?: string,
    targetHandle?: string
  ): EdgeAggregate {
    // 1. Edge Entity 생성
    const edge = new Edge(
      edgeId,
      pageId,
      sourceBlockMountId,
      targetBlockMountId,
      sourceHandle,
      targetHandle,
      edgeShape || EdgeShape.default()
    );

    // 2. Aggregate 생성
    const aggregate = new EdgeAggregate(edge);

    // 3. 이벤트 생성
    const event = new EdgeCreatedEvent(
      edgeId,
      {
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
        edgeShape: edge.edgeShape,
      },
      edge.createdAt // ✅ occurredAt은 data 밖으로 분리
    );
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  getUncommittedEvents(): Array<EdgeManagementEvents> {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
```

### 5. Repository 레이어

```typescript
// drizzle-edge.repository.ts
export class DrizzleEdgeRepository implements EdgeRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(aggregate: EdgeAggregate): Promise<void> {
    const edge = aggregate.edge;
    const persistenceData = edge.toPersistence();

    await this.db.insert(edges).values({
      id: persistenceData.id,
      page_id: persistenceData.pageId,
      source_block_mount_id: persistenceData.sourceBlockMountId,
      target_block_mount_id: persistenceData.targetBlockMountId,
      // ...
    });
  }

  async findById(edgeId: EdgeId): Promise<EdgeAggregate | null> {
    const row = await this.db
      .select()
      .from(edges)
      .where(eq(edges.id, edgeId.value))
      .limit(1);

    if (row.length === 0) {
      return null;
    }

    // ✅ Entity로 변환 후 Aggregate 재구성
    const edge = Edge.fromPersistence(row[0]);
    return new EdgeAggregate(edge);
  }
}
```

---

## 🎯 핵심 정리

### 데이터 흐름 요약

```
Hook (Client)
  ↓ Optimistic Update
  ↓ 1차 검증
  ↓ Server Action 호출
  
Server Action
  ↓ unknown 타입 받기
  ↓ 2차 검증
  ↓ 권한 검증
  ↓ Service 호출 (params)
  ↓ DTO 변환하여 반환
  
Service
  ↓ params 받기
  ↓ Aggregate 호출 (Command)
  ↓ 이벤트 처리
  ↓ Aggregate 반환
  
Aggregate
  ↓ Command 처리
  ↓ 이벤트 생성
  ↓ getUncommittedEvents()
  
Repository
  ↓ Aggregate 저장/조회
  ↓ Entity 변환
```

### 변환 체인

```
Client Request (Plain Object)
  → Request DTO (Zod Schema 검증)
  → Value Objects
  → Command (Service → Aggregate)
  → Aggregate (Domain)
  → Entity (Repository)
  → Database Row
  
Database Row
  → Entity (Repository)
  → Aggregate (Service)
  → Response DTO (Action)
  → Client Response
```

---

## 📚 참고 문서

- [Server-Side DDD 컨벤션](./server-side-ddd-conventions.md)
- [Event 패턴 구현 전략](./event-pattern-without-event-bus.md)
- [Repository 패턴](./repository-discussion.md)

---

**최종 업데이트**: 2025-01-XX  
**버전**: v1.0

