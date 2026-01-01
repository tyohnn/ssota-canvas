# Server-Side DDD 컨벤션 가이드

## 🎯 개요

이 문서는 서버 사이드에서 도메인 기반 개발(Domain-Driven Design)을 위한 명확한 컨벤션과 패턴을 정의합니다. 특히 **Trust Boundary**, **데이터 흐름**, **타입 안전성**에 중점을 둡니다.

**최근 업데이트**: 2025-12-31  
**버전**: v1.2

### 🔄 v1.2 변경사항 (Event Storming + DDD 통합)
- **Service Layer 패턴 수정**: SafeDTO를 입력으로 받아 Command로 변환
- **Aggregate 패턴 수정**: Command를 입력으로 받아 Domain Event 발생
- **Command-Event 1:1 대응**: Event Storming의 핵심 패턴 반영
- **명확한 책임 분리**: SafeDTO → Command → Event 흐름 표준화
- **SafeDTO 네이밍**: Trust Boundary 통과 후 검증된 데이터를 SafeDTO로 명명

### 🔄 v1.1 변경사항
- **Zod 스키마 정의**: `shared/schemas/` 디렉토리에 공유 스키마 추가
- **Profile Schema 단순화**: `profiles.id = users.id`로 변경하여 불필요한 변환 로직 제거
- **명시적 변수명**: `mountAggregate`, `blockEntity`로 서비스 반환값 명확화
- **Frontend 검증**: UX 최적화를 위한 1차 검증 로직 추가
- **Error Handling**: `error.issues` 사용으로 Zod 에러 처리 일관성 확보
- **SSOT 강화**: `blockTypeEnum.enumValues` 직접 사용으로 데이터베이스 스키마와 완전 동기화
- **도메인 간 재사용**: `block-management` 도메인의 `BlockType`, `getBlockSize` 재사용

---

## 0. Event Storming + DDD 통합 아키텍처

### 0.1 핵심 개념

이 문서는 **Event Storming**과 **Domain-Driven Design (DDD)**을 통합한 아키텍처를 정의합니다.

#### **Event Storming이란?**
- 비즈니스 프로세스를 **Command**, **Event**, **Aggregate**로 모델링하는 워크샵 기법
- **Command**: 시스템에 무언가를 하라고 명령 (예: `CreateEdge`, `UpdateBlockPosition`)
- **Event**: 시스템에서 일어난 과거의 사실 (예: `EdgeCreated`, `BlockPositionUpdated`)
- **Aggregate**: Command를 처리하고 Event를 발생시키는 도메인 객체

#### **DDD와의 통합**
- **Service Layer**: DTO를 Command로 변환하는 변환기
- **Aggregate**: Command Handler 역할 수행
- **Command ↔ Event**: 1:1 대응 관계 유지
- **Event Sourcing 준비**: Domain Event 기반 아키텍처로 Event Sourcing 전환 가능

### 0.2 데이터 흐름 (전체 그림)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  • React Hook: useCreateEdge()                                   │
│  • Form Data → DTO                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │ CreateEdgeRequest (DTO)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Trust Boundary                              │
│  Server Action: createEdgeAction(unknown)                        │
│  • Zod 검증: unknown → CreateEdgeRequest (Validated DTO)         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ CreateEdgeRequest (Validated DTO)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Internal Function                           │
│  • 인증 확인 (Supabase Auth)                                     │
│  • 권한 검증                                                      │
│  • DTO + userId                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ CreateEdgeRequest (DTO + userId)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  CanvasEdgeService.createEdge(dto)                               │
│  1. 비즈니스 검증 (BlockMount 존재 확인)                         │
│  2. DTO → Command 변환                                           │
│     • Value Objects 생성 (PageId, BlockMountId, EdgeShape)       │
│     • CreateEdgeCommand 생성                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ CreateEdgeCommand
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Aggregate Layer                             │
│  EdgeAggregate.createEdge(command)                               │
│  1. 비즈니스 로직 수행                                           │
│  2. Aggregate 생성                                               │
│  3. Domain Event 발생                                            │
│     • EdgeCreatedEvent (Command → Event 1:1)                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ EdgeAggregate + EdgeCreatedEvent
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Repository Layer                            │
│  EdgeRepository.create(aggregate)                                │
│  • Aggregate → Database Row                                      │
│  • Event 처리 (로깅, 알림, 캐시 등)                             │
│  • Event 커밋                                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
                          Database
```

### 0.3 핵심 원칙

| 레이어 | 입력 | 출력 | 책임 |
|--------|------|------|------|
| **Server Action** | `unknown` | `SafeDTO` | Trust Boundary: Zod 검증 |
| **Internal Function** | `SafeDTO` | `SafeDTO + Auth` | 인증/권한 확인 |
| **Service** | `SafeDTO` | `Command` | SafeDTO → Command 변환 (VO 생성) |
| **Aggregate** | `Command` | `Event` | 비즈니스 로직 + Event 발생 |
| **Repository** | `Aggregate/Entity` | `Database Row` | 영속화 + Event 처리 |

### 0.4 왜 이 패턴인가?

#### **1. 명확한 책임 분리**
- 각 레이어가 하나의 명확한 책임을 가짐
- Service는 변환만, Aggregate는 비즈니스 로직만

#### **2. Event Sourcing 준비**
- Domain Event 기반 아키텍처
- 필요시 Event Store로 쉽게 전환 가능

#### **3. 테스트 용이성**
- Command → Event 흐름이 명확하여 테스트 작성 용이
- Mock이 필요한 부분이 명확히 구분됨

#### **4. 비즈니스 프로세스 가시성**
- Command와 Event 이름만으로 비즈니스 프로세스 이해 가능
- Event Storming 워크샵 결과가 코드로 직접 반영됨

#### **5. 확장성**
- Event 기반 아키텍처로 CQRS, Event Sourcing 등으로 쉽게 확장
- Saga Pattern 적용 가능

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
  
  // ✅ 이제부터는 신뢰할 수 있음 (SafeDTO)
  const safeDto = parseResult.data;  // type: CreateBlockRequest (SafeDTO)
  return await createBlockInternal(safeDto);
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
// ✅ Good: SafeDTO를 Service에 전달 (Service가 Command 변환 담당)
async function createBlockInternal(
  safeDto: CreateBlockRequest  // ✅ 검증된 SafeDTO
): Promise<ActionResult<BlockMountedDTO>> {
  // 인증, 권한 확인 등
  const user = await getCurrentUser();
  
  // SafeDTO에 userId 추가
  const enrichedDto: CreateBlockRequest = {
    ...safeDto,
    userId: user.id,
  };
  
  // ✅ Service에 SafeDTO 전달 (Service가 SafeDTO → Command 변환)
  return await blockMountService.createAndMountBlock(enrichedDto);
}

// ❌ Bad: 내부에서 Command 생성
async function createBlockInternal(
  safeDto: CreateBlockRequest
): Promise<ActionResult<BlockMountedDTO>> {
  // ❌ Internal Function에서 Command 생성하면 안됨
  const command: CreateAndMountBlockCommand = {
    blockType: safeDto.blockType,
    pageId: new PageId(safeDto.pageId),  // VO 생성
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

## 2. 레이어 이동 패턴 (Event Storming + DDD)

### 2.1 데이터 흐름 아키텍처

```
Frontend (UI State)
    ↓ CreateBlockRequest (DTO - Untrusted)
Server Action (unknown + Zod)
    ↓ CreateBlockRequest (SafeDTO - Validated & Trusted)
Internal Function (SafeDTO)
    ↓ CreateBlockRequest (SafeDTO)
Service Layer (SafeDTO → Command)
    ↓ CreateAndMountBlockCommand (Command)
Aggregate (Command → Event)
    ↓ BlockMountedEvent (Domain Event)
Repository (Event 기반 영속화)
    ↓ Database Row (Primitive)
Database
```

### 2.2 계층별 책임

| 계층 | 입력 | 처리 | 출력 | 타입 전략 |
|------|------|------|------|----------|
| **Server Action** | `unknown` | Zod 검증 | `SafeDTO` (검증됨) | `unknown` + 검증 |
| **Internal Function** | `SafeDTO` | 인증/권한 확인 | `SafeDTO` | Strong Type |
| **Service Layer** | `SafeDTO` | SafeDTO → Command 변환 | `Command` | Strong Type |
| **Aggregate** | `Command` | 비즈니스 로직 + Event 발생 | `Domain Event` | Strong Type |
| **Repository Layer** | `Aggregate/Entity` | Event 기반 영속화 | Database Row | Strong Type |
| **Domain Layer** | `Value Objects` | 도메인 규칙 | `Entity` | Strong Type |

### 2.3 핵심 원칙 (Event Storming + DDD)

#### **용어 정의**
- **DTO**: Data Transfer Object - 클라이언트에서 서버로 전송되는 데이터 (Trust Boundary 이전)
- **SafeDTO**: Validated DTO - Zod 검증을 통과한 신뢰할 수 있는 데이터 (Trust Boundary 이후)
- **Command**: 비즈니스 의도를 담은 객체, Value Objects 포함
- **Event**: 시스템에서 발생한 과거의 사실

#### **1. Service = SafeDTO to Command Transformer**
```typescript
// ✅ Service는 SafeDTO를 입력으로 받음
async createEdge(safeDto: CreateEdgeRequest): Promise<Result<EdgeAggregate, Error>> {
  // 1. SafeDTO → Command 변환 (Value Objects 생성 포함)
  const command: CreateEdgeCommand = {
    pageId: new PageId(safeDto.pageId),
    sourceBlockMountId: new BlockMountId(safeDto.sourceBlockMountId),
    targetBlockMountId: new BlockMountId(safeDto.targetBlockMountId),
    edgeShape: safeDto.edgeShape ? new EdgeShape(safeDto.edgeShape) : undefined,
    sourceHandle: safeDto.sourceHandle,
    targetHandle: safeDto.targetHandle,
    userId: safeDto.userId,
  };
  
  // 2. Aggregate에 Command 전달
  const aggregate = EdgeAggregate.createEdge(command);
  
  // 3. Domain Event 처리
  const events = aggregate.getUncommittedEvents();
  await this.handleDomainEvents(events);
  
  return Result.success(aggregate);
}
```

#### **2. Aggregate = Command Handler**
```typescript
// ✅ Aggregate는 Command를 입력으로 받아 Event를 발생
class EdgeAggregate {
  static createEdge(command: CreateEdgeCommand): EdgeAggregate {
    const edgeId = EdgeId.generate();
    
    // Aggregate 생성
    const aggregate = new EdgeAggregate(
      edgeId,
      command.pageId,
      command.sourceBlockMountId,
      command.targetBlockMountId,
      command.edgeShape,
      command.sourceHandle,
      command.targetHandle
    );
    
    // Domain Event 발생 (1 Command → 1 Event)
    aggregate.addDomainEvent(
      new EdgeCreatedEvent({
        edgeId: edgeId.value,
        pageId: command.pageId.value,
        sourceBlockMountId: command.sourceBlockMountId.value,
        targetBlockMountId: command.targetBlockMountId.value,
        edgeShape: command.edgeShape?.value,
        sourceHandle: command.sourceHandle,
        targetHandle: command.targetHandle,
        occurredAt: new Date(),
      })
    );
    
    return aggregate;
  }
}
```

#### **3. Command ↔ Event 1:1 대응**
```typescript
// Command
interface CreateEdgeCommand {
  pageId: PageId;
  sourceBlockMountId: BlockMountId;
  targetBlockMountId: BlockMountId;
  edgeShape?: EdgeShape;
  sourceHandle?: string;
  targetHandle?: string;
  userId: string;
}

// Event (Command와 1:1 대응)
interface EdgeCreatedEvent {
  edgeId: string;
  pageId: string;
  sourceBlockMountId: string;
  targetBlockMountId: string;
  edgeShape?: string;
  sourceHandle?: string;
  targetHandle?: string;
  occurredAt: Date;
}
```

### 2.4 레이어 간 데이터 변환 (올바른 흐름)

```typescript
// 1. Server Action → Internal Function (SafeDTO 전달)
async function createBlockInternal(
  safeDto: CreateBlockRequest  // SafeDTO (검증됨)
): Promise<ActionResult<BlockMountedDTO>> {
  // 인증, 권한 확인 등
  // ...
  
  // 2. Internal Function → Service (SafeDTO 전달)
  const result = await blockMountService.createAndMountBlock(safeDto);
  // ...
}

// 3. Service Layer (SafeDTO → Command 변환)
async createAndMountBlock(
  safeDto: CreateBlockRequest  // SafeDTO 입력
): Promise<Result<BlockMountResult, Error>> {
  // SafeDTO를 Command로 변환 (Value Objects 생성)
  const command: CreateAndMountBlockCommand = {
    blockType: safeDto.blockType,
    workspaceId: safeDto.workspaceId,
    pageId: new PageId(safeDto.pageId),           // VO 생성
    position: new Position(safeDto.position.x, safeDto.position.y),  // VO 생성
    size: new Size(safeDto.size.width, safeDto.size.height),        // VO 생성
    userId: safeDto.userId,
    metadata: safeDto.metadata,
  };
  
  // 4. Service → Aggregate (Command 전달)
  const aggregate = BlockMountAggregate.create(command);
  
  // 5. Aggregate에서 Domain Event 처리
  const events = aggregate.getUncommittedEvents();
  await this.handleDomainEvents(events);
  
  return Result.success({ aggregate });
}

// 6. Aggregate (Command → Event)
static create(command: CreateAndMountBlockCommand): BlockMountAggregate {
  const aggregate = new BlockMountAggregate(/* ... */);
  
  // Domain Event 발생
  aggregate.addDomainEvent(
    new BlockMountedEvent({
      blockMountId: aggregate.id.value,
      pageId: command.pageId.value,
      blockId: command.blockId.value,
      position: { x: command.position.x, y: command.position.y },
      size: { width: command.size.width, height: command.size.height },
      occurredAt: new Date(),
    })
  );
  
  return aggregate;
}

// 7. Repository → Database (Event 기반 영속화)
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

### 3.2 Command (비즈니스 의도) & Event (비즈니스 결과)

#### **Command 정의**
```typescript
// shared/commands/edge.commands.ts
/**
 * Edge 생성 Command
 * 
 * - Aggregate에 "Edge를 생성하라"는 의도 전달
 * - Value Objects 포함 (Service에서 생성)
 * - 비즈니스 검증은 Aggregate에서 수행
 */
export interface CreateEdgeCommand {
  pageId: PageId;                    // Value Object
  sourceBlockMountId: BlockMountId;  // Value Object
  targetBlockMountId: BlockMountId;  // Value Object
  edgeShape?: EdgeShape;             // Value Object (optional)
  sourceHandle?: string;             // Primitive
  targetHandle?: string;             // Primitive
  userId: string;                    // Primitive
}

/**
 * Edge 모양 업데이트 Command
 */
export interface UpdateEdgeShapeCommand {
  edgeId: EdgeId;
  oldShape: EdgeShape;
  newShape: EdgeShape;
  userId: string;
}
```

#### **Event 정의 (Command와 1:1 대응)**
```typescript
// shared/events/edge.events.ts
/**
 * Edge 생성됨 Event
 * 
 * - CreateEdgeCommand 처리 결과
 * - 과거형 명명 ("~했다", "~됨")
 * - 시스템에서 일어난 불변의 사실
 */
export interface EdgeCreatedEvent {
  edgeId: string;                // 생성된 Edge ID
  pageId: string;
  sourceBlockMountId: string;
  targetBlockMountId: string;
  edgeShape?: string;
  sourceHandle?: string;
  targetHandle?: string;
  occurredAt: Date;              // ⚠️ 필수: Event 발생 시각
}

/**
 * Edge 모양 업데이트됨 Event
 */
export interface EdgeShapeUpdatedEvent {
  edgeId: string;
  oldShape: string;
  newShape: string;
  occurredAt: Date;
}
```

#### **Command-Event 매핑 표**

| Command | Event | 설명 |
|---------|-------|------|
| `CreateEdgeCommand` | `EdgeCreatedEvent` | Edge 생성 |
| `UpdateEdgeShapeCommand` | `EdgeShapeUpdatedEvent` | Edge 모양 변경 |
| `UpdateEdgeLabelCommand` | `EdgeLabelUpdatedEvent` | Edge 라벨 변경 |
| `DeleteEdgeCommand` | `EdgeDeletedEvent` | Edge 삭제 |
| `CreateAndMountBlockCommand` | `BlockMountedEvent` | Block 마운트 |
| `UpdateBlockPositionCommand` | `BlockPositionUpdatedEvent` | Block 위치 변경 |

#### **Command 클래스 (선택적)**
```typescript
// shared/commands/block.commands.ts
/**
 * Command를 클래스로 정의할 경우
 * 
 * 장점:
 * - 생성 시점에 검증 수행
 * - 불변성 보장
 * - 타입 안전성 강화
 * 
 * 단점:
 * - 보일러플레이트 증가
 * - Interface로도 충분할 수 있음
 */
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

#### **Event 명명 규칙**

1. **과거형 사용**: `EdgeCreated` (O) vs `CreateEdge` (X)
2. **명사 + 과거분사**: `Block` + `Mounted` = `BlockMounted`
3. **명확한 의미**: 무슨 일이 일어났는지 명확히
4. **Domain 용어 사용**: 기술 용어보다 비즈니스 용어

```typescript
// ✅ Good
EdgeCreatedEvent
BlockPositionUpdatedEvent
UserRegisteredEvent
OrderPlacedEvent

// ❌ Bad
CreateEdgeEvent          // 현재형
EdgeCreateEvent          // 어색한 순서
NewEdgeEvent            // 모호함
EdgeEvent               // 너무 일반적
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

### 3.5 Aggregates (Command Handler + Event Source)

```typescript
// shared/aggregates/block-mount.aggregate.ts
export class BlockMountAggregate {
  private uncommittedEvents: DomainEvent[] = [];
  
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
  
  /**
   * ✅ Aggregate 팩토리 메서드: Command를 입력으로 받음
   * Command 처리 후 Domain Event 발생
   */
  static create(command: CreateAndMountBlockCommand): BlockMountAggregate {
    // 1. Aggregate 생성
    const blockMountId = new BlockMountId(crypto.randomUUID());
    const blockMount = new BlockMount(
      blockMountId,
      command.pageId,
      command.blockId,
      command.position,
      command.size
    );
    
    const aggregate = new BlockMountAggregate(blockMount, command.block);
    
    // 2. Domain Event 발생 (Command → Event 1:1 대응)
    aggregate.addDomainEvent(
      new BlockMountedEvent({
        blockMountId: blockMountId.value,
        pageId: command.pageId.value,
        blockId: command.blockId.value,
        position: {
          x: command.position.x,
          y: command.position.y,
        },
        size: {
          width: command.size.width,
          height: command.size.height,
        },
        occurredAt: new Date(),
      })
    );
    
    return aggregate;
  }
  
  /**
   * ✅ Command Handler: Command를 입력으로 받아 상태 변경 + Event 발생
   */
  updatePosition(command: UpdateBlockPositionCommand): void {
    // 1. 비즈니스 로직 수행
    this.blockMount.updatePosition(command.newPosition);
    
    // 2. Domain Event 발생 (Command → Event 1:1 대응)
    this.addDomainEvent(
      new BlockPositionUpdatedEvent({
        blockMountId: this.blockMount.id.value,
        oldPosition: command.oldPosition,
        newPosition: command.newPosition,
        occurredAt: new Date(),
      })
    );
  }
  
  /**
   * Domain Event 관리
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }
  
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }
  
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}

/**
 * Domain Event 정의
 */
export interface BlockMountedEvent {
  blockMountId: string;
  pageId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  occurredAt: Date;
}

export interface BlockPositionUpdatedEvent {
  blockMountId: string;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
  occurredAt: Date;
}
```

#### **Aggregate 패턴 핵심 원칙**

1. **Command를 입력으로 받음**: 개별 파라미터가 아닌 Command 객체
2. **Domain Event를 발생**: Command 처리 결과를 Event로 표현
3. **1 Command : 1 Event**: Event Storming의 핵심 대응 관계
4. **일관성 보장**: Aggregate 내부 상태의 일관성 유지

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
  safeDto: CreateBlockRequest  // SafeDTO (이미 검증됨)
): Promise<ActionResult<BlockMountedDTO>> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return err('Unauthorized', { code: 'UNAUTHORIZED' });
    }
    
    // 2. SafeDTO에 userId 추가 (인증된 사용자)
    const enrichedDto: CreateBlockRequest = {
      ...safeDto,
      userId: user.id,  // 인증된 사용자 ID 추가
    };
    
    // 3. Service 호출 (SafeDTO 전달)
    // ✅ Service가 SafeDTO → Command 변환을 담당
    const blockMountService = new CanvasBlockMountService(/*...*/);
    const result = await blockMountService.createAndMountBlock(enrichedDto);
    
    if (result.isError()) {
      return err(String(result.error), {
        code: 'BLOCK_CREATION_FAILED',
        meta: { originalError: result.error }
      });
    }
    
    const { mountAggregate, blockEntity } = result.value;
    
    // 4. Response DTO 생성
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
    
    // 5. 페이지 재검증
    if (safeDto.orgId) {
      revalidatePath(
        `/r/${safeDto.orgId}/workspace/${safeDto.workspaceId}/page/${safeDto.pageId}`
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

/**
 * ✅ 핵심 패턴 정리
 * 
 * 1. Server Action: unknown → SafeDTO (Zod 검증)
 * 2. Internal Function: SafeDTO + 인증 → SafeDTO (userId 추가)
 * 3. Service: SafeDTO → Command (Value Objects 생성)
 * 4. Aggregate: Command → Event (Domain Event 발생)
 * 5. Repository: Aggregate → Database (영속화)
 */
```

#### 6.1.1 이중 보안 레이어 패턴 (기본 방식)

Server Actions는 **Defense in Depth** 전략을 사용하여 여러 보안 레이어를 거칩니다:

```
┌─────────────────────────────────────────┐
│  Layer 1: Runtime Validation (Zod)      │
│    unknown → Validated Type             │
├─────────────────────────────────────────┤
│  Layer 2: Authentication (Supabase)     │
│    Verify User Session                  │
├─────────────────────────────────────────┤
│  Layer 3: Authorization (Page-based)    │
│    Check Organization/Workspace Access  │
├─────────────────────────────────────────┤
│  Layer 4: Business Logic (Internal)     │
│    Execute Safe Operation               │
└─────────────────────────────────────────┘
```

**기본 구현 패턴:**

```typescript
/**
 * 엣지 생성 Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. 조직 멤버십 확인
 * 4. 워크스페이스 접근 권한 확인
 */
export async function createEdgeAction(
  request: unknown // ⚠️ 외부 입력 - 신뢰하지 않음
): Promise<ActionResult<EdgeView>> {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ Layer 1: Runtime Validation (필수)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const parseResult = CreateEdgeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createEdgeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      meta: { errors: parseResult.error.issues },
    });
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedRequest = parseResult.data; // type: CreateEdgeRequest

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ Layer 2: Authentication & Authorization
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    // 2-1. 인증 확인
    const authenticatedUser = await getAuthenticatedUser();

    // 2-2. 권한 확인
    const accessResult = await verifyAccessByPageId(
      validatedRequest.pageId,
      authenticatedUser.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: authenticatedUser.id,
        pageId: validatedRequest.pageId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ All Security Checks Passed - Execute Handler
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return await createEdgeInternal(validatedRequest);
  } catch (error) {
    console.error('[createEdgeAction] Authentication error:', error);

    return err(
      error instanceof Error ? error.message : 'Authentication failed',
      {
        code: 'UNAUTHORIZED',
      }
    );
  }
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createEdgeInternal(
  safeDto: CreateEdgeRequest // ✅ 이미 검증됨 (SafeDTO)
): Promise<ActionResult<EdgeView>> {
  // 비즈니스 로직만 구현
  // ...
}
```

**장점:**
- ✅ 명시적이고 명확한 보안 검증 흐름
- ✅ 각 레이어의 책임이 분리되어 있음
- ✅ 디버깅 시 스택 트레이스가 명확함

**단점:**
- ⚠️ 여러 Action에서 동일한 보안 로직이 반복됨
- ⚠️ 보안 정책 변경 시 모든 Action 수정 필요
- ⚠️ 코드 중복으로 인한 유지보수 부담

#### 6.1.2 이중 보안 레이어 패턴 (HOF 방식) ⭐️ 새로운 패턴

**Higher-Order Function (HOF)**을 사용하여 보안 레이어를 추상화하는 패턴입니다.

**HOF 유틸리티:**

```typescript
// actions/edge/with-secure-action.ts
import { z } from 'zod';
import { getAuthErrorMessage } from '@/domains/common/auth/error';
import { getAuthenticatedUser, verifyAccessByPageId } from '@/domains/common/auth/helpers';
import { ActionResult, err } from '@/lib/action-result';

/**
 * Higher-Order Function: Secure Action Wrapper
 *
 * Defense in Depth 보안 레이어를 자동으로 적용하는 HOF
 *
 * 적용되는 보안 레이어:
 * 1. Runtime Validation (Zod 스키마 검증)
 * 2. User Authentication (Supabase Auth)
 * 3. Access Control (Page-based permissions)
 */
export function withSecureAction<TRequest, TResponse>(
  schema: z.ZodSchema<TRequest>,
  options: {
    /**
     * pageId 추출 함수
     * - Direct: request에서 직접 추출 (예: req.pageId)
     * - Indirect: 비동기 조회로 추출 (예: Edge 조회 후 pageId 가져오기)
     */
    getPageId: (
      request: TRequest
    ) => string | Promise<string | { pageId: string; notFoundError?: string }>;

    /**
     * Action 이름 (로깅용)
     */
    actionName: string;

    /**
     * 추가 로그 메타데이터 추출 (선택사항)
     */
    getLogMetadata?: (request: TRequest) => Record<string, unknown>;
  },
  handler: (validatedRequest: TRequest) => Promise<ActionResult<TResponse>>
): (request: unknown) => Promise<ActionResult<TResponse>> {
  return async (request: unknown): Promise<ActionResult<TResponse>> => {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ Layer 1: Runtime Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const parseResult = schema.safeParse(request);

    if (!parseResult.success) {
      console.warn(`[Security] Invalid request to ${options.actionName}`, {
        errors: parseResult.error.issues,
        timestamp: new Date().toISOString(),
      });

      return err('Invalid request data', {
        code: 'INVALID_REQUEST',
        meta: { errors: parseResult.error.issues },
      });
    }

    const validatedRequest = parseResult.data;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ Layer 2: Authentication & Authorization
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      // 2-1. 인증 확인
      const authenticatedUser = await getAuthenticatedUser();

      // 2-2. pageId 추출 (Direct or Indirect)
      const pageIdResult = await options.getPageId(validatedRequest);

      let pageId: string;
      if (typeof pageIdResult === 'string') {
        pageId = pageIdResult;
      } else {
        // Indirect 방식에서 Entity Not Found 처리
        if (!pageIdResult.pageId) {
          return err(pageIdResult.notFoundError || 'Resource not found', {
            code: 'RESOURCE_NOT_FOUND',
          });
        }
        pageId = pageIdResult.pageId;
      }

      // 2-3. 권한 확인
      const accessResult = await verifyAccessByPageId(
        pageId,
        authenticatedUser.id
      );

      if (!accessResult.success) {
        const logMetadata = options.getLogMetadata
          ? options.getLogMetadata(validatedRequest)
          : {};

        console.warn('[Security] Access denied', {
          userId: authenticatedUser.id,
          pageId,
          error: accessResult.error,
          ...logMetadata,
        });

        return err(getAuthErrorMessage(accessResult.error), {
          code: accessResult.error || 'ACCESS_DENIED',
        });
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ All Security Checks Passed - Execute Handler
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      return await handler(validatedRequest);
    } catch (error) {
      console.error(`[${options.actionName}] Authentication error:`, error);

      return err(
        error instanceof Error ? error.message : 'Authentication failed',
        {
          code: 'UNAUTHORIZED',
        }
      );
    }
  };
}
```

**HOF 패턴 사용 예시:**

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ Direct Access: pageId가 request에 직접 있는 경우
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const createEdgeAction = withSecureAction(
  CreateEdgeRequestSchema,
  {
    getPageId: req => req.pageId, // ✅ Direct
    actionName: 'createEdgeAction',
    getLogMetadata: req => ({ pageId: req.pageId }),
  },
  createEdgeInternal
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ Indirect Access: Entity 조회 후 pageId 추출
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const updateEdgeLabelAction = withSecureAction(
  UpdateEdgeLabelRequestSchema,
  {
    getPageId: async req => {
      // Edge 조회하여 pageId 얻기 (Indirect access)
      const edgeRepository = new DrizzleEdgeRepository();
      const edgeIdVO = new EdgeId(req.edgeId);
      const edgeAggregate = await edgeRepository.findById(edgeIdVO);

      if (!edgeAggregate) {
        return { pageId: '', notFoundError: 'Edge not found' };
      }

      return edgeAggregate.edge.pageId.value;
    },
    actionName: 'updateEdgeLabelAction',
    getLogMetadata: req => ({ edgeId: req.edgeId }),
  },
  updateEdgeLabelInternal
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 */
async function createEdgeInternal(
  safeDto: CreateEdgeRequest // ✅ 이미 검증됨 (SafeDTO)
): Promise<ActionResult<EdgeView>> {
  // 비즈니스 로직만 구현
  // ...
}
```

**Before & After 비교:**

| 항목 | 기본 방식 | HOF 방식 | 개선 |
|------|----------|---------|------|
| **코드 줄 수** | ~162줄 | ~100줄 | **-38%** |
| **중복 보안 코드** | ~500줄 (5개 파일) | 0줄 | **-100%** |
| **유지보수 포인트** | 5개 파일 | 1개 파일 (HOF) | **-80%** |
| **보안 정책 변경** | 5곳 수정 | 1곳 수정 | **5배 빠름** |

**HOF 패턴의 장점:**

1. **DRY (Don't Repeat Yourself)**
   - 보안 로직을 한 곳에서 관리
   - 모든 Action에 일관되게 적용

2. **Type Safety**
   - TypeScript 제네릭으로 타입 안전성 보장
   - Validated type이 handler까지 전파

3. **Separation of Concerns**
   - 보안 로직 ↔ 비즈니스 로직 명확히 분리
   - 각 레이어의 책임 명확화

4. **Maintainability**
   - 보안 정책 변경 시 HOF만 수정
   - 모든 Actions에 자동 반영

5. **Testability**
   - HOF는 한 번만 테스트
   - Internal handler는 순수 함수로 테스트 용이

**HOF 패턴의 단점:**

1. **추가 추상화 레이어**
   - 러닝 커브 존재
   - 디버깅 시 스택 트레이스 한 단계 증가

**언제 어떤 패턴을 사용할까?**

- **기본 방식**: 간단한 Action, 보안 로직이 Action마다 다를 때
- **HOF 방식**: 여러 Action에서 동일한 보안 정책을 사용할 때, 보안 정책이 자주 변경될 때

**관련 패턴:**
- **Middleware Pattern**: Express.js, Koa.js의 미들웨어와 유사
- **Decorator Pattern**: 함수를 감싸서 기능 추가
- **Chain of Responsibility**: 여러 보안 검증을 순차적으로 실행

### 6.2 Service Layer 패턴 (SafeDTO → Command → Aggregate)

```typescript
/**
 * Canvas Block Mount Service
 * 
 * ✅ Service는 SafeDTO를 입력으로 받아 Command로 변환하고 Aggregate에 전달
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
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns BlockMountResult (성공) | Error (실패)
   */
  async createAndMountBlock(
    safeDto: CreateBlockRequest  // ✅ SafeDTO 입력
  ): Promise<Result<BlockMountResult, Error>> {
    try {
      // 1. Block Management Service를 통해 블럭 생성
      const blockEntity = await this.blockManagementService.createBlock({
        blockType: safeDto.blockType,
        workspaceId: safeDto.workspaceId,
        metadata: {},
        userId: safeDto.userId,
      });
      
      // 2. SafeDTO → Command 변환 (Value Objects 생성)
      const command: CreateAndMountBlockCommand = {
        blockType: safeDto.blockType,
        workspaceId: safeDto.workspaceId,
        pageId: new PageId(safeDto.pageId),
        blockId: new BlockId(blockEntity.id.value),
        position: new Position(safeDto.position.x, safeDto.position.y),
        size: new Size(safeDto.size.width, safeDto.size.height),
        userId: safeDto.userId,
        block: blockEntity,  // Block Entity 포함
      };
      
      // 3. Aggregate에 Command 전달 (Command → Event)
      const mountAggregate = BlockMountAggregate.create(command);
      
      // 4. Repository에 저장
      await this.blockMountRepository.save(mountAggregate);
      
      // 5. Domain Event 처리
      const events = mountAggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);
      
      // 6. Event 커밋
      mountAggregate.markEventsAsCommitted();
      
      return Result.success({ mountAggregate, blockEntity });
    } catch (error) {
      logger.error('[CanvasBlockMountService] Block creation failed:', error);
      return Result.error(new Error('Block creation and mounting failed'));
    }
  }
  
  /**
   * Domain Event 처리
   */
  private async handleDomainEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      // Event에 따른 부가 작업 수행
      // 예: 캐시 업데이트, 알림 발송, 외부 시스템 연동 등
      logger.info('[DomainEvent]', event);
    }
  }
}

// Service 결과 타입 정의
export interface BlockMountResult {
  mountAggregate: BlockMountAggregate;  // 마운트 정보
  blockEntity: Block;                    // 블럭 엔티티
}

/**
 * ✅ 핵심 패턴 정리
 * 
 * 1. Service 입력: SafeDTO (검증된 데이터)
 * 2. Service 처리: SafeDTO → Command 변환 (Value Objects 생성)
 * 3. Aggregate 호출: Command 전달
 * 4. Aggregate 처리: Command → Domain Event 발생
 * 5. Event 처리: 부가 작업 수행
 * 6. Event 커밋: Aggregate 상태 정리
 */
```

#### **Edge 생성 Service 예시**

```typescript
export class CanvasEdgeService implements ICanvasEdgeService {
  constructor(
    private edgeRepository: EdgeRepository,
    private blockMountRepository: BlockMountRepository
  ) {}

  /**
   * Edge 생성 메서드
   * 
   * @param safeDto - 검증된 SafeDTO
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  async createEdge(
    safeDto: CreateEdgeRequest  // ✅ SafeDTO 입력
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 비즈니스 검증 (BlockMount 존재 확인)
      const sourceMount = await this.blockMountRepository.findById(
        new BlockMountId(safeDto.sourceBlockMountId)
      );
      const targetMount = await this.blockMountRepository.findById(
        new BlockMountId(safeDto.targetBlockMountId)
      );
      
      if (!sourceMount || !targetMount) {
        return Result.error(new Error('BlockMount not found'));
      }
      
      // 2. SafeDTO → Command 변환 (Value Objects 생성)
      const command: CreateEdgeCommand = {
        pageId: new PageId(safeDto.pageId),
        sourceBlockMountId: new BlockMountId(safeDto.sourceBlockMountId),
        targetBlockMountId: new BlockMountId(safeDto.targetBlockMountId),
        edgeShape: safeDto.edgeShape ? new EdgeShape(safeDto.edgeShape) : undefined,
        sourceHandle: safeDto.sourceHandle,
        targetHandle: safeDto.targetHandle,
        userId: safeDto.userId,
      };
      
      // 3. Aggregate에 Command 전달 (Command → Event)
      const aggregate = EdgeAggregate.createEdge(command);
      
      // 4. Repository에 저장
      await this.edgeRepository.create(aggregate);
      
      // 5. Domain Event 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);
      
      // 6. Event 커밋
      aggregate.markEventsAsCommitted();
      
      return Result.success(aggregate);
    } catch (error) {
      logger.error('[CanvasEdgeService] Edge creation failed:', error);
      return Result.error(error);
    }
  }
  
  private async handleDomainEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      logger.info('[DomainEvent]', event);
      // Event별 처리 로직
    }
  }
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

### 7.1 핵심 원칙 (Event Storming + DDD)

1. **Trust Boundary에서 검증**: Server Action에서만 `unknown` 사용
2. **내부는 강타입**: 검증 후에는 TypeScript 타입 시스템 신뢰
3. **명시적 변수명**: `mountAggregate`, `blockEntity` 등 명확한 의미
4. **도메인 중심 명명**: `BlockMountedDTO` vs `CreateBlockResponse`
5. **SSOT 활용**: `BlockView`를 중심으로 한 일관된 데이터 모델
6. **Service = DTO to Command**: Service는 DTO를 받아 Command로 변환
7. **Aggregate = Command Handler**: Aggregate는 Command를 받아 Event 발생
8. **Command ↔ Event 1:1**: 명확한 대응 관계 유지

### 7.2 검증 전략

- **Frontend**: UX 최적화를 위한 1차 검증
- **Server Action**: 보안을 위한 2차 검증 (필수)
- **내부 레이어**: 검증된 데이터만 처리

### 7.3 데이터 흐름 전략

```typescript
// Trust Boundary (Server Action)
unknown → Zod.safeParse() → SafeDTO (Validated & Trusted)

// Internal Function
SafeDTO → SafeDTO + Auth (userId 추가)

// Service Layer
SafeDTO → Command (with Value Objects)

// Aggregate Layer
Command → Domain Event

// Repository Layer
Aggregate/Event → Database
```

### 7.4 Event Storming + DDD 통합 체크리스트

#### ✅ Service Layer
- [ ] SafeDTO를 입력으로 받는가?
- [ ] SafeDTO → Command 변환을 수행하는가?
- [ ] Value Objects를 생성하는가?
- [ ] Aggregate에 Command를 전달하는가?
- [ ] Domain Event를 처리하는가?

#### ✅ Aggregate Layer
- [ ] Command를 입력으로 받는가?
- [ ] 비즈니스 로직을 수행하는가?
- [ ] Domain Event를 발생시키는가?
- [ ] 1 Command : 1 Event 대응을 유지하는가?
- [ ] Event 목록을 관리하는가? (`getUncommittedEvents()`)

#### ✅ Command & Event
- [ ] Command는 의도를 명확히 표현하는가?
- [ ] Event는 과거형으로 명명되어 있는가? (`EdgeCreated`, `BlockMounted`)
- [ ] Command와 Event가 1:1 대응되는가?
- [ ] Event에 `occurredAt` 타임스탬프가 포함되어 있는가?

### 7.5 안티패턴 (피해야 할 것들)

#### ❌ Service에 Command를 직접 전달
```typescript
// ❌ Bad: Server Action 또는 Internal Function에서 Command 생성
const command: CreateEdgeCommand = {
  pageId: new PageId(safeDto.pageId),
  // ...
};
await service.createEdge(command);  // Service가 Command를 받음

// ✅ Good: Service에 SafeDTO 전달
await service.createEdge(safeDto);  // Service가 SafeDTO를 받아 Command로 변환
```

#### ❌ Aggregate에 개별 파라미터 전달
```typescript
// ❌ Bad: 개별 파라미터 전달
const aggregate = EdgeAggregate.createEdge(
  edgeId,
  pageId,
  sourceId,
  targetId,
  shape
);

// ✅ Good: Command 전달
const aggregate = EdgeAggregate.createEdge(command);
```

#### ❌ Event 없이 상태 변경
```typescript
// ❌ Bad: Event 발생 없이 상태만 변경
updatePosition(newPosition: Position): void {
  this.position = newPosition;  // Event 없음
}

// ✅ Good: Event 발생과 함께 상태 변경
updatePosition(command: UpdatePositionCommand): void {
  this.position = command.newPosition;
  this.addDomainEvent(new PositionUpdatedEvent({...}));  // Event 발생
}
```

### 7.6 마이그레이션 가이드

기존 코드를 Event Storming + DDD 패턴으로 변경하는 순서:

1. **Command 정의**: `shared/commands/`에 Command 인터페이스 정의
2. **Event 정의**: Domain Event 인터페이스 정의 (Command와 1:1 대응)
3. **Aggregate 수정**: 
   - Command를 입력으로 받도록 시그니처 변경
   - Domain Event 발생 로직 추가
   - Event 관리 메서드 추가 (`getUncommittedEvents()`, `markEventsAsCommitted()`)
4. **Service 수정**:
   - 입력을 Command에서 SafeDTO로 변경
   - SafeDTO → Command 변환 로직 추가
   - Event 처리 로직 추가
5. **Server Action 수정**:
   - Command 생성 로직 제거
   - SafeDTO만 Service에 전달

#### **용어 정리**
- **DTO**: Trust Boundary 이전의 데이터 (클라이언트 → 서버)
- **SafeDTO**: Trust Boundary 이후의 검증된 데이터 (Zod 검증 통과)
- **Command**: Value Objects를 포함한 비즈니스 의도
- **Event**: 시스템에서 발생한 불변의 사실

이 컨벤션을 따르면 **보안성**, **타입 안전성**, **유지보수성**, **Event Sourcing 준비**를 모두 확보할 수 있습니다.
