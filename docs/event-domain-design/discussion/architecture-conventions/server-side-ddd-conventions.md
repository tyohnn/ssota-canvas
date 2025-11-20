# Server-Side DDD 컨벤션 가이드

## 🎯 개요

이 문서는 서버 사이드에서 도메인 기반 개발(Domain-Driven Design)을 위한 명확한 컨벤션과 패턴을 정의합니다. 특히 **Trust Boundary**, **데이터 흐름**, **타입 안전성**에 중점을 둡니다.

**최근 업데이트**: 2025-10-27  
**버전**: v1.1

### 🔄 v1.1 변경사항
- **Zod 스키마 정의**: `shared/schemas/` 디렉토리에 공유 스키마 추가
- **Profile Schema 단순화**: `profiles.id = users.id`로 변경하여 불필요한 변환 로직 제거
- **명시적 변수명**: `mountAggregate`, `blockEntity`로 서비스 반환값 명확화
- **Frontend 검증**: UX 최적화를 위한 1차 검증 로직 추가
- **Error Handling**: `error.issues` 사용으로 Zod 에러 처리 일관성 확보
- **SSOT 강화**: `blockTypeEnum.enumValues` 직접 사용으로 데이터베이스 스키마와 완전 동기화
- **도메인 간 재사용**: `block-management` 도메인의 `BlockType`, `getBlockSize` 재사용

---

## 1. Trust Boundary와 데이터 신뢰

### 1.1 Trust Boundary 정의

```
┌─────────────────────────────────────────────────────────────┐
│                    Trust Boundary                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  외부 (Untrusted)                 내부 (Trusted)             │
│                                                               │
│  • Frontend                      • Server Action             │
│  • Browser Console               • Service Layer             │
│  • HTTP Request                  • Repository Layer          │
│  • Postman/cURL                  • Domain Layer              │
│  • API Clients                   • Database                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 타입 전략

#### **Server Action (Trust Boundary)**
```typescript
// ✅ Good: unknown + 강한 검증
export async function createBlockAction(
  request: unknown  // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<BlockMountedDTO>> {
  // 🔒 검증 레이어 (Trust Boundary)
  const parseResult = CreateBlockRequestSchema.safeParse(request);
  
  if (!parseResult.success) {
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues }
    });
  }
  
  // ✅ 이제부터는 신뢰할 수 있음
  const validatedRequest = parseResult.data;  // type: CreateBlockRequest
  return await createBlockInternal(validatedRequest);
}

// ❌ Bad: 타입만 믿고 검증 없음
export async function createBlockAction(
  request: CreateBlockRequest  // 위험! 런타임 검증 없음
): Promise<ActionResult<BlockMountedDTO>> {
  // 검증 없이 바로 사용 - 보안 취약점!
}
```

#### **내부 레이어 (Trusted)**
```typescript
// ✅ Good: 강타입 사용 (이미 검증됨)
async function createBlockInternal(
  request: CreateBlockRequest  // ✅ 검증된 데이터
): Promise<ActionResult<BlockMountedDTO>> {
  const command: CreateAndMountBlockCommand = {
    blockType: request.blockType,      // 타입 안전
    workspaceId: request.workspaceId,  // 타입 안전
    // ...
  };
  
  return await blockMountService.createAndMountBlock(command);
}

// ❌ Bad: 내부에서 unknown 사용
async function createBlockInternal(
  request: unknown  // 불필요한 재검증
): Promise<ActionResult<BlockMountedDTO>> {
  const validated = Schema.safeParse(request);  // 중복 검증
  // ...
}
```

### 1.3 검증 전략

#### **Frontend + Server 이중 검증**
```typescript
// 1. Frontend 검증 (UX 최적화)
const useBlockCreation = () => {
  const createBlock = async (rawData: unknown) => {
    // Frontend에서 1차 검증
    const parseResult = CreateBlockRequestSchema.safeParse(rawData);
    
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      console.error('[Frontend Validation] Invalid block data:', {
        message: firstError?.message || 'Invalid block data',
        issues: parseResult.error.issues,
      });
      // TODO: toast.error로 사용자에게 피드백
      return { success: false };
    }
    
    // 검증된 데이터로 서버 액션 호출
    return await createBlockAction(parseResult.data);
  };
};

// 2. Server 검증 (보안 필수)
export async function createBlockAction(request: unknown) {
  // Server에서 2차 검증 (필수!)
  const parseResult = CreateBlockRequestSchema.safeParse(request);
  
  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createBlockAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });
    
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }
  
  // 비즈니스 로직 실행
}
```

---

## 2. 레이어 이동 패턴

### 2.1 데이터 흐름 아키텍처

```
Frontend (UI State)
    ↓ CreateBlockRequest (DTO)
Server Action (unknown + Zod)
    ↓ CreateBlockRequest (Validated DTO)
Internal Function (Strong Type)
    ↓ CreateAndMountBlockCommand (Command)
Service Layer (Command)
    ↓ Block Entity + BlockMountAggregate
Repository Layer (Entity)
    ↓ Database Row (Primitive)
Database
```

### 2.2 계층별 책임

| 계층 | 입력 | 처리 | 출력 | 타입 전략 |
|------|------|------|------|----------|
| **Server Action** | `unknown` | Zod 검증 | `CreateBlockRequest` | `unknown` + 검증 |
| **Internal Function** | `CreateBlockRequest` | Command 생성 | `CreateAndMountBlockCommand` | Strong Type |
| **Service Layer** | `Command` | 비즈니스 로직 | `Entity` + `Aggregate` | Strong Type |
| **Repository Layer** | `Entity` | 영속화 | Database Row | Strong Type |
| **Domain Layer** | `Value Objects` | 도메인 규칙 | `Entity` | Strong Type |

### 2.3 레이어 간 데이터 변환

```typescript
// 1. Server Action → Service
const command: CreateAndMountBlockCommand = {
  blockType: request.blockType,        // string (primitive)
  workspaceId: request.workspaceId,    // string (primitive)
  pageId: pageIdVO,                    // PageId VO
  position: positionVO,                // Position VO
  size: sizeVO,                        // Size VO
  userId: userIdVO.value,              // string (extracted from VO)
};

// 2. Service → Repository
const blockEntity = await this.blockManagementService.createBlock({
  blockType: command.blockType,
  workspaceId: command.workspaceId,
  metadata: command.metadata || {},
  userId: command.userId,
});

// 3. Repository → Database
const blockData = {
  id: block.id.value,                    // BlockId VO → string
  block_type: block.blockType.value,     // BlockType VO → string
  workspace_id: block.workspaceId.value, // WorkspaceId VO → string
  created_by: block.createdBy?.id,       // CreatedByProfile → string
  created_at: block.createdAt,           // Date → Date
  updated_at: block.updatedAt,           // Date → Date
  properties: block.properties,          // Record<string, any> → JSON
  custom_properties: block.customProperties, // Array → JSON
};
```

---

## 3. 데이터 캡슐 사용 패턴

### 3.1 DTO (Data Transfer Object)

#### **Zod 스키마 정의 (공유)**
```typescript
// shared/schemas/block.schemas.ts
import { z } from 'zod';
import { blockTypeEnum } from '@/db/schema-dev';

/**
 * Block Type 검증 스키마
 * 
 * 데이터베이스 스키마(schema-dev.ts)를 SSOT로 사용
 * - blockTypeEnum.enumValues를 직접 사용하여 동기화 보장
 * - 수동으로 enum 값들을 나열하지 않음
 */
export const BlockTypeSchema = z.enum(blockTypeEnum.enumValues as [string, ...string[]]);

/**
 * Position 기본 구조 검증 스키마
 * 
 * ⚠️ Trusted Region에서는 Value Object가 비즈니스 검증 담당
 * - 구조적 검증만 수행 (타입, 존재 여부)
 * - 비즈니스 규칙은 Position Value Object에서 처리
 */
export const PositionSchema = z.object({
  x: z.number().finite('X must be a finite number'),
  y: z.number().finite('Y must be a finite number'),
});

/**
 * Size 기본 구조 검증 스키마
 *
 * ⚠️ Trusted Region에서는 Value Object가 비즈니스 검증 담당
 * - 구조적 검증만 수행 (타입, 존재 여부)
 * - 비즈니스 규칙은 Size Value Object에서 처리
 */
export const SizeSchema = z.object({
  width: z.number().finite('Width must be a finite number'),
  height: z.number().finite('Height must be a finite number'),
});

/**
 * 블럭 생성 요청 스키마
 * 
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 * 
 * ⚠️ SSOT: size는 optional로 두고, 실제 사용 시 getBlockSize()로 기본값 설정
 */
export const CreateBlockRequestSchema = z.object({
  pageId: z.string().uuid('Invalid page ID'),
  blockType: BlockTypeSchema,
  position: PositionSchema,
  size: SizeSchema.optional(), // getBlockSize()로 동적 기본값 설정
  workspaceId: z.string().uuid('Invalid workspace ID'),
  orgId: z.string().uuid('Invalid organization ID').optional(),
});

/**
 * TypeScript 타입 추론
 * 
 * ⚠️ SSOT: BlockType은 block-management 도메인에서 가져옴
 */
export type CreateBlockRequestInput = z.input<typeof CreateBlockRequestSchema>;
export type CreateBlockRequest = z.output<typeof CreateBlockRequestSchema>;
// BlockType은 block-management 도메인에서 재사용
export type Position = z.infer<typeof PositionSchema>;
export type Size = z.infer<typeof SizeSchema>;
```

#### **Request DTO**
```typescript
// shared/dtos/requests/block.requests.ts
export interface CreateBlockRequest {
  pageId: string;
  blockType: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  workspaceId: string;
  orgId?: string;
}
```

#### **Response DTO**
```typescript
// shared/dtos/responses/block.responses.ts
export type BlockMountedDTO = BlockView;  // SSOT 사용

// shared/dtos/views/block.views.ts
export interface BlockView {
  // Canvas Management 정보
  blockMountId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
  
  // Block Management 정보
  blockId: string;
  blockType: string;
  properties: Record<string, any>;
  customProperties: Array<{...}>;
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
  createdBy?: string | CreatedByProfile;
}
```

### 3.2 Command (비즈니스 의도)

```typescript
// shared/commands/block.commands.ts
export interface CreateAndMountBlockCommand {
  blockType: string;
  workspaceId: string;
  pageId: PageId;           // Value Object
  position: Position;       // Value Object
  size: Size;              // Value Object
  userId: string;
  metadata?: Record<string, any>;
}

// Command 클래스 (강력한 검증)
export class CreateAndMountBlockCommand {
  constructor(
    public readonly blockType: string,
    public readonly workspaceId: string,
    public readonly pageId: PageId,
    public readonly position: Position,
    public readonly size: Size,
    public readonly userId: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    this.validate();
  }
  
  private validate(): void {
    if (!this.blockType) throw new Error('blockType is required');
    if (!this.workspaceId) throw new Error('workspaceId is required');
    // ... 추가 검증
  }
}
```

### 3.3 Value Objects (도메인 규칙)

```typescript
// shared/value-objects/block-id.vo.ts
export class BlockId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid BlockId format');
    }
  }
  
  private isValid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }
  
  getValue(): string {
    return this.value;
  }
  
  equals(other: BlockId): boolean {
    return this.value === other.value;
  }
}

// shared/value-objects/position.vo.ts
export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    if (x < 0 || y < 0) {
      throw new Error('Position coordinates must be non-negative');
    }
  }
  
  distance(other: Position): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
  }
}
```

### 3.4 Entities (비즈니스 로직)

```typescript
// shared/entities/block.entity.ts
export class Block {
  constructor(
    public readonly id: BlockId,
    public readonly blockType: BlockType,
    public readonly workspaceId: WorkspaceId,
    public readonly properties: Record<string, any>,
    public readonly customProperties: CustomPropertyDefinition[],
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly createdBy?: CreatedByProfile
  ) {
    this.validate();
  }
  
  private validate(): void {
    if (!this.id) throw new Error('Block ID is required');
    if (!this.blockType) throw new Error('Block type is required');
    // 도메인 규칙 검증
  }
  
  // 비즈니스 로직
  updateProperties(newProperties: Record<string, any>): void {
    Object.assign(this.properties, newProperties);
    this.updatedAt = new Date();
  }
  
  canBeDeleted(): boolean {
    // 삭제 가능 여부 비즈니스 로직
    return this.blockType !== 'system';
  }
}
```

### 3.5 Aggregates (일관성 보장)

```typescript
// shared/aggregates/block-mount.aggregate.ts
export class BlockMountAggregate {
  constructor(
    public readonly blockMount: BlockMount,
    public readonly block: Block
  ) {
    this.validateConsistency();
  }
  
  private validateConsistency(): void {
    // Aggregate 내부 일관성 검증
    if (this.blockMount.blockId !== this.block.id) {
      throw new Error('BlockMount and Block ID mismatch');
    }
  }
  
  static mountBlock(
    blockMountId: BlockMountId,
    pageId: PageId,
    blockId: BlockId,
    position: Position,
    size: Size
  ): BlockMountAggregate {
    const blockMount = new BlockMount(blockMountId, pageId, blockId, position, size);
    // Block은 별도로 생성되어 전달됨
    return new BlockMountAggregate(blockMount, block);
  }
  
  updatePosition(newPosition: Position): void {
    this.blockMount.updatePosition(newPosition);
    // Aggregate 내부 일관성 유지
  }
}
```

---

## 4. 명칭 컨벤션

### 4.1 데이터 캡슐 명칭 규칙

| 타입 | 명칭 패턴 | 예시 | 설명 |
|------|----------|------|------|
| **DTO** | `[Domain][Action]Request/Response` | `CreateBlockRequest` | 데이터 전송 |
| **Command** | `[Action][Domain]Command` | `CreateAndMountBlockCommand` | 비즈니스 의도 |
| **Value Object** | `[Concept]VO` 또는 `[Concept]` | `BlockId`, `Position` | 도메인 값 |
| **Entity** | `[Domain]` | `Block`, `User` | 비즈니스 객체 |
| **Aggregate** | `[Domain]Aggregate` | `BlockMountAggregate` | 일관성 단위 |

### 4.2 변수명 컨벤션

```typescript
// ✅ Good: 명시적 변수명
const { mountAggregate, blockEntity } = result.value;

// Service 메서드 반환값
interface BlockMountResult {
  mountAggregate: BlockMountAggregate;  // 마운트 정보
  blockEntity: Block;                    // 블럭 엔티티
}

// ❌ Bad: 모호한 변수명
const { aggregate, block } = result.value;  // 뭐가 뭔지 불명확
```

### 4.3 네이밍 컨벤션 통일

```typescript
// Value Objects
const blockIdVO = new BlockId("123");
const positionVO = new Position(100, 200);
const sizeVO = new Size(300, 400);

// Entities
const blockEntity = new Block(/*...*/);
const userEntity = new User(/*...*/);

// Aggregates
const blockMountAggregate = new BlockMountAggregate(/*...*/);

// DTOs
const createBlockRequest: CreateBlockRequest = { /*...*/ };
const blockMountedDTO: BlockMountedDTO = { /*...*/ };
```

---

## 5. DTO 명칭 전략

### 5.1 Request 명칭 (도메인 중심)

```typescript
// ❌ 기술적 관점
CreateBlockResponse  // "블럭 생성 응답"

// ✅ 도메인 관점  
BlockMountedDTO     // "블럭이 마운트된 상태"
CanvasViewData      // "캔버스 뷰 데이터"
BlockPositionUpdatedDTO // "위치가 업데이트된 블럭"
```

### 5.2 Response 명칭 원칙

#### **1. 비즈니스 의미 중심**
```typescript
// 도메인 전문가가 이해하기 쉬운 용어
BlockMountedDTO     // "마운트된 블럭"
BlockPositionUpdatedDTO // "위치가 업데이트된 블럭"
CanvasViewData      // "캔버스 뷰 데이터"
```

#### **2. 재사용성 고려**
```typescript
// ❌ 특정 액션에 종속
CreateBlockResponse  // 생성할 때만 사용

// ✅ 다양한 상황에서 사용
BlockView           // 생성, 조회, 업데이트 모두에서 사용
CanvasViewData      // 캔버스 로드, 새로고침 등에서 사용
```

#### **3. SSOT (Single Source of Truth) 활용**
```typescript
// shared/dtos/views/block.views.ts
export interface BlockView {
  // Canvas Management 정보
  blockMountId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
  
  // Block Management 정보
  blockId: string;
  blockType: string;
  properties: Record<string, any>;
  customProperties: Array<{...}>;
  
  // 메타데이터
  createdAt: string;
  updatedAt: string;
  createdBy?: string | CreatedByProfile;
}

// shared/dtos/responses/block.responses.ts
export type BlockMountedDTO = BlockView;  // SSOT 사용
export type BlockUpdatedDTO = BlockView;  // SSOT 사용
```

### 5.3 DTO 분류 체계

```
shared/dtos/
├── requests/           # Frontend → Backend
│   ├── block.requests.ts
│   ├── canvas.requests.ts
│   └── edge.requests.ts
├── responses/          # Backend → Frontend
│   ├── block.responses.ts
│   ├── canvas.responses.ts
│   └── edge.responses.ts
├── views/             # SSOT, 공통 뷰
│   ├── block.views.ts
│   ├── canvas.views.ts
│   └── edge.views.ts
└── internal/          # 서버 내부 전용
    └── canvas.data.ts
```

---

## 6. 코드 컨벤션

### 6.1 Server Action 패턴

```typescript
/**
 * Block 생성 및 마운팅 통합 Server Action
 * 
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 * 
 * @param request - 클라이언트 요청 (런타임 검증 필요)
 * @returns BlockMountedDTO (성공) | Error (실패)
 */
export async function createBlockAction(
  request: unknown  // 명시적으로 "신뢰하지 않음"
): Promise<ActionResult<BlockMountedDTO>> {
  // 1. Runtime Validation (필수)
  const parseResult = CreateBlockRequestSchema.safeParse(request);
  
  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createBlockAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });
    
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }
  
  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data;  // type: CreateBlockRequest
  
  // 3. 내부 로직 호출
  return await createBlockInternal(validatedRequest);
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createBlockInternal(
  request: CreateBlockRequest  // 이미 검증됨
): Promise<ActionResult<BlockMountedDTO>> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }
    
    // 2. Value Objects 생성 (타입 안전 - 이미 검증됨)
    const userIdVO = new UserId(user.id);
    const pageIdVO = new PageId(request.pageId);
    const sizeVO = new Size(request.size.width, request.size.height);
    const positionVO = new Position(request.position.x, request.position.y);
    
    // 3. Command 생성
    const command: CreateAndMountBlockCommand = {
      blockType: request.blockType,
      workspaceId: request.workspaceId,
      pageId: pageIdVO,
      position: positionVO,
      size: sizeVO,
      userId: userIdVO.value,
    };
    
    // 4. Service 호출
    const blockMountService = new CanvasBlockMountService(/*...*/);
    const result = await blockMountService.createAndMountBlock(command);
    
    if (result.isError()) {
      return err(String(result.error), {
        code: 'BLOCK_CREATION_FAILED',
        meta: { originalError: result.error }
      });
    }
    
    const { mountAggregate, blockEntity } = result.value;
    
    // 5. Response DTO 생성
    const blockView: BlockMountedDTO = {
      // Mount 정보 (mountAggregate에서 추출)
      blockMountId: mountAggregate.blockMount.id.value,
      position: {
        x: mountAggregate.blockMount.position.x,
        y: mountAggregate.blockMount.position.y,
      },
      size: {
        width: mountAggregate.blockMount.size.width,
        height: mountAggregate.blockMount.size.height,
      },
      zOrder: mountAggregate.blockMount.zOrder.value,
      
      // Block 정보 (blockEntity에서 추출)
      blockId: blockEntity.id.value,
      blockType: blockEntity.blockType.value,
      properties: blockEntity.properties,
      customProperties: blockEntity.customProperties || [],
      
      // 메타데이터
      createdAt: blockEntity.createdAt.toISOString(),
      updatedAt: blockEntity.updatedAt.toISOString(),
      createdBy: blockEntity.createdBy,
    };
    
    // 6. 페이지 재검증
    if (request.orgId) {
      revalidatePath(
        `/r/${request.orgId}/workspace/${request.workspaceId}/page/${request.pageId}`
      );
    }
    
    return ok(blockView);
  } catch (error) {
    logger.error('[createBlockAction] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: { originalError: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}
```

### 6.2 Service Layer 패턴

```typescript
/**
 * Canvas Block Mount Service
 * 
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스 구현
 */
export class CanvasBlockMountService implements ICanvasBlockMountService {
  constructor(
    private blockManagementService: BlockManagementService,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   * 
   * @param command - 블럭 생성 및 마운트 Command
   * @returns BlockMountResult (성공) | Error (실패)
   */
  async createAndMountBlock(
    command: CreateAndMountBlockCommand
  ): Promise<Result<BlockMountResult, Error>> {
    try {
      // 1. Block Management Service를 통해 블럭 생성
      const blockEntity = await this.blockManagementService.createBlock({
        blockType: command.blockType,
        workspaceId: command.workspaceId,
        metadata: command.metadata || {},
        userId: command.userId, // userId = profileId (동일)
      });
      
      // 2. BlockMountAggregate 생성
      const blockIdVO = new BlockId(blockEntity.id.value);
      const blockMountId = new BlockMountId(crypto.randomUUID());
      
      const mountAggregate = BlockMountAggregate.mountBlock(
        blockMountId,
        command.pageId,
        blockIdVO,
        command.position,
        command.size
      );
      
      // 3. Repository에 저장
      await this.blockMountRepository.save(mountAggregate);
      
      return Result.success({ mountAggregate, blockEntity });
    } catch (error) {
      logger.error('[CanvasBlockMountService] Block creation failed:', error);
      return Result.error(new Error('Block creation and mounting failed'));
    }
  }
  
  // ⚠️ Design Decision: profiles.id = users.id
  // userId를 profileId로 사용 (변환 불필요)
  // const profileId = command.userId;
}

// Service 결과 타입 정의
export interface BlockMountResult {
  mountAggregate: BlockMountAggregate;  // 마운트 정보
  blockEntity: Block;                    // 블럭 엔티티
}
```

### 6.3 Repository Layer 패턴

```typescript
/**
 * Drizzle Block Repository
 * 
 * Block 엔티티의 영속화를 담당하는 Repository 구현
 */
export class DrizzleBlockRepository implements BlockRepository {
  constructor(private db: DrizzleDatabase) {}

  /**
   * Block 엔티티를 데이터베이스에 저장
   * 
   * @param block - 저장할 Block 엔티티
   */
  async save(block: Block): Promise<void> {
    const blockData = {
      id: block.id.value,                    // BlockId VO → string
      block_type: block.blockType.value,     // BlockType VO → string
      workspace_id: block.workspaceId.value, // WorkspaceId VO → string
      created_by: block.createdBy?.id,       // CreatedByProfile → string
      created_at: block.createdAt,           // Date → Date
      updated_at: block.updatedAt,           // Date → Date
      properties: block.properties,          // Record<string, any> → JSON
      custom_properties: block.customProperties, // Array → JSON
    };
    
    await this.db.insert(blocks).values(blockData);
  }

  /**
   * BlockId로 Block 엔티티 조회
   * 
   * @param blockId - 조회할 Block의 ID
   * @returns Block 엔티티 또는 null
   */
  async findById(blockId: BlockId): Promise<Block | null> {
    const result = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId.value))
      .limit(1);
    
    return result[0] ? this.toDomain(result[0]) : null;
  }
  
  /**
   * 데이터베이스 행을 Block 엔티티로 변환
   * 
   * @param row - 데이터베이스 행
   * @returns Block 엔티티
   */
  private toDomain(row: any): Block {
    return new Block(
      new BlockId(row.id),
      new BlockType(row.block_type),
      new WorkspaceId(row.workspace_id),
      row.properties,
      row.custom_properties || [],
      row.created_at,
      row.updated_at,
      row.created_by ? {
        id: row.created_by,
        name: row.profile_name,
        avatarUrl: row.profile_avatar_url
      } : undefined
    );
  }
}
```

---

## 7. Best Practices 요약

### 7.1 핵심 원칙

1. **Trust Boundary에서 검증**: Server Action에서만 `unknown` 사용
2. **내부는 강타입**: 검증 후에는 TypeScript 타입 시스템 신뢰
3. **명시적 변수명**: `mountAggregate`, `blockEntity` 등 명확한 의미
4. **도메인 중심 명명**: `BlockMountedDTO` vs `CreateBlockResponse`
5. **SSOT 활용**: `BlockView`를 중심으로 한 일관된 데이터 모델

### 7.2 검증 전략

- **Frontend**: UX 최적화를 위한 1차 검증
- **Server Action**: 보안을 위한 2차 검증 (필수)
- **내부 레이어**: 검증된 데이터만 처리

### 7.3 타입 전략

```typescript
// Trust Boundary
unknown → Zod.safeParse() → Strong Type

// 내부 레이어
Strong Type → Business Logic → Strong Type
```

이 컨벤션을 따르면 **보안성**, **타입 안전성**, **유지보수성**을 모두 확보할 수 있습니다.
