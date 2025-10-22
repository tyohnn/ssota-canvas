# Testing Strategy: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-10-19  
**버전**: v1.0

**Technical Specification 참조**: `04-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: TDD Implementation

---

> **가이드 참조**: `docs/event-domain-design/guide/05-testing-strategy-guide.md`  
> **작성 시점**: Technical Specification 완료 후, TDD Implementation 시작 전  
> **목적**: Technical Specification의 수도코드를 바탕으로 체계적인 테스트 전략 수립

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약

Canvas Management Domain은 **단일 Bounded Context**로 구성되어 있으며, 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구를 테스트합니다.

**핵심 테스트 전략**:
- 4개 핵심 Aggregate 테스트: Canvas, BlockMount, Edge, Viewport
- React Flow ACL을 통한 외부 라이브러리 통합 테스트
- State of Truth 전략 테스트: React Flow State (단기) + Database (장기)
- Workspace Management, Block Domain과의 동기적 서비스 주입 테스트

### Process Model 연결점

- **입력**: `02-process-model.md` - 10개 주요 시나리오 (Scenario 0-9)
- **입력**: `04-technical-specification.md` - 4개 핵심 Aggregate + 6개 Value Objects
- **출력**: Unit/Integration/E2E 테스트 케이스 60+ 개

### 커버리지 목표 요약

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       70%  (25개 - Value Objects, Entities, Aggregates)
- Integration Tests: 20%  (8개 - Repository, Service, Server Actions)
- E2E Tests:        10%  (9개 - Process Model 시나리오별)
```

---

## 🗺️ Process Model → Test 매핑

> **가이드 참조**: Phase 2.2 - Process Model → Test 매핑

### Scenario 0: 외부 도메인과의 동기화

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 캔버스 초기화 처리 | Unit | CanvasAggregate.create() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Canvas Initialization Manager | Unit | CanvasAggregate 초기화 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 캔버스가 초기화되었다 | Unit | CanvasInitializedEvent 발행 | ⭐️⭐️⭐️⭐️ |
| System: Canvas Data Manager | Integration | CanvasRepository.findByPageId() | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | initializeCanvasAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 페이지 접근 → 캔버스 초기화 → 블럭/엣지 로드 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 1: 블럭 생성 및 마운팅

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 블럭 생성 요청 | Unit | BlockMountAggregate.mountBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Creation Manager | Integration | BlockDomainService 연동 | ⭐️⭐️⭐️⭐️ |
| System: Block Mounting Manager | Unit | BlockMountAggregate 마운트 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 블럭이 마운트되었다 | Unit | BlockMountedEvent 발행 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | mountBlockAction() | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 2: 블럭 변형 (이동, 리사이즈, Z-Order)

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 블럭 변형 명령 | Unit | BlockMountAggregate.transformBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Transform Manager | Unit | 스냅 임계값 및 가이드라인 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 블럭이 변형되었다 | Unit | BlockTransformedEvent 발행 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | transformBlockAction() | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 3: 블럭 복제

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 블럭 복제 요청 | Unit | BlockMountAggregate.duplicateBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Duplication Manager | Integration | BlockDomainService.duplicateBlock() 연동 | ⭐️⭐️⭐️⭐️ |
| Event: 블럭이 복제되고 마운트되었다 | Unit | BlockDuplicatedAndMountedEvent 발행 | ⭐️⭐️⭐️⭐️ |

### Scenario 4: 블럭 선택 및 다중 선택

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Frontend State 관리 | Unit | useBlockSelection() Hook | ⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 블럭 클릭 → 선택 표시, Ctrl+클릭 → 다중 선택 | ⭐️⭐️⭐️⭐️ |

### Scenario 5: 블럭 정렬 도구

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 블럭 정렬 명령 | Unit | BlockMountAggregate.alignBlocks() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: 블럭 분포 명령 | Unit | BlockMountAggregate.distributeBlocks() | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 블럭들이 정렬되었다 | Unit | BlocksAlignedEvent, BlocksDistributedEvent | ⭐️⭐️⭐️⭐️ |

### Scenario 6: 스마트 가이드 & 스냅

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Frontend State 관리 | Unit | useSnapGuidelines() Hook | ⭐️⭐️⭐️⭐️ |
| System: Block Transform Manager | Unit | 스냅 임계값 5px 로직 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 7: 엣지 생성 및 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 엣지 생성 명령 | Unit | EdgeAggregate.createEdge() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Edge Creation Manager | Unit | 엣지 연결 유효성 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 엣지가 생성되었다 | Unit | EdgeCreatedEvent 발행 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | createEdgeAction() | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 8: 블럭 삭제 및 엣지 정리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 블럭 삭제 명령 | Unit | BlockMountAggregate.deleteBlockMount() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Deletion Manager | Unit | 연결된 엣지 일괄 삭제 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 연결된 엣지들이 삭제되었다 | Unit | ConnectedEdgesDeletedEvent | ⭐️⭐️⭐️⭐️ |

### Scenario 9: 캔버스 뷰포트 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 뷰포트 업데이트 명령 | Unit | ViewportAggregate.updateViewport() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Viewport State Manager | Unit | 뷰포트 상태 저장/복원 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: 뷰포트가 업데이트되었다 | Unit | ViewportUpdatedEvent, ViewportStateSavedEvent | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | updateViewportAction() | ⭐️⭐️⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

> **가이드 참조**: Phase 3.2 - Unit Tests 전략 작성

### 1. Value Objects 테스트

#### Position VO
```typescript
describe('Position Value Object', () => {
  describe('생성자', () => {
    it('유효한 좌표값으로 생성되어야 한다', () => {
      const position = new Position(100, 200);
      expect(position).toBeDefined();
    })
    
    it('범위를 벗어난 좌표값에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new Position(-1000000, 0)).toThrow(CanvasManagementError);
      expect(() => new Position(0, 1000000)).toThrow(CanvasManagementError);
    })
    
    it('Infinity, NaN 값에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new Position(Infinity, 0)).toThrow(CanvasManagementError);
      expect(() => new Position(NaN, 0)).toThrow(CanvasManagementError);
    })
  })
  
  describe('equals', () => {
    it('동일한 좌표를 가진 Position은 같아야 한다', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 200);
      expect(pos1.equals(pos2)).toBe(true);
    })
    
    it('부동소수점 오차 범위 내에서 같다고 판단해야 한다', () => {
      const pos1 = new Position(100.0001, 200.0001);
      const pos2 = new Position(100.0002, 200.0002);
      expect(pos1.equals(pos2)).toBe(true);
    })
  })
  
  describe('add', () => {
    it('두 Position을 더한 결과가 올바르게 계산되어야 한다', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(50, 75);
      const result = pos1.add(pos2);
      expect(result.equals(new Position(150, 275))).toBe(true);
    })
  })
  
  describe('distanceTo', () => {
    it('두 Position 간 거리가 올바르게 계산되어야 한다', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(3, 4);
      expect(pos1.distanceTo(pos2)).toBe(5);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 모든 블럭 위치와 변형의 핵심이 되는 기본 Value Object

#### Size VO
```typescript
describe('Size Value Object', () => {
  describe('생성자', () => {
    it('유효한 크기값으로 생성되어야 한다', () => {
      const size = new Size(100, 200);
      expect(size).toBeDefined();
    })
    
    it('범위를 벗어난 크기값에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new Size(0, 100)).toThrow(CanvasManagementError);
      expect(() => new Size(100, 10001)).toThrow(CanvasManagementError);
    })
  })
  
  describe('getArea', () => {
    it('면적이 올바르게 계산되어야 한다', () => {
      const size = new Size(10, 20);
      expect(size.getArea()).toBe(200);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### ZOrder VO
```typescript
describe('ZOrder Value Object', () => {
  describe('생성자', () => {
    it('유효한 z-order 값으로 생성되어야 한다', () => {
      const zOrder = new ZOrder(100);
      expect(zOrder).toBeDefined();
    })
    
    it('범위를 벗어난 값에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new ZOrder(-1)).toThrow(CanvasManagementError);
      expect(() => new ZOrder(2147483648)).toThrow(CanvasManagementError);
    })
    
    it('정수가 아닌 값에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new ZOrder(1.5)).toThrow(CanvasManagementError);
    })
  })
  
  describe('isAbove', () => {
    it('더 큰 z-order 값이 위에 있다고 판단해야 한다', () => {
      const lower = new ZOrder(1);
      const higher = new ZOrder(2);
      expect(higher.isAbove(lower)).toBe(true);
      expect(lower.isAbove(higher)).toBe(false);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### CanvasId, BlockMountId, EdgeId VO
```typescript
describe('CanvasId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const canvasId = new CanvasId(validUuid);
      expect(canvasId.value).toBe(validUuid);
    })
    
    it('유효하지 않은 UUID에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new CanvasId('invalid-uuid')).toThrow(CanvasManagementError);
    })
  })
  
  describe('equals', () => {
    it('동일한 UUID를 가진 CanvasId는 같아야 한다', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const id1 = new CanvasId(uuid);
      const id2 = new CanvasId(uuid);
      expect(id1.equals(id2)).toBe(true);
    })
  })
})

describe('BlockMountId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      const validUuid = 'block-mount-123e4567-e89b-12d3-a456-426614174000';
      const blockMountId = new BlockMountId(validUuid);
      expect(blockMountId.value).toBe(validUuid);
    })
  })
})

describe('EdgeId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      const validUuid = 'edge-123e4567-e89b-12d3-a456-426614174000';
      const edgeId = new EdgeId(validUuid);
      expect(edgeId.value).toBe(validUuid);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

### 2. Entities 테스트

#### Canvas Entity
```typescript
describe('Canvas Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      const canvasId = new CanvasId('123e4567-e89b-12d3-a456-426614174000');
      const pageId = new PageId('page-123');
      const canvas = new Canvas(canvasId, pageId);
      
      expect(canvas.id).toBe(canvasId);
      expect(canvas.pageId).toBe(pageId);
      expect(canvas.isInitialized).toBe(false);
    })
  })
  
  describe('initialize', () => {
    it('React Flow 인스턴스로 초기화되어야 한다', () => {
      const canvas = createTestCanvas();
      const reactFlowInstanceId = 'reactflow-123';
      
      canvas.initialize(reactFlowInstanceId);
      
      expect(canvas.reactFlowInstanceId).toBe(reactFlowInstanceId);
      expect(canvas.updatedAt).not.toBe(canvas.createdAt);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### BlockMount Entity
```typescript
describe('BlockMount Entity', () => {
  describe('transform', () => {
    it('위치만 변경되어야 한다', () => {
      const blockMount = createTestBlockMount();
      const newPosition = new Position(200, 300);
      
      blockMount.transform(newPosition);
      
      expect(blockMount.position).toBe(newPosition);
      expect(blockMount.updatedAt).not.toBe(blockMount.createdAt);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

### 3. Aggregates 테스트

#### CanvasAggregate
```typescript
describe('CanvasAggregate', () => {
  describe('create', () => {
    it('PageId로부터 캔버스가 생성되어야 한다', () => {
      const pageId = new PageId('page-123');
      const aggregate = CanvasAggregate.create(pageId);
      
      expect(aggregate.getCanvas().pageId).toBe(pageId);
      expect(aggregate.getCanvas().id.value).toBe(pageId.value);
    })
    
    it('CanvasInitialized 이벤트가 발행되어야 한다', () => {
      const pageId = new PageId('page-123');
      const aggregate = CanvasAggregate.create(pageId);
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CanvasInitializedEvent);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 1, 2

#### BlockMountAggregate
```typescript
describe('BlockMountAggregate', () => {
  describe('mountBlock', () => {
    it('새로운 블럭이 페이지에 마운트되어야 한다', () => {
      const pageId = new PageId('page-123');
      const blockId = new BlockId('block-123');
      const position = new Position(100, 200);
      const size = new Size(150, 150);
      
      const aggregate = BlockMountAggregate.mountBlock(pageId, blockId, position, size);
      
      expect(aggregate.getBlockMount().pageId).toBe(pageId);
      expect(aggregate.getBlockMount().blockId).toBe(blockId);
      expect(aggregate.getBlockMount().position).toBe(position);
    })
    
    it('BlockMounted 이벤트가 발행되어야 한다', () => {
      const aggregate = BlockMountAggregate.mountBlock(pageId, blockId, position, size);
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockMountedEvent);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1, 2, 3, 5, 8

---

## 🔗 Integration Tests 전략

> **가이드 참조**: Phase 3.3 - Integration Tests 전략 작성

### 1. Repository 통합 테스트

#### CanvasRepository
```typescript
describe('CanvasRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  })
  
  describe('findByPageId', () => {
    it('page_id로 캔버스를 찾아야 한다', () => {
      const pageId = new PageId('page-123');
      const canvas = canvasRepository.findByPageId(pageId);
      
      expect(canvas).toBeDefined();
      expect(canvas?.pageId).toBe(pageId);
    })
    
    it('존재하지 않는 page_id는 null을 반환해야 한다', () => {
      const nonExistentPageId = new PageId('non-existent');
      const canvas = canvasRepository.findByPageId(nonExistentPageId);
      
      expect(canvas).toBeNull();
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

#### BlockMountRepository
```typescript
describe('BlockMountRepository Integration Tests', () => {
  describe('findByPageId', () => {
    it('페이지별 블럭들을 z_order DESC로 조회해야 한다', () => {
      const pageId = new PageId('page-123');
      const blocks = blockMountRepository.findByPageId(pageId);
      
      expect(blocks).toBeDefined();
      expect(blocks.length).toBeGreaterThan(0);
      
      // z_order가 내림차순으로 정렬되어 있는지 확인
      for (let i = 0; i < blocks.length - 1; i++) {
        expect(blocks[i].zOrder.value).toBeGreaterThanOrEqual(blocks[i + 1].zOrder.value);
      }
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

### 2. Service 통합 테스트

#### CanvasManagementService
```typescript
describe('CanvasManagementService Integration Tests', () => {
  describe('initializeCanvas', () => {
    it('정상 플로우를 완료해야 한다', async () => {
      const command: InitializeCanvasCommand = {
        pageId: new PageId('page-123'),
        userId: new UserId('user-123')
      };
      
      const result = await canvasManagementService.initializeCanvas(command);
      
      expect(result.isOk()).toBe(true);
      expect(result.value.getCanvas().pageId).toBe(command.pageId);
    })
    
    it('권한이 없는 경우 에러를 반환해야 한다', async () => {
      const command: InitializeCanvasCommand = {
        pageId: new PageId('unauthorized-page'),
        userId: new UserId('user-123')
      };
      
      const result = await canvasManagementService.initializeCanvas(command);
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

### 3. Server Actions 통합 테스트

#### Canvas Management Actions
```typescript
describe('Canvas Management Server Actions Integration Tests', () => {
  describe('initializeCanvasAction', () => {
    it('인증된 사용자의 캔버스 초기화를 수행해야 한다', async () => {
      await mockAuthUser('user-123');
      
      const result = await initializeCanvasAction('page-123', 'user-123');
      
      expect(result.isOk()).toBe(true);
      expect(result.value.canvasId).toBeDefined();
    })
    
    it('미인증 사용자는 거부해야 한다', async () => {
      await mockUnauthedUser();
      
      const result = await initializeCanvasAction('page-123', 'user-123');
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(UnauthorizedError);
    })
  })
  
  describe('mountBlockAction', () => {
    it('블럭 마운트 플로우를 완료해야 한다', async () => {
      await mockAuthUser('user-123');
      
      const result = await mountBlockAction(
        'page-123',
        'block-123',
        { x: 100, y: 200 },
        { width: 150, height: 150 }
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value.blockMountId).toBeDefined();
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점

---

## 🎭 E2E Tests 전략

> **가이드 참조**: Phase 3.4 - E2E Tests 전략 작성

### 1. 캔버스 초기화 및 블럭 생성 (Scenario 0, 1)

```typescript
test('페이지 접근 시 캔버스 초기화 및 블럭 생성', async ({ page }) => {
  // Given: 사용자가 로그인되어 있고 페이지에 접근 가능
  await page.goto('/pages/test-page');
  
  // Then: 캔버스가 초기화되어야 함
  await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-canvas"]')).toBeVisible();
  
  // When: 블럭 타입을 선택하고 캔버스에 클릭
  await page.click('[data-testid="block-toolbar"]');
  await page.click('[data-testid="text-block-button"]');
  await page.click('[data-testid="canvas"]', { position: { x: 100, y: 200 } });
  
  // Then: 블럭이 생성되고 선택되어야 함
  await expect(page.locator('[data-testid="selected-block"]')).toBeVisible();
  await expect(page.locator('[data-testid="block-mount-point"]')).toHaveAttribute('style', /left: 100px; top: 200px/);
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0, 1 전체

### 2. 블럭 변형 및 스냅 (Scenario 2, 6)

```typescript
test('블럭 드래그 이동 및 스냅 가이드라인', async ({ page }) => {
  // Given: 캔버스에 블럭들이 생성되어 있음
  await setupCanvasWithMultipleBlocks(page);
  
  // When: 블럭을 드래그하여 이동
  await page.hover('[data-testid="block-1"]');
  await page.mouse.down();
  await page.mouse.move(150, 250); // 다른 블럭 근처로 이동
  
  // Then: 스냅 가이드라인이 표시되어야 함
  await expect(page.locator('[data-testid="snap-guideline"]')).toBeVisible();
  
  // When: 드래그를 완료
  await page.mouse.up();
  
  // Then: 스냅이 적용되어 정확한 위치에 배치되어야 함
  await expect(page.locator('[data-testid="block-1"]')).toHaveAttribute('style', /left: 155px/);
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2, 6

### 3. 엣지 생성 및 관리 (Scenario 7)

```typescript
test('블럭 간 엣지 생성 및 편집', async ({ page }) => {
  // Given: 캔버스에 연결 가능한 블럭들이 있음
  await setupCanvasWithBlockNodes(page);
  
  // When: 첫 번째 블럭의 연결점을 드래그하여 두 번째 블럭에 연결
  await page.hover('[data-testid="block-1-handle-right"]');
  await page.mouse.down();
  await page.mouse.move(200, 200); // block-2 방향으로
  await page.hover('[data-testid="block-2-handle-left"]');
  await page.mouse.up();
  
  // Then: 엣지가 생성되어야 함
  await expect(page.locator('[data-testid="edge-connection"]')).toBeVisible();
  
  // When: 엣지를 더블클릭하여 편집
  await page.dblclick('[data-testid="edge-connection"]');
  
  // Then: 엣지 편집 UI가 표시되어야 함
  await expect(page.locator('[data-testid="edge-edit-panel"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 7

---

## 📈 커버리지 목표 및 TDD 사이클

> **가이드 참조**: Phase 3.5 - 커버리지 목표 및 TDD 사이클 작성

### 레이어별 커버리지 목표

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|--------------|---------|
| Value Objects | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Entities | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Aggregates | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Services | 85% 이상 | ⭐️⭐️⭐️⭐️ |
| Repositories | 80% 이상 | ⭐️⭐️⭐️⭐️ |
| Server Actions | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| React Hooks | 70% 이상 | ⭐️⭐️⭐️ |

### 전체 커버리지 목표

```
전체 코드 커버리지: 85% 이상
- Branches: 80% 이상
- Functions: 85% 이상
- Lines: 85% 이상
- Statements: 85% 이상
```

### TDD 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. Position VO → RED-GREEN-REFACTOR
2. Size VO
3. ZOrder VO
4. CanvasId, BlockMountId, EdgeId VO

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Canvas Entity
2. BlockMount Entity
3. Edge Entity
4. Viewport Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. CanvasAggregate
2. BlockMountAggregate
3. EdgeAggregate
4. ViewportAggregate

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. CanvasRepository (통합 테스트)
2. BlockMountRepository (통합 테스트)
3. EdgeRepository (통합 테스트)
4. ViewportRepository (통합 테스트)

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. CanvasManagementService (통합 테스트)

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. initializeCanvasAction (통합 테스트)
2. mountBlockAction (통합 테스트)
3. transformBlockAction (통합 테스트)
4. createEdgeAction (통합 테스트)
5. updateViewportAction (통합 테스트)

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 캔버스 초기화 및 블럭 생성 플로우
2. 블럭 변형 및 스냅 가이드라인 플로우
3. 엣지 생성 및 관리 플로우
```

### TDD 사이클 예시

**Position Value Object 구현 예시**:

```typescript
// 1. RED: 테스트 먼저 작성
describe('Position', () => {
  it('유효한 좌표값으로 생성되어야 한다', () => {
    const position = new Position(100, 200);
    expect(position).toBeDefined();
  })
})

// 실행: FAIL (Position 클래스 없음)

// 2. GREEN: 최소 구현
export class Position {
  constructor(public readonly x: number, public readonly y: number) {}
}

// 실행: PASS

// 3. REFACTOR: 검증 로직 추가
export class Position {
  constructor(public readonly x: number, public readonly y: number) {
    if (!this.isValid(x, y)) {
      throw new CanvasManagementError('INVALID_POSITION', 'Invalid position values');
    }
  }
  
  private isValid(x: number, y: number): boolean {
    return x >= -999999 && x <= 999999 && y >= -999999 && y <= 999999 && 
           !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
  }
}

// 실행: PASS (기존 테스트 통과 + 새 테스트 추가)
```

---

## ⚙️ 테스트 도구 및 설정

> **가이드 참조**: Phase 3.6 - 테스트 도구 및 설정 정리

### Unit & Integration Tests
- **프레임워크**: Vitest
- **Assertion**: expect (Vitest 내장)
- **Mock**: vi (Vitest 내장)
- **커버리지**: v8
- **설정 파일**: `vitest.config.ts`

### E2E Tests
- **프레임워크**: Playwright
- **브라우저**: Chromium, Firefox, WebKit
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 실패 시 자동 녹화
- **설정 파일**: `playwright.config.ts`

### 테스트 데이터베이스
- **로컬**: PostgreSQL (Docker)
- **CI/CD**: Supabase 테스트 인스턴스
- **정리 전략**: 각 테스트 후 데이터 완전 삭제 (`cleanDatabase()`)

---

## ✅ 검증 체크리스트

> **가이드 참조**: Phase 3.7 - 품질 검증 체크리스트

### 일관성 검증
- [x] Process Model의 모든 시나리오가 테스트 케이스로 매핑되었는가?
- [x] Technical Specification의 모든 Aggregate가 테스트 계획에 포함되었는가?
- [x] 핵심 불변식이 테스트로 검증 가능한가?

### 완전성 검증
- [x] 모든 Happy Path가 커버되는가?
- [x] 주요 에러 시나리오가 테스트되는가?
- [x] 경계값 테스트가 포함되어 있는가?
- [x] 커버리지 목표를 달성할 수 있는가?

### 실용성 검증
- [x] 테스트는 독립적으로 실행 가능한가?
- [x] 테스트는 빠르게 실행되는가? (Unit < 100ms, Integration < 1s)
- [x] 테스트는 반복 실행해도 동일한 결과를 내는가?
- [x] 테스트 실패 시 원인을 명확히 알 수 있는가?

---

## 🚀 다음 단계

이 Testing Strategy 문서를 기반으로 다음 단계를 진행하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - 코드 리뷰 및 PR

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] QA 리뷰 완료 (있는 경우)
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Testing Strategy를 따라 높은 품질의 Canvas Management Domain을 구현할 수 있습니다! 🎉

---
