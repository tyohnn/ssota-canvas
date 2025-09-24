# Visual Canvas Domain - API Specification

Domain Commands와 Queries를 Server Actions로 구현하는 명세입니다.

---

## 🎯 API Design Principles

1. **Command/Query Separation**: 명령과 조회를 명확히 분리
2. **Type Safety**: Zod를 활용한 입력 검증
3. **Error Handling**: 도메인 에러를 사용자 친화적으로 변환
4. **Optimistic UI**: 즉각적인 UI 반응을 위한 설계

---

## 📝 Server Actions

### Block Commands

#### createBlockAction
**Purpose**: 새 블럭 생성 및 페이지 마운트  
**Domain Command**: CreateBlock

```typescript
// Input Schema
const createBlockInput = z.object({
  type: z.enum(['text', 'image', 'video', 'note', 'shape']),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0)
  }),
  pageId: z.string().uuid(),
  content: z.any().optional(),
  size: z.object({
    width: z.number().min(50).max(1000).optional(),
    height: z.number().min(50).max(1000).optional()
  }).optional()
});

// Server Action
export async function createBlockAction(
  input: z.infer<typeof createBlockInput>
): Promise<Result<{ blockId: string }, BlockError>> {
  try {
    // 1. Validate input
    const validated = createBlockInput.parse(input);
    
    // 2. Create domain command
    const command = new CreateBlockCommand(
      BlockType.fromString(validated.type),
      Position.create(validated.position.x, validated.position.y),
      PageId.fromString(validated.pageId),
      validated.content
    );
    
    // 3. Execute through domain service
    const block = await blockService.createBlock(command);
    
    // 4. Return success result
    return Result.ok({ blockId: block.id.toString() });
    
  } catch (error) {
    // 5. Handle domain errors
    if (error instanceof InvalidBlockTypeError) {
      return Result.fail(BlockError.INVALID_TYPE);
    }
    return Result.fail(BlockError.CREATION_FAILED);
  }
}

// Error Types
enum BlockError {
  INVALID_TYPE = 'INVALID_TYPE',
  CREATION_FAILED = 'CREATION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

#### moveBlockAction
**Purpose**: 블럭 위치 이동  
**Domain Command**: MoveBlock

```typescript
const moveBlockInput = z.object({
  blockId: z.string().uuid(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  pageId: z.string().uuid()
});

export async function moveBlockAction(
  input: z.infer<typeof moveBlockInput>
): Promise<Result<void, BlockError>> {
  // Optimistic UI를 위해 빠른 응답
  // 실제 DB 업데이트는 비동기로 처리
}
```

#### updateBlockContentAction
**Purpose**: 블럭 콘텐츠 수정  
**Domain Command**: UpdateBlockContent

```typescript
const updateBlockContentInput = z.object({
  blockId: z.string().uuid(),
  content: z.any(), // 타입별 검증은 도메인에서
  debounceKey: z.string().optional() // 중복 요청 방지
});

export async function updateBlockContentAction(
  input: z.infer<typeof updateBlockContentInput>
): Promise<Result<void, BlockError>> {
  // Content 타입별 검증
  // Debouncing 처리
}
```

#### deleteBlockAction
**Purpose**: 블럭 삭제 (Soft Delete)  
**Domain Command**: DeleteBlock

```typescript
const deleteBlockInput = z.object({
  blockId: z.string().uuid(),
  pageId: z.string().uuid()
});

export async function deleteBlockAction(
  input: z.infer<typeof deleteBlockInput>
): Promise<Result<void, BlockError>> {
  // Cascade 처리 (edges, group membership)
  // Undo 가능하도록 soft delete
}
```

### Edge Commands

#### createEdgeAction
**Purpose**: 블럭 간 연결 생성  
**Domain Command**: CreateEdge

```typescript
const createEdgeInput = z.object({
  source: z.string().uuid(),
  target: z.string().uuid(),
  sourceHandle: z.string().default('default'),
  targetHandle: z.string().default('default'),
  pageId: z.string().uuid(),
  label: z.string().max(200).optional()
});

export async function createEdgeAction(
  input: z.infer<typeof createEdgeInput>
): Promise<Result<{ edgeId: string }, EdgeError>> {
  // Self-loop 검증
  // 중복 엣지 확인
  // React Flow 스타일 자동 생성
}
```

### Canvas Commands

#### batchUpdatePositionsAction
**Purpose**: 여러 블럭 위치 일괄 업데이트 (성능 최적화)

```typescript
const batchUpdateInput = z.object({
  updates: z.array(z.object({
    blockId: z.string().uuid(),
    position: z.object({ x: z.number(), y: z.number() })
  })),
  pageId: z.string().uuid()
});

export async function batchUpdatePositionsAction(
  input: z.infer<typeof batchUpdateInput>
): Promise<Result<void, CanvasError>> {
  // 트랜잭션으로 일괄 처리
  // 단일 이벤트로 발행
}
```

---

## 🔍 Query Functions

### getCanvasDataQuery
**Purpose**: 페이지의 모든 캔버스 데이터 로드

```typescript
interface CanvasData {
  blocks: Array<{
    id: string;
    type: string;
    content: any;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zOrder: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
    label?: string;
    style: any;
  }>;
}

export async function getCanvasDataQuery(
  pageId: string
): Promise<Result<CanvasData, CanvasError>> {
  // 최적화된 쿼리 (JOIN 최소화)
  // React Flow 형식으로 변환
  // 캐싱 헤더 설정
}
```

### searchBlocksQuery
**Purpose**: 블럭 검색

```typescript
const searchInput = z.object({
  query: z.string().min(2),
  pageId: z.string().uuid().optional(),
  types: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20)
});

export async function searchBlocksQuery(
  input: z.infer<typeof searchInput>
): Promise<Result<BlockSearchResult[], SearchError>> {
  // Full-text search on content
  // Type filtering
  // Relevance scoring
}
```

---

## 🔄 Real-time Subscriptions

### Canvas Change Events
```typescript
// Server-Sent Events for real-time updates
export async function* subscribeToCanvasChanges(
  pageId: string,
  userId: string
): AsyncGenerator<CanvasChangeEvent> {
  // Subscribe to domain events
  // Filter by page and permissions
  // Yield formatted events for client
}

type CanvasChangeEvent = 
  | { type: 'block.created'; data: { blockId: string; /* ... */ } }
  | { type: 'block.moved'; data: { blockId: string; position: Position } }
  | { type: 'edge.created'; data: { edgeId: string; /* ... */ } }
  | { type: 'block.deleted'; data: { blockId: string } };
```

---

## 🛡️ Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;        // Machine-readable error code
    message: string;     // User-friendly message
    details?: any;       // Additional context
    timestamp: string;   // ISO timestamp
    correlationId: string; // For debugging
  };
}
```

### Common Error Scenarios

| Error Code | HTTP Status | Description | User Message |
|------------|-------------|-------------|--------------|
| BLOCK_NOT_FOUND | 404 | Block doesn't exist | "블럭을 찾을 수 없습니다" |
| INVALID_POSITION | 400 | Invalid coordinates | "올바르지 않은 위치입니다" |
| PERMISSION_DENIED | 403 | No access to page | "이 페이지에 접근할 수 없습니다" |
| RATE_LIMITED | 429 | Too many requests | "잠시 후 다시 시도해주세요" |
| CONFLICT | 409 | Concurrent modification | "다른 사용자가 수정 중입니다" |

---

## 🚀 Performance Optimizations

### 1. Debouncing Strategy
```typescript
// Client-side debouncing helper
const debouncedUpdate = useDebouncedCallback(
  async (content: any) => {
    await updateBlockContentAction({ blockId, content });
  },
  500 // 500ms delay
);
```

### 2. Optimistic Updates
```typescript
// Immediate UI update before server confirmation
const optimisticMove = async (blockId: string, position: Position) => {
  // 1. Update UI immediately
  updateLocalState(blockId, position);
  
  // 2. Send to server
  const result = await moveBlockAction({ blockId, position });
  
  // 3. Rollback on failure
  if (result.isFailure) {
    rollbackLocalState(blockId);
  }
};
```

### 3. Batch Operations
```typescript
// Collect multiple operations
const batchQueue = new BatchQueue<PositionUpdate>();

// Process in batches
batchQueue.process(async (updates) => {
  await batchUpdatePositionsAction({ updates });
}, { 
  maxBatchSize: 50,
  maxWaitTime: 100 
});
```

---

## 📊 Rate Limiting

### Per-User Limits
```typescript
const rateLimits = {
  createBlock: {
    windowMs: 60 * 1000,  // 1 minute
    max: 30               // 30 creates per minute
  },
  moveBlock: {
    windowMs: 1000,       // 1 second
    max: 100              // 100 moves per second
  },
  updateContent: {
    windowMs: 1000,       // 1 second
    max: 20               // 20 updates per second
  }
};
```

---

## 🧪 Testing

### Example Test
```typescript
describe('createBlockAction', () => {
  it('should create a text block', async () => {
    const input = {
      type: 'text',
      position: { x: 100, y: 200 },
      pageId: 'test-page-id',
      content: { text: 'Hello' }
    };

    const result = await createBlockAction(input);

    expect(result.isSuccess).toBe(true);
    expect(result.value.blockId).toBeDefined();
  });

  it('should handle invalid block type', async () => {
    const input = {
      type: 'invalid-type',
      position: { x: 100, y: 200 },
      pageId: 'test-page-id'
    };

    const result = await createBlockAction(input);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(BlockError.INVALID_TYPE);
  });
});
```
