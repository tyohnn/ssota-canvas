# Event 패턴 구현 전략 (Event Bus 없이)

**작성일**: 2025-10-27  
**버전**: v1.0

## 🎯 목표

Next.js 서버리스 환경에서 Event Bus 없이 DDD 이벤트 패턴을 올바르게 구현하고, Event Storming과 코드를 1:1 매칭시킨다.

---

## 🏗️ 아키텍처 설계

### 1. 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│ Server Action (Trust Boundary)                              │
│  ↓                                                           │
│ Service (Application Logic)                                  │
│  ↓                                                           │
│ Aggregate (Domain Logic)                                     │
│  ├── Command 처리                                            │
│  ├── 비즈니스 규칙 검증                                        │
│  └── 이벤트 생성 (내부 저장)                                   │
│  ↓                                                           │
│ Service (계속)                                               │
│  ├── Repository에 Entity 저장                                │
│  ├── 이벤트 핸들러 실행 (handleDomainEvents)                  │
│  └── 이벤트 커밋 (markEventsAsCommitted)                      │
│  ↓                                                           │
│ DTO 반환                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. 이벤트 흐름

```typescript
// ✅ 올바른 패턴
class BlockManagementService {
  async createBlock(command: CreateBlockCommand): Promise<Block> {
    // 1. Aggregate에서 Command 처리 → 이벤트 생성
    const aggregate = BlockAggregate.create(command);
    
    // 2. Entity 저장
    await this.blockRepository.save(aggregate.getBlock());
    
    // 3. 이벤트 핸들러 실행 (동기적)
    const events = aggregate.getUncommittedEvents();
    await this.handleDomainEvents(events);
    
    // 4. 이벤트 커밋 (메모리에서 정리)
    aggregate.markEventsAsCommitted();
    
    // 5. 결과 반환
    return aggregate.getBlock();
  }
  
  private async handleDomainEvents(
    events: DomainEvent[]
  ): Promise<void> {
    for (const event of events) {
      // 도메인 내부 사이드 이펙트 처리
      if (event instanceof BlockCreatedEvent) {
        // 예: 알림 전송, 캐시 무효화, 통계 업데이트 등
        await this.handleBlockCreated(event);
      }
    }
  }
}
```

---

## 🔄 Event Storming과 코드 매칭

### Event Storming 예시

```
[Command: 블럭 생성 요청]
  ↓
[System: BlockAggregate.create()]
  ↓
[Event: 블럭이 생성되었다 (BlockCreatedEvent)]
  ↓
[Policy: 기본 속성을 초기화한다]
  ↓
[Event: 속성이 초기화되었다]
```

### 코드 매칭

```typescript
// 1. Command
interface CreateBlockCommand {
  blockId: BlockId;
  blockType: BlockType;
  workspaceId: string;
  userId: string;
}

// 2. Aggregate (System)
class BlockAggregate {
  static create(command: CreateBlockCommand): BlockAggregate {
    // 비즈니스 로직
    const block = Block.create(...);
    
    // 3. Event 생성
    const event = new BlockCreatedEvent({
      blockId: block.id,
      blockType: block.blockType,
      // ...
    });
    
    const aggregate = new BlockAggregate(block);
    aggregate._events.push(event); // 이벤트 저장
    
    return aggregate;
  }
}

// 4. Service (Policy 처리)
class BlockManagementService {
  async createBlock(command: CreateBlockCommand): Promise<Block> {
    const aggregate = BlockAggregate.create(command);
    
    await this.blockRepository.save(aggregate.getBlock());
    
    // 5. Policy 실행 (이벤트 핸들러)
    const events = aggregate.getUncommittedEvents();
    await this.handleDomainEvents(events);
    
    aggregate.markEventsAsCommitted();
    
    return aggregate.getBlock();
  }
  
  private async handleDomainEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      if (event instanceof BlockCreatedEvent) {
        // Policy: 기본 속성 초기화
        await this.initializeDefaultProperties(event);
      }
    }
  }
}
```

---

## 🎭 도메인 간 통신

### Block Management → Canvas Management

Canvas Management는 Block Management를 **블랙박스**로 취급:

```typescript
// ❌ 나쁜 예: 다른 도메인의 이벤트에 직접 의존
class CanvasBlockMountService {
  async createAndMountBlock(command: CreateAndMountBlockCommand) {
    // Block Management의 내부 이벤트를 알아야 함 (결합도 높음)
    const blockEvents = await blockService.createBlock(...);
  }
}

// ✅ 좋은 예: 완성된 결과만 받음
class CanvasBlockMountService {
  async createAndMountBlock(command: CreateAndMountBlockCommand) {
    // Block Management는 블랙박스
    const blockEntity = await this.blockManagementService.createBlock(
      createBlockCommand
    );
    
    // Canvas Management의 Aggregate에서 자체 이벤트 생성
    const mountAggregate = BlockMountAggregate.mountBlock(
      blockMountId,
      pageId,
      blockEntity.id,
      position,
      size
    );
    
    // Canvas Management의 이벤트 처리
    await this.blockMountRepository.save(mountAggregate.blockMount);
    
    const events = mountAggregate.getUncommittedEvents();
    await this.handleDomainEvents(events);
    
    mountAggregate.markEventsAsCommitted();
    
    return { mountAggregate, blockEntity };
  }
}
```

---

## 🔧 구현 체크리스트

### Block Management Domain

- [x] `BlockAggregate.create()` - Command 처리, 이벤트 생성
- [x] `BlockManagementService.createBlock()` - Entity 저장, 이벤트 핸들링
- [x] `BlockManagementService.handleDomainEvents()` - 이벤트 핸들러
- [x] `aggregate.markEventsAsCommitted()` - 이벤트 커밋

### Canvas Management Domain

- [ ] `BlockMountAggregate.mountBlock()` - Command 처리, 이벤트 생성
- [ ] `CanvasBlockMountService.createAndMountBlock()` - Entity 저장, 이벤트 핸들링
- [ ] `CanvasBlockMountService.handleDomainEvents()` - 이벤트 핸들러
- [ ] `aggregate.markEventsAsCommitted()` - 이벤트 커밋

---

## 📊 장단점 분석

### ✅ 장점

1. **Event Bus 불필요**: 서버리스 환경에서 동기적 처리
2. **트랜잭션 보장**: 모든 작업이 하나의 요청 안에서 완료
3. **Event Storming 매칭**: Command → Event → Policy 흐름이 명확
4. **도메인 격리**: 각 도메인이 자체 이벤트만 처리

### ⚠️ 단점

1. **확장성 제한**: 비동기 이벤트 처리 불가
2. **외부 시스템 연동 어려움**: Webhook, 메시지 큐 등
3. **이벤트 재생 불가**: Event Sourcing 불가능

### 💡 해결 방안

향후 확장이 필요하면:
1. **Event Store 추가**: 이벤트를 DB에 저장
2. **Outbox Pattern**: 트랜잭션 완료 후 이벤트 발행
3. **Message Queue 연동**: BullMQ, AWS SQS 등

---

## 📚 참고 코드 예시

### Aggregate (이벤트 생성)

```typescript
class BlockMountAggregate {
  private _events: DomainEvent[] = [];
  
  static mountBlock(
    blockMountId: BlockMountId,
    pageId: PageId,
    blockId: BlockId,
    position: Position,
    size: Size
  ): BlockMountAggregate {
    // 1. Entity 생성
    const blockMount = BlockMount.create(blockMountId, pageId, blockId, position, size);
    
    // 2. Event 생성
    const event = new BlockMountedEvent({
      blockMountId: blockMountId.value,
      pageId: pageId.value,
      blockId: blockId.value,
      position,
      size,
      occurredAt: new Date(),
    });
    
    // 3. Aggregate 생성 및 이벤트 저장
    const aggregate = new BlockMountAggregate(blockMount);
    aggregate._events.push(event);
    
    return aggregate;
  }
  
  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }
  
  markEventsAsCommitted(): void {
    this._events = [];
  }
}
```

### Service (이벤트 핸들링)

```typescript
class CanvasBlockMountService implements ICanvasBlockMountService {
  async createAndMountBlock(
    command: CreateAndMountBlockCommand
  ): Promise<Result<{ mountAggregate: BlockMountAggregate; blockEntity: Block }, Error>> {
    try {
      // 1. Block Management Service 호출 (블랙박스)
      const createBlockCommand: CreateBlockCommand = {
        blockId: BlockId.generate(),
        workspaceId: command.workspaceId,
        blockType: command.blockType,
        initialProperties: command.metadata || {},
        userId: command.userId,
      };
      
      const blockEntity = await this.blockManagementService.createBlock(
        createBlockCommand
      );
      
      // 2. Canvas Management Aggregate 생성 (자체 이벤트 생성)
      const mountAggregate = BlockMountAggregate.mountBlock(
        blockMountId,
        command.pageId,
        new BlockId(blockEntity.id.value),
        command.position,
        command.size
      );
      
      // 3. Entity 저장
      await this.blockMountRepository.save(mountAggregate.blockMount);
      
      // 4. 이벤트 핸들러 실행
      const events = mountAggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);
      
      // 5. 이벤트 커밋
      mountAggregate.markEventsAsCommitted();
      
      return Result.success({ mountAggregate, blockEntity });
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
  
  /**
   * 도메인 이벤트 처리 (Canvas Management 내부)
   */
  private async handleDomainEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      if (event instanceof BlockMountedEvent) {
        // Policy: 엣지 자동 연결 확인
        await this.checkAutoConnectEdges(event);
      }
    }
  }
  
  /**
   * Policy: 엣지 자동 연결 확인
   */
  private async checkAutoConnectEdges(event: BlockMountedEvent): Promise<void> {
    // 예: 특정 블럭 타입이 마운트되면 자동으로 엣지 생성
    console.log('[Policy] Checking auto-connect edges for:', event.blockMountId);
  }
}
```

---

## 🎯 결론

Event Bus 없이도 **Aggregate 내부에서 이벤트 수집 → 서비스에서 동기적 처리**하는 방식으로 올바른 DDD 이벤트 패턴을 구현할 수 있습니다.

이 패턴은:
1. ✅ Event Storming과 1:1 매칭됨
2. ✅ 도메인 간 격리 유지 (블랙박스)
3. ✅ Next.js 서버리스 환경에 적합
4. ✅ 트랜잭션 보장

향후 확장이 필요하면 Event Store나 Message Queue를 추가하면 됩니다.

