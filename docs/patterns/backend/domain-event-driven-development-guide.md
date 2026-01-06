# Domain-Driven Development 가이드

이 문서는 `block-management` 도메인의 실제 구현 패턴을 분석하여, 팀 개발자가 다른 도메인을 재구현하거나 새로운 기능을 추가할 때 따를 수 있는 규칙과 가이드를 제공합니다.

## 📁 계층 구조 (Layering)

```
block-management/
├── actions/           # Layer 1: Next.js Server Actions (Entry Point)
│   └── block/        # 도메인별 액션 그룹
├── backend/          # Layer 2: Application & Domain Services
│   ├── services/     # Application Services
│   │   └── block/
│   │       ├── lifecycle/    # 생명주기 관리 (create, duplicate, delete, restore)
│   │       ├── property/     # 속성 관리
│   │       └── common.event.ts  # 이벤트 핸들러
│   └── repositories/ # Infrastructure (DB 접근)
│       ├── interfaces/
│       └── implementations/
├── shared/           # Layer 3: Domain Core
│   ├── aggregates/  # Aggregate Roots
│   ├── commands/    # Command Interfaces
│   ├── entities/    # Domain Entities
│   ├── events/      # Domain Events
│   ├── value-objects/ # Value Objects
│   ├── dtos/        # Data Transfer Objects
│   │   ├── requests/ # Request DTOs + Zod Schemas
│   │   └── responses/ # Response DTOs
│   └── errors/      # Domain Errors
└── frontend/        # Layer 4: UI Components & Hooks
```

## 🎯 핵심 원칙

### 1. **단방향 의존성 흐름**
```
Action → Service → Aggregate → Entity
   ↓        ↓          ↓
  DTO    Repository  Events
```

### 2. **같은 도메인 내 import는 상대 경로 사용**
```typescript
// ✅ Good: 같은 도메인 내부
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockRepository } from '../repositories/interfaces/block.repository.interface';

// ❌ Bad: 절대 경로 사용
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
```

### 3. **다른 도메인은 절대 경로 사용**
```typescript
// ✅ Good: 다른 도메인
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
```

---

## 📋 Layer 1: Actions (Server Actions)

### 역할
- Next.js Server Actions의 진입점
- `withSecureAction` HOF를 통한 자동 검증
- 인증/권한 확인
- Service 호출 및 결과 반환

### 구현 규칙

#### 1. **Secure Action Builder를 통한 Wrapper 생성**

도메인별로 재사용 가능한 Secure Action Wrapper를 먼저 정의합니다:

```typescript
// actions/block/secure-action.ts
import {
  authorizeByWorkspaceId,  // ✅ @/domains/common/auth/helpers에서 제공
  getAuthenticatedUser,     // ✅ @/domains/common/auth/helpers에서 제공
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../shared/value-objects/block-id.vo';

/**
 * Block-based authorization with workspace validation (Zero Trust)
 *
 * blockId만으로 workspace 권한 자동 검증
 * 1. Block 조회 (DB = SSOT)
 * 2. Block에서 workspaceId 추출
 * 3. Workspace 권한 검증 (공통 helper 사용)
 *
 * ⚠️ 이 함수는 도메인별로 정의하지만, 내부적으로는
 * @/domains/common/auth/helpers의 공통 함수를 사용합니다.
 */
async function authorizeBlockById(
  blockId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Block 조회 (DB = SSOT)
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(blockId));

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 2. Block에서 workspaceId 추출
  const workspaceId = block.workspaceId.value;

  // 3. Workspace 권한 검증 (공통 helper 사용)
  return await authorizeByWorkspaceId(workspaceId, userId);
}

/**
 * Block 전용 Secure Action Builder
 */
const blockSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Block 전용 secure action wrapper
 */
export const withBlockSecureAction = blockSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth((req: { blockId: string }, user: AuthenticatedUser) =>
    authorizeBlockById(req.blockId, user.id)
  )
  .build();
```

#### 2. **Action 함수 구현**

**Context 타입 설명:**

`withSecureAction`은 검증 후 `context` 객체를 제공합니다. Context 타입은 액션의 권한 검증 방식에 따라 달라집니다:

- **`WorkspaceActionContext`**: Block 액션 등 워크스페이스 기반 권한 검증
  - `authenticatedUser`: 인증된 사용자 (id, profile)
  - `workspace`: 검증된 워크스페이스 엔티티
  - `organization`: 조직 정보 (id, role)

- **`PageActionContext`**: Edge, BlockMount 액션 등 페이지 기반 권한 검증
  - `authenticatedUser`: 인증된 사용자 (id, profile)
  - `workspace`: 검증된 워크스페이스 엔티티
  - `organization`: 조직 정보 (id, role)
  - `page`: 검증된 페이지 엔티티

```typescript
// actions/block/update-block-title.action.ts
'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateBlockTitle } from '../../backend/services/block/property/update-block-title.service';
import {
  UpdateBlockTitleRequest,
  UpdateBlockTitleRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockTitleUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import { withBlockSecureAction } from './secure-action';

/**
 * 블록 제목 업데이트 Server Action
 *
 * ⚠️ Security: withBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증 (Zod)
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 * 5. 블록 소유권 확인 (Block이 Workspace에 속하는지)
 */
export const updateBlockTitleAction = withBlockSecureAction(
  UpdateBlockTitleRequestSchema,
  'updateBlockTitleAction',
  updateBlockTitleInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO 전달 (Command 변환은 Service 내부에서 수행)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 *
 * @param safeDto - 검증된 요청 데이터 (Zod Schema로 검증됨)
 * @param context - 검증된 컨텍스트 정보
 *   - context.authenticatedUser: 인증된 사용자 정보 (id, profile)
 *   - context.workspace: 검증된 워크스페이스 엔티티
 *   - context.organization: 조직 정보 (id, role)
 */
async function updateBlockTitleInternal(
  safeDto: UpdateBlockTitleRequest, // ✅ 이미 검증됨 (SafeDTO)
  context: WorkspaceActionContext // ✅ 검증된 context (user, workspace, organization 포함)
): Promise<ActionResult<BlockTitleUpdatedDTO>> {
  try {
    // 1. Repository 생성
    const blockRepository = new DrizzleBlockRepository();

    // 2. Service Function을 통한 제목 업데이트 (SafeDTO 전달)
    const updateResult = await updateBlockTitle(safeDto, blockRepository);

    // 3. Result 처리
    if (updateResult.isError()) {
      return err(String(updateResult.error), {
        code: 'BLOCK_UPDATE_FAILED',
        meta: { originalError: updateResult.error },
      });
    }

    // 4. Response DTO 생성
    const block = updateResult.value.getBlock();
    const responseData: BlockTitleUpdatedDTO = {
      blockId: block.id.value,
      title: block.title,
      updatedAt: block.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[updateBlockTitleInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
```

#### 3. **Action 패턴 요약**

- ✅ **Secure Action Builder 사용**: 도메인별 재사용 가능한 wrapper 생성
- ✅ **Zod Schema 검증**: `withSecureAction`이 자동으로 처리
- ✅ **인증/권한 확인**: `authorize` 함수에서 처리
- ✅ **SafeDTO 전달**: Service에 검증된 DTO만 전달
- ✅ **Result 패턴**: `ActionResult<T>` 사용
- ✅ **Internal 함수 분리**: 검증 로직과 비즈니스 로직 분리

---

## 📋 Layer 2: Services (Application Layer)

### 역할
- 비즈니스 유스케이스 조율
- SafeDTO → Command 변환
- Aggregate 생성/조회
- Repository를 통한 영속화
- Domain Event 처리

### 구현 규칙

#### 1. **Service Function 패턴**

Service는 클래스가 아닌 **함수**로 구현합니다:

```typescript
// backend/services/block/lifecycle/create-block.service.ts
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { CreateBlockCommand } from '../../../../shared/commands';
import type { CreateBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../../shared/value-objects/block-type.vo';
import type { BlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 생성 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockRepository - Block Repository
 * @returns 생성된 블록 Aggregate
 */
export async function createBlock(
  safeDto: CreateBlockRequest,
  safeUserId: string,
  blockRepository: BlockRepository
): Promise<Result<BlockAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const workspaceId = new WorkspaceId(safeDto.workspaceId);
    const userIdVO = new UserId(safeUserId);
    const blockType = new BlockType(safeDto.blockType);

    // 2. SafeDTO → Command 변환
    const command: CreateBlockCommand = {
      workspaceId,
      userId: userIdVO,
      blockId: BlockId.generate(),
      blockType,
      title: safeDto.title,
      initialProperties: safeDto.initialProperties,
      initialContent: safeDto.initialContent,
    };

    // 3. Aggregate 생성 (Command → Event)
    const aggregate = BlockAggregate.create(command);

    // 4. 블록 생성
    await blockRepository.create(aggregate.getBlock());

    // 5. 도메인 이벤트 처리
    // ✅ Event Storming 원칙:
    // - Event는 "이미 발생한 사실" (Aggregate 상태는 이미 변경됨)
    // - Policy는 "부수 효과(Side Effect)" (로깅, 알림, 통계 등)
    // - Policy 실패는 Aggregate에 영향 없음 (나중에 재시도 가능)
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle())
    );
    // ✅ Promise.allSettled 사용: Policy 실패해도 에러 throw 안 함
    // ✅ 실패한 Policy는 로깅만 하고 계속 진행 (나중에 재시도 가능)

    // 6. 이벤트 커밋
    // ✅ Aggregate는 이미 성공적으로 저장됨
    // ✅ Policy 실패 여부와 관계없이 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 7. 결과 반환
    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_CREATION_FAILED',
        `Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
```

#### 2. **Service 패턴 요약**

- ✅ **함수 기반**: 클래스 대신 함수로 구현
- ✅ **SafeDTO 입력**: 검증된 DTO만 받음
- ✅ **SafeUserId**: 인증된 사용자 ID 전달
- ✅ **Repository 주입**: 함수 파라미터로 전달
- ✅ **Result 패턴**: `Result<T, Error>` 사용
- ✅ **Command 변환**: SafeDTO → Command 변환은 Service에서 수행
- ✅ **Aggregate 소포**: Aggregate를 Repository에 전달
- ✅ **Event 처리**: `event.handle()` 직접 호출 후 커밋

#### 3. **다른 Service 예시**

```typescript
// backend/services/block/lifecycle/duplicate-block.service.ts
export async function duplicateBlock(
  safeDto: DuplicateBlockRequest,
  safeUserId: string,
  blockRepository: BlockRepository
): Promise<Result<Block, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const originalBlockId = new BlockId(safeDto.blockId);
    const userIdVO = new UserId(safeUserId);

    // 2. 원본 블록 조회
    const originalBlock = await blockRepository.findById(originalBlockId);
    if (!originalBlock) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 3. Aggregate 재구성
    const originalBlockAggregate = BlockAggregate.reconstitute(originalBlock);

    // 4. SafeDTO → Command 변환
    const command: DuplicateBlockCommand = {
      userId: userIdVO,
    };

    // 5. 블록 복제 (Command → Event)
    const duplicatedBlockAggregate = originalBlockAggregate.duplicate(command);
    const duplicatedBlock = duplicatedBlockAggregate.getBlock();

    // 6. 블록 생성
    await blockRepository.create(duplicatedBlock);

    // 7. 도메인 이벤트 처리
    const events = duplicatedBlockAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle())
    );)

    // 8. 이벤트 커밋
    duplicatedBlockAggregate.markEventsAsCommitted();

    // 9. 결과 반환
    return Result.success(duplicatedBlock);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
```

---

## 📋 Layer 3: Aggregates & Commands

### Aggregate 역할
- Domain Command 수신
- Entity에 비즈니스 로직 위임
- Domain Event 발생 및 관리

### 구현 규칙

#### 1. **Command → Event 1:1 대응**

```typescript
// shared/aggregates/block.aggregate.ts
export class BlockAggregate {
  private _block: Block;                          // Entity
  private _uncommittedEvents: Array<DomainEvent> = [];  // Event Store

  // ✅ Command 처리 → Event 발생
  updateTitle(command: UpdateBlockTitleCommand): void {
    // 1️⃣ 비즈니스 규칙 검증
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update title of deleted block'
      );
    }

    // 2️⃣ Entity에 로직 위임
    const oldTitle = this._block.title;
    this._block.updateTitle(command.title);

    // 3️⃣ Event 발생 (1:1 대응)
    const event = new BlockTitleUpdatedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        oldTitle,
        newTitle: command.title,
      },
      this._block.updatedAt
    );

    // 4️⃣ Event 저장 (커밋 대기)
    this._uncommittedEvents.push(event);
  }
}
```

#### 2. **Command 정의 (shared/commands/)**

```typescript
// shared/commands/index.ts
export interface CreateBlockCommand {
  workspaceId: WorkspaceId;
  userId: UserId;
  blockId: BlockId;
  blockType: BlockType;
  title: string;
  initialProperties?: Record<string, any>;
  initialContent?: unknown;
}

export interface UpdateBlockTitleCommand {
  title: string;
}

export interface DeleteBlockCommand {
  // 빈 객체 (Aggregate 인스턴스에 이미 blockId가 있음)
}
```

#### 3. **Event 관리 메서드**

```typescript
export class BlockAggregate {
  // ✅ 이벤트 조회
  getUncommittedEvents(): Array<BlockManagementEvents> {
    return [...this._uncommittedEvents];
  }

  // ✅ 이벤트 커밋 (Service에서 처리 후 호출)
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // ✅ Block (Entity) 추출
  getBlock(): Block {
    return this._block;
  }
}
```

---

## 📋 Layer 4: Repository

### 역할
- Aggregate 영속화
- DB ↔ Domain Model 변환

### 구현 규칙

#### 1. **Interface 먼저 정의 (DIP)**

```typescript
// backend/repositories/interfaces/block.repository.interface.ts
export interface BlockRepository {
  create(block: Block): Promise<void>;          // ✅ Aggregate 전달
  update(block: Block): Promise<void>;
  findById(id: BlockId): Promise<Block | null>;
  delete(id: BlockId): Promise<void>;
  // ...
}
```

#### 2. **Implementation은 DB 기술에 종속**

```typescript
// backend/repositories/implementations/drizzle-block.repository.ts
export class DrizzleBlockRepository implements BlockRepository {
  async create(block: Block): Promise<void> {
    // 1️⃣ Domain Model → DB Model 변환
    const blockData = {
      id: block.id.value,
      workspace_id: block.workspaceId.value,
      created_by: block.userId.value,
      block_type: block.blockType.value,
      title: block.title,
      properties: block.properties.toJSON(),
      custom_properties: block.customProperties.map(cp => cp.toJSON()),
      content: block.content as any,
      // ...
    };

    // 2️⃣ DB 저장
    await adminDb.insert(blocks).values(blockData);
  }

  async findById(id: BlockId): Promise<Block | null> {
    // 1️⃣ DB 조회
    const result = await adminDb
      .select({ block: blocks, profile: profiles })
      .from(blocks)
      .leftJoin(profiles, eq(blocks.created_by, profiles.id))
      .where(eq(blocks.id, id.value))
      .limit(1);

    if (result.length === 0) return null;

    // 2️⃣ DB Model → Domain Model 변환
    return this.mapToBlock(result[0].block, result[0].profile);
  }

  // ✅ 매핑 로직 분리
  private mapToBlock(
    blockData: DatabaseBlock,
    profile: DatabaseProfile | null
  ): Block {
    return Block.reconstitute(
      new BlockId(blockData.id),
      new WorkspaceId(blockData.workspace_id),
      new UserId(blockData.created_by),
      new BlockType(blockData.block_type),
      blockData.title,
      propertiesVO,
      customProperties,
      blockData.created_at,
      blockData.updated_at,
      blockData.deleted_at,
      blockData.content,
      profile ? { /* ... */ } : undefined
    );
  }
}
```

---

## 📋 Layer 5: Entity

### 역할
- 비즈니스 로직 캡슐화
- 불변성 보장 (Value Object 활용)

### 구현 규칙

#### 1. **Private Constructor + Static Factory**

```typescript
// shared/entities/block.entity.ts
export class Block {
  private constructor(
    public readonly id: BlockId,          // ✅ VO, readonly
    public readonly workspaceId: WorkspaceId,
    public readonly userId: UserId,
    public blockType: BlockType,          // ✅ 변경 가능한 필드는 public
    public title: string,
    public properties: BlockPropertiesVO,
    // ...
  ) {}

  // ✅ 생성 팩토리
  static create(
    id: BlockId,
    workspaceId: WorkspaceId,
    userId: UserId,
    blockType: BlockType,
    title: string = '새 블럭',
    properties?: BlockPropertiesVO,
    content?: unknown
  ): Block {
    const now = new Date();
    const blockProperties =
      properties || BlockPropertiesFactory.createForBlockType(blockType);

    return new Block(
      id,
      workspaceId,
      userId,
      blockType,
      title,
      blockProperties,
      [],
      now,
      now,
      null,
      content ?? null
    );
  }

  // ✅ 재구성 팩토리 (Repository에서 사용)
  static reconstitute(
    id: BlockId,
    workspaceId: WorkspaceId,
    // ...
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    content?: unknown,
    createdByProfile?: UserProfile
  ): Block {
    return new Block(
      id,
      workspaceId,
      // ...
      createdAt,
      updatedAt,
      deletedAt,
      content,
      createdByProfile
    );
  }
}
```

#### 2. **비즈니스 로직은 Entity 메서드로**

```typescript
export class Block {
  // ✅ 명령형 메서드
  updateTitle(title: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update title of deleted block'
      );
    }
    this.title = title;
    this.updatedAt = new Date();
  }

  markAsDeleted(): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Block already deleted'
      );
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  // ✅ 조회형 메서드
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
```

---

## 📋 Layer 6: Value Objects

### 역할
- 불변성 보장
- 유효성 검증
- 도메인 의미 표현

### 구현 규칙

#### 1. **Private 필드 + Getter**

```typescript
// shared/value-objects/block-id.vo.ts
export class BlockId {
  private readonly _value: string;  // ✅ Private

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new BlockManagementError(
        'INVALID_BLOCK_ID',
        'Invalid BlockId format'
      );
    }
    this._value = value;
  }

  get value(): string {  // ✅ Public getter
    return this._value;
  }

  static generate(): BlockId {
    return new BlockId(crypto.randomUUID());
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  }

  equals(other: BlockId): boolean {
    return this._value === other._value;
  }
}
```

---

## 📋 Layer 7: Events

### 역할
- 도메인 변경 기록
- Event Storming의 Policy 구현
- Saga 패턴을 통한 분산 트랜잭션 관리

### 구현 규칙

#### 1. **Event 클래스에 handle() 메서드 포함** ✅ 권장

Event와 Policy는 Event Storming에서 붙어있듯이 코드에서도 함께 있어야 합니다.
Next.js Server Actions (Serverless) 환경에서는 Event Bus를 사용할 수 없으므로, Event 클래스에 `handle()` 메서드를 직접 구현합니다.

**중요한 원칙:**
- ✅ Policy는 **부수 효과(Side Effect)**만 처리 (로깅, 알림, 통계 등)
- ✅ Policy 실패는 Aggregate에 영향 없음 (나중에 재시도 가능)
- ✅ **compensate 불필요**: Policy는 부수 효과이므로 보상 트랜잭션 불필요

#### 2. **Event handle() 구현 예시**

여러 단계로 구성된 복잡한 트랜잭션의 경우 Saga 패턴을 사용합니다:

```typescript
// shared/events/index.ts

/**
 * BlockDuplicatedEvent
 * 
 * Event Storming Policy:
 * - 블록 복제 로그 기록
 * - 워크스페이스 통계 업데이트
 * - 알림 전송
 */
export class BlockDuplicatedEvent {
  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      originalBlockId: string;
      duplicatedBlockId: string;
      workspaceId: string;
      userId: string;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   * Event Storming의 Policy와 1:1 매칭
   * 
   * ✅ Policy는 부수 효과이므로 실패해도 Aggregate에 영향 없음
   * ✅ 실패한 Policy는 나중에 재시도 가능
   */
  async handle(): Promise<void> {
    // 순수 로깅 (항상 성공)
    console.log('[Block Management] Block Duplicated:', {
      originalBlockId: this.data.originalBlockId,
      duplicatedBlockId: this.data.duplicatedBlockId,
      occurredAt: this.occurredAt,
    });

    // 외부 도메인 Policy 실행 (부수 효과)
    // ✅ Promise.allSettled 사용: 실패해도 에러 throw 안 함
    await Promise.allSettled([
      this.updateWorkspaceStats(),
      this.sendNotification(),
    ]);
  }

  /**
   * Policy: 워크스페이스 통계 업데이트
   */
  private async updateWorkspaceStats(): Promise<void> {
    try {
      const statsService = new WorkspaceStatsService();
      await statsService.incrementBlockCount(this.data.workspaceId);
    } catch (error) {
      console.error('[BlockDuplicatedEvent] Failed to update workspace stats:', error);
      // ✅ 실패해도 OK, 나중에 재시도 가능
    }
  }

  /**
   * Policy: 알림 전송
   */
  private async sendNotification(): Promise<void> {
    try {
      const notificationService = new NotificationService();
      await notificationService.send({
        userId: this.data.userId,
        type: 'BLOCK_DUPLICATED',
        message: '블록이 복제되었습니다.',
      });
    } catch (error) {
      console.error('[BlockDuplicatedEvent] Failed to send notification:', error);
      // ✅ 실패해도 OK, 나중에 재시도 가능
    }
  }
}
```

#### 3. **Service에서 Event 사용**

```typescript
// backend/services/block/lifecycle/duplicate-block.service.ts
export async function duplicateBlock(
  safeDto: DuplicateBlockRequest,
  safeUserId: string,
  blockRepository: BlockRepository
): Promise<Result<Block, Error>> {
  try {
    // 1-5. Aggregate 생성 및 저장
    const duplicatedBlockAggregate = originalBlockAggregate.duplicate(command);
    await blockRepository.create(duplicatedBlockAggregate.getBlock());

    // 6. 도메인 이벤트 처리
    // ✅ Event Storming 원칙:
    // - Event는 "이미 발생한 사실" (Aggregate 상태는 이미 변경됨)
    // - Policy는 "부수 효과(Side Effect)" (로깅, 알림, 통계 등)
    // - Policy 실패는 Aggregate에 영향 없음 (나중에 재시도 가능)
    const events = duplicatedBlockAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle())
    );
    // ✅ Promise.allSettled 사용: Policy 실패해도 에러 throw 안 함
    // ✅ 실패한 Policy는 로깅만 하고 계속 진행 (나중에 재시도 가능)

    // 7. 이벤트 커밋
    // ✅ Aggregate는 이미 성공적으로 저장됨
    // ✅ Policy 실패 여부와 관계없이 이벤트 커밋
    duplicatedBlockAggregate.markEventsAsCommitted();

    return Result.success(duplicatedBlockAggregate.getBlock());
  } catch (error) {
    // ...
  }
}
```

#### 4. **테스트 전략**

외부 서비스를 모킹하여 Policy 테스트:

```typescript
// shared/events/__tests__/block-duplicated.event.test.ts
import { BlockDuplicatedEvent } from '../index';
import { WorkspaceStatsService } from '@/domains/workspace-management/...';
import { NotificationService } from '@/domains/notification/...';

jest.mock('@/domains/workspace-management/backend/services/workspace-stats.service');
jest.mock('@/domains/notification/backend/services/notification.service');

describe('BlockDuplicatedEvent', () => {
  it('should execute policies successfully', async () => {
    const mockIncrement = jest.fn().mockResolvedValue(undefined);
    const mockSend = jest.fn().mockResolvedValue(undefined);
    
    (WorkspaceStatsService as jest.Mock).mockImplementation(() => ({
      incrementBlockCount: mockIncrement,
    }));
    (NotificationService as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const event = new BlockDuplicatedEvent(/* ... */);
    await event.handle();

    expect(mockIncrement).toHaveBeenCalledWith(event.data.workspaceId);
    expect(mockSend).toHaveBeenCalled();
  });

  it('should continue even if policies fail', async () => {
    const mockIncrement = jest.fn().mockResolvedValue(undefined);
    const mockSend = jest.fn().mockRejectedValue(new Error('Notification failed'));
    
    (WorkspaceStatsService as jest.Mock).mockImplementation(() => ({
      incrementBlockCount: mockIncrement,
    }));
    (NotificationService as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const event = new BlockDuplicatedEvent(/* ... */);
    
    // ✅ Policy 실패해도 에러 throw 안 함
    await expect(event.handle()).resolves.not.toThrow();
    
    // ✅ 실패한 Policy는 로깅만 하고 계속 진행
    expect(mockIncrement).toHaveBeenCalledWith(event.data.workspaceId);
    expect(mockSend).toHaveBeenCalled();
  });
});
```

#### 5. **Policy vs 중요한 비즈니스 로직 구분**

**Event Storming 원칙:**
- ✅ **Event는 "이미 발생한 사실"**: Aggregate 상태는 이미 변경됨
- ✅ **Policy는 "부수 효과"**: 로깅, 알림, 통계 등 (실패해도 OK)
- ✅ **중요한 비즈니스 로직은 Command**: Service에서 명시적으로 처리

**예시: 주문-결제-배송**

```typescript
// ❌ 잘못된 패턴: Policy에서 중요한 로직 처리
OrderCreated Event
  → Policy: 결제 처리 (실패하면 주문 취소?) ❌

// ✅ 올바른 패턴: Service에서 별도 Command 처리
async function createOrder(orderDto, paymentDto) {
  // 1. 주문 생성 (결제 대기 상태)
  const orderAggregate = OrderAggregate.create({
    status: 'PENDING_PAYMENT'
  });
  await orderRepository.create(orderAggregate.getBlock());
  
  // 2. Event 처리 (부수 효과만)
  const events = orderAggregate.getUncommittedEvents();
  await Promise.allSettled(events.map(e => e.handle()));
  // - 로깅 ✅
  // - 알림 ✅
  // - 통계 ✅
  // ✅ 실패해도 OK, 나중에 재시도 가능
  
  // 3. 결제 처리 (중요한 로직 - Command로 처리)
  const paymentResult = await processPayment(paymentDto);
  if (!paymentResult.success) {
    // 주문은 그대로 유지 (PENDING_PAYMENT 상태)
    return Result.error('Payment failed');
  }
  
  // 4. 주문 상태 업데이트 (새로운 Command)
  orderAggregate.confirmPayment(paymentResult.transactionId);
  await orderRepository.update(orderAggregate.getBlock());
  
  return Result.success(orderAggregate);
}
```

#### 6. **왜 Event 클래스에 handle()을 포함하는가?**

**장점:**
1. ✅ **Event Storming과 일치**: Event와 Policy가 한 곳에
2. ✅ **Next.js 환경**: Serverless에서 Event Bus 불가능
3. ✅ **외부 서비스 블랙박스**: 다른 도메인 서비스를 직접 import (순환 참조 위험 낮음)
4. ✅ **캡슐화**: Event가 자신의 후속 처리를 담당
5. ✅ **테스트**: 모킹으로 외부 의존성 제거
6. ✅ **부수 효과 관리**: Policy 실패해도 Aggregate에 영향 없음 (나중에 재시도 가능)

**중요한 원칙:**
- ⚠️ **Policy는 부수 효과만**: 실패해도 Aggregate에 영향 없음, 나중에 재시도 가능
- ⚠️ **중요한 비즈니스 로직은 Service에서**: Policy가 아니라 별도 Command로 처리
- ⚠️ **compensate 불필요**: Policy는 부수 효과이므로 보상 트랜잭션 불필요

**대안 (권장하지 않음):**
- ❌ Event Handler를 `backend/services/block/common.event.ts`에 분리
  - Event와 Policy가 물리적으로 분리
  - Event Storming 결과와 코드 구조 불일치
- ❌ Event Bus 패턴
  - Next.js Serverless 환경에서 글로벌 상태 유지 불가능
- ❌ Policy 실패 시 Aggregate 롤백
  - Event Storming 원칙 위반 (Event는 이미 발생한 사실)

---

## 📋 Layer 8: DTOs

### 역할
- Action ↔ Frontend 데이터 전송
- Zod Schema 검증

### 구현 규칙

#### 1. **Request DTO (Zod Schema 포함)**

```typescript
// shared/dtos/requests/block.requests.ts
import { z } from 'zod';

export const UpdateBlockTitleRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  title: z.string().min(1, 'Title is required'),
});

// Output type (SafeDTO) - 서버에서 사용
export type UpdateBlockTitleRequest = z.output<
  typeof UpdateBlockTitleRequestSchema
>;

// Input type - 프론트엔드에서 사용 (더 유연한 타입)
export type UpdateBlockTitleRequestInput = z.input<
  typeof UpdateBlockTitleRequestSchema
>;
```

#### 2. **Response DTO**

```typescript
// shared/dtos/responses/block.responses.ts
export interface BlockTitleUpdatedDTO {
  blockId: string;
  title: string;
  updatedAt: Date;
}
```

---

## 🔐 보안 패턴

### 1. **Defense in Depth (심층 방어)**

`withSecureAction` HOF가 자동으로 다음 레이어를 적용합니다:

1. **Runtime Validation**: Zod 스키마 검증
2. **Authentication**: 사용자 인증 확인
3. **Authorization**: 리소스 접근 권한 확인

### 2. **Zero Trust 원칙**

- 모든 요청은 신뢰하지 않음 (`unknown` 타입으로 받기)
- DB를 SSOT(Single Source of Truth)로 사용
- Action에서 리소스 소유권 재검증

### 3. **Authorization Helper 사용**

`@/domains/common/auth/helpers.ts`에서 제공하는 공통 함수들을 사용합니다:

```typescript
// @/domains/common/auth/helpers.ts에서 제공하는 함수들:

// 1. 인증 확인
getAuthenticatedUser(): Promise<AuthenticatedUser>

// 2. 워크스페이스 접근 권한 확인
authorizeByWorkspaceId(workspaceId: string, userId: string): Promise<AuthorizeResult<WorkspaceActionContext>>

// 3. 페이지 접근 권한 확인
authorizeByPageId(pageId: string, userId: string): Promise<AuthorizeResult<PageActionContext>>

// 4. Edge 기반 권한 확인 (Edge에서 Page 추출 후 검증)
authorizeByEdgeId(edgeId: string, userId: string): Promise<AuthorizeResult<PageActionContext>>

// 5. BlockMount 기반 권한 확인 (BlockMount에서 Page 추출 후 검증)
authorizeByBlockMountId(blockMountId: string, userId: string): Promise<AuthorizeResult<PageActionContext>>
```

**도메인별 Authorization 함수 정의 예시:**

도메인별로 리소스 ID만으로 권한을 확인하는 함수를 정의할 수 있습니다. 이 함수들은 내부적으로 위의 공통 helper 함수들을 사용합니다:

```typescript
// actions/block/secure-action.ts
async function authorizeBlockById(
  blockId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Block 조회 (DB = SSOT)
  const block = await blockRepository.findById(new BlockId(blockId));
  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 2. 공통 helper 사용
  return await authorizeByWorkspaceId(block.workspaceId.value, userId);
}
```

---

## ✅ 체크리스트: 새 도메인 구현 시

### 1. **Shared (Domain Core) 먼저 설계**
- [ ] Value Objects 정의 (IDs, Types)
- [ ] Entity 정의
- [ ] Commands 정의 (Interface)
- [ ] Events 정의 (Class)
- [ ] Aggregate 정의
- [ ] Errors 정의
- [ ] DTOs 정의 (Request/Response + Zod Schema)

### 2. **Backend (Application Layer)**
- [ ] Repository Interface 정의
- [ ] Repository Implementation 구현 (Drizzle/Prisma)
- [ ] Service Function 구현 (SafeDTO → Command → Aggregate → Repository)
- [ ] Event Handlers 구현 (`common.event.ts`)

### 3. **Actions (Entry Point)**
- [ ] Secure Action Builder 생성 (도메인별 wrapper)
- [ ] Server Action 구현 (`withSecureAction` 사용)
- [ ] Internal 함수 분리
- [ ] Result 패턴 적용

### 4. **Frontend (Presentation)**
- [ ] Hooks 구현 (useMutation, useQuery)
- [ ] Components 구현
- [ ] Action 연동

---

## 📝 요약

| Layer | 책임 | Import 규칙 | 주요 패턴 |
|-------|------|-------------|-----------|
| **Actions** | 진입점, 검증, 인증 | - | `withSecureAction`, Result |
| **Services** | 유스케이스 조율 | 같은 도메인 상대경로 | Function, SafeDTO → Command |
| **Aggregates** | Command → Event | 같은 도메인 상대경로 | 1:1 대응 |
| **Repository** | 영속화, 변환 | Interface (DIP) | Aggregate 소포 |
| **Entity** | 비즈니스 로직 | 같은 도메인 상대경로 | Factory, 불변성 |
| **Value Objects** | 불변성, 검증 | 다른 도메인 절대경로 | Private + Getter |
| **Events** | 도메인 변경 기록 | - | Class, Handler |
| **DTOs** | 데이터 전송 | - | Zod Schema |

---

## 🎯 핵심 원칙 요약

1. **서비스는 SafeDTO로 안전하게 받는다**: Action에서 검증된 DTO를 Service에 전달
2. **Result를 사용한다**: Aggregate나 Entity를 Result로 감싸서 반환
3. **Aggregate는 비즈니스 로직을 처리한다**: Command로 반드시 전달, Repository도 Aggregate를 소포처럼 전달
4. **이벤트는 서비스에서 처리한다**: `event.handle()` 직접 호출 후 커밋 (Policy는 부수 효과, 실패해도 OK)
5. **도메인에서 정의한 에러를 에러 타입으로 정의한다**: `BlockManagementError` 같은 도메인별 에러 클래스
6. **같은 도메인에서 import하는 경우는 상대 경로를 사용한다**: `../../shared/...`
7. **Command와 Event는 1:1 대응이다**: 각 Command는 하나의 Event를 발생시킴
8. **DTO request, response는 action에서 주고 받는 데이터임**: Zod Schema로 검증

이 가이드를 따르면 **일관성 있고 유지보수 가능한 도메인 구현**이 가능합니다! 🚀
