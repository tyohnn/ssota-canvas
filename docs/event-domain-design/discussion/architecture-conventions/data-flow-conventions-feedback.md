# 데이터 흐름 코드 컨벤션 - 시니어 엔지니어 피드백

**작성일**: 2025-11-03
**평가자**: Senior Software Engineer  
**버전**: v1.0

## 🎯 전반적 평가 요약

**종합 점수**: ⭐⭐⭐⭐☆ (4/5)

현재 컨벤션은 **DDD 원칙을 잘 따르고 있으며, 레이어 분리와 책임 분리가 명확**합니다. 특히 Trust Boundary를 명확히 하고 이중 검증 전략을 채택한 것은 우수합니다. 다만, 몇 가지 **아키텍처적 개선점**과 **확장성 고려사항**이 있습니다.

### ✅ 강점

1. **명확한 레이어 분리**: Hook → Action → Service → Aggregate → Repository 흐름이 체계적
2. **Trust Boundary 명확**: `unknown` 타입 사용과 이중 검증 전략
3. **이벤트 기반 개발**: Aggregate에서 이벤트 수집, Service에서 처리하는 패턴이 Event Storming과 잘 매칭됨
4. **Optimistic Update**: 사용자 경험을 고려한 클라이언트 측 최적화

### ⚠️ 개선 필요 영역

1. **Repository 반환 타입 일관성 부족**
2. **이벤트 처리 순서 및 실패 처리 전략 부재**
3. **트랜잭션 경계 불명확**
4. **도메인 간 통신 패턴 부재**
5. **의존성 주입 패턴 미흡**

---

## 📊 세부 피드백

### 1. Repository 반환 타입 일관성 문제

#### 🔴 현재 문제점

문서에서 Repository가 두 가지 다른 패턴을 제시하고 있습니다:

```typescript
// 패턴 1: Entity 반환 (문서 5.2)
export interface BlockRepository {
  findById(id: BlockId): Promise<Block | null>; // Entity 반환
}

// 패턴 2: Aggregate 반환 (문서 5.3, Edge 예시)
async findById(edgeId: EdgeId): Promise<EdgeAggregate | null> { // Aggregate 반환
  const edge = Edge.fromPersistence(row[0]);
  return new EdgeAggregate(edge); // Aggregate 직접 반환
}
```

이 불일치는 **코드 일관성을 해치고 선택의 혼란**을 야기합니다.

#### ✅ 개선 제안

**원칙**: Repository는 **Entity만 반환**하고, Aggregate 재구성은 **Service 레이어에서 수행**해야 합니다.

**이유**:
1. **책임 분리**: Repository는 데이터 접근만 담당, Aggregate 재구성은 도메인 로직
2. **테스트 용이성**: Repository를 모킹하기 쉬워짐
3. **유연성**: 다양한 Aggregate를 같은 Entity로 재구성 가능

```typescript
// ✅ 올바른 패턴
export interface BlockRepository {
  /**
   * Entity 반환 (Aggregate 재구성은 Service에서)
   */
  findById(id: BlockId): Promise<Block | null>;
}

export class BlockManagementService {
  async getBlock(blockId: BlockId): Promise<BlockAggregate> {
    // Repository에서 Entity 조회
    const block = await this.blockRepository.findById(blockId);
    
    if (!block) {
      throw new BlockManagementError('BLOCK_NOT_FOUND', '...');
    }
    
    // Service에서 Aggregate 재구성 (도메인 로직)
    return BlockAggregate.reconstitute(block);
  }
}

// ❌ 나쁜 패턴: Repository가 Aggregate 반환
export interface BlockRepository {
  findById(id: BlockId): Promise<BlockAggregate | null>; // 책임 혼재
}
```

**문서 수정 필요**:
- Section 5.2와 5.3의 예시를 통일
- "Aggregate 반환" 규칙을 "Entity 반환"으로 변경
- Service 레이어에서 Aggregate 재구성 명시

---

### 2. 이벤트 처리 순서 및 실패 처리 전략 부재

#### 🔴 현재 문제점

```typescript
// 현재 코드 (문서 3.2)
async createBlock(params: { ... }): Promise<BlockAggregate> {
  // 1. Aggregate 생성
  const aggregate = BlockAggregate.create(createBlockCommand);
  
  // 2. Repository 저장
  await this.blockRepository.create(aggregate.getBlock());
  
  // 3. 도메인 이벤트 처리
  const events = aggregate.getUncommittedEvents();
  await this.handleDomainEvents(events); // ⚠️ 실패 시 어떻게?
  
  // 4. 이벤트 커밋
  aggregate.markEventsAsCommitted(); // ⚠️ 이벤트 처리 실패해도 커밋?
  
  return aggregate;
}
```

**문제점**:
1. **이벤트 처리 실패 시 롤백 전략 없음**: Repository 저장은 성공했는데 이벤트 핸들러가 실패하면?
2. **이벤트 처리 순서**: 여러 이벤트가 있을 때 순차/병렬 처리 기준이 불명확
3. **트랜잭션 일관성**: 데이터 저장과 이벤트 처리가 분리되어 있어 원자성 보장 어려움

#### ✅ 개선 제안

**전략 1: Fail-Fast (엄격한 일관성)**

```typescript
async createBlock(params: { ... }): Promise<BlockAggregate> {
  const aggregate = BlockAggregate.create(createBlockCommand);
  
  try {
    // 1. Repository 저장
    await this.blockRepository.create(aggregate.getBlock());
    
    // 2. 이벤트 처리 (실패 시 롤백)
    const events = aggregate.getUncommittedEvents();
    await this.handleDomainEvents(events); // 실패 시 예외 발생
    
    // 3. 이벤트 커밋 (모든 것이 성공한 경우만)
    aggregate.markEventsAsCommitted();
    
    return aggregate;
  } catch (error) {
    // 롤백: 저장된 Entity 삭제
    await this.blockRepository.delete(aggregate.getBlock().id);
    throw error;
  }
}
```

**전략 2: Best Effort (느슨한 일관성)**

```typescript
async createBlock(params: { ... }): Promise<BlockAggregate> {
  const aggregate = BlockAggregate.create(createBlockCommand);
  
  // 1. Repository 저장 (핵심 작업)
  await this.blockRepository.create(aggregate.getBlock());
  
  // 2. 이벤트 처리 (Best Effort - 실패해도 계속)
  const events = aggregate.getUncommittedEvents();
  const results = await this.handleDomainEvents(events);
  
  // 3. 실패한 이벤트는 재시도 큐에 추가 (Outbox Pattern)
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    await this.eventOutbox.enqueue(
      failures.map(f => f.event),
      { retryAttempts: 3 }
    );
  }
  
  // 4. 이벤트 커밋
  aggregate.markEventsAsCommitted();
  
  return aggregate;
}
```

**권장 사항**: Next.js 풀스택 환경에서는 **전략 1 (Fail-Fast)**을 권장합니다:
- 단순한 아키텍처
- 트랜잭션 일관성 보장
- 디버깅 용이

**문서에 추가 필요**:
- 이벤트 처리 실패 시 롤백 전략 명시
- 이벤트 처리 순서 가이드라인 (순차 vs 병렬)
- 트랜잭션 경계 명확화

---

### 3. Command 패턴과 params 패턴의 혼재

#### 🔴 현재 문제점

문서에서 두 가지 패턴이 혼재되어 있습니다:

```typescript
// Service 레이어: params 사용 (문서 3.2)
async createBlock(params: {
  userId: UserId;
  workspaceId: WorkspaceId;
  blockType: BlockType;
  title: string;
}): Promise<BlockAggregate> {
  // 내부에서 Command 생성
  const createBlockCommand: CreateBlockCommand = { ... };
  const aggregate = BlockAggregate.create(createBlockCommand);
}

// Edge 예시: 직접 파라미터 전달 (문서 Edge 생성 플로우)
const aggregate = EdgeAggregate.createEdge(
  edgeId,
  params.pageId,
  params.sourceBlockMountId,
  // ... 직접 파라미터 전달
);
```

**문제점**:
1. **일관성 부족**: 어떤 경우엔 Command, 어떤 경우엔 직접 파라미터
2. **확장성 저하**: Command 패턴을 사용하지 않으면 나중에 메타데이터 추가가 어려움
3. **테스트 복잡성**: 다양한 시그니처로 인한 테스트 코드 복잡

#### ✅ 개선 제안

**원칙**: **Service → Aggregate는 항상 Command 패턴**을 사용합니다.

```typescript
// ✅ 일관된 패턴
export class CanvasEdgeService {
  async createEdge(params: {
    pageId: PageId;
    sourceBlockMountId: BlockMountId;
    targetBlockMountId: BlockMountId;
    sourceHandle?: string;
    targetHandle?: string;
    edgeShape?: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    // 1. Command 생성
    const command: CreateEdgeCommand = {
      edgeId: EdgeId.generate(),
      pageId: params.pageId,
      sourceBlockMountId: params.sourceBlockMountId,
      targetBlockMountId: params.targetBlockMountId,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      edgeShape: params.edgeShape,
      userId: params.userId,
      occurredAt: new Date(), // 메타데이터 추가 가능
    };
    
    // 2. Aggregate에 Command 전달
    const aggregate = EdgeAggregate.createEdge(command);
    
    // ...
  }
}

// Aggregate는 Command만 받음
export class EdgeAggregate {
  static createEdge(command: CreateEdgeCommand): EdgeAggregate {
    // Command에서 필요한 데이터 추출
    const edge = new Edge(
      command.edgeId,
      command.pageId,
      command.sourceBlockMountId,
      command.targetBlockMountId,
      command.sourceHandle,
      command.targetHandle,
      command.edgeShape || EdgeShape.default()
    );
    
    // ...
  }
}
```

**이점**:
1. **일관성**: 모든 Aggregate가 동일한 패턴
2. **확장성**: Command에 메타데이터 추가 용이
3. **테스트 용이성**: Command 객체로 테스트 케이스 작성 간단

**문서 수정 필요**:
- Edge 예시를 Command 패턴으로 통일
- "Service에서 Aggregate는 항상 Command 전달" 규칙 추가

---

### 4. 도메인 간 통신 패턴 부재

#### 🔴 현재 문제점

문서에 **도메인 간 통신 방법**이 명시되어 있지 않습니다. 예를 들어:
- Block Management 도메인에서 Block을 생성
- Canvas Management 도메인에서 Block을 마운트
- 두 도메인 간 통신 방법은?

#### ✅ 개선 제안

**패턴 1: Application Service를 통한 통신 (권장)**

```typescript
// ✅ Canvas Management Service가 Block Management Service 호출
export class CanvasBlockMountService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private blockManagementService: BlockManagementService // 도메인 간 통신
  ) {}

  async createAndMountBlock(params: {
    pageId: PageId;
    blockType: BlockType;
    position: Position;
    size: Size;
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<BlockMountAggregate> {
    // 1. Block Management 도메인에 블록 생성 요청
    const blockAggregate = await this.blockManagementService.createBlock({
      blockType: params.blockType,
      workspaceId: params.workspaceId,
      userId: params.userId,
      title: 'New Block',
    });
    
    // 2. Canvas Management 도메인의 Aggregate 생성
    const mountAggregate = BlockMountAggregate.mountBlock(
      BlockMountId.generate(),
      params.pageId,
      blockAggregate.getBlock().id,
      params.position,
      params.size
    );
    
    // 3. 저장 및 이벤트 처리
    await this.blockMountRepository.save(mountAggregate.getBlockMount());
    await this.handleDomainEvents(mountAggregate.getUncommittedEvents());
    mountAggregate.markEventsAsCommitted();
    
    return mountAggregate;
  }
}
```

**패턴 2: 이벤트 기반 통신 (향후 확장용)**

```typescript
// 향후 확장: 도메인 간 이벤트 구독
export class CanvasBlockMountService {
  private async handleBlockCreated(event: BlockCreatedEvent): Promise<void> {
    // Block Management 도메인의 이벤트에 반응
    // 예: 특정 블록 타입이 생성되면 자동으로 마운트
  }
}
```

**문서에 추가 필요**:
- 도메인 간 통신 패턴 섹션 추가
- Application Service 통신 패턴 가이드
- 향후 이벤트 기반 통신 확장 방법

---

### 5. 의존성 주입 패턴 미흡

#### 🔴 현재 문제점

```typescript
// 현재 코드 (문서 2.2, 3.2)
async function updateBlockPropertyInternal(
  request: UpdateBlockPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  // ⚠️ Service 인스턴스를 직접 생성
  const repository = new DrizzleBlockRepository();
  const blockPropertyService = new BlockPropertyService(repository);
  
  // ...
}
```

**문제점**:
1. **테스트 어려움**: Repository를 모킹할 수 없음
2. **결합도 높음**: Infrastructure 레이어에 직접 의존
3. **확장성 제한**: 다른 Repository 구현체로 교체 어려움

#### ✅ 개선 제안

**패턴 1: Factory 패턴 (간단한 해결책)**

```typescript
// Service Factory 생성
export class ServiceFactory {
  static createBlockPropertyService(): BlockPropertyService {
    const repository = new DrizzleBlockRepository();
    return new BlockPropertyService(repository);
  }
}

// Action에서 사용
async function updateBlockPropertyInternal(
  request: UpdateBlockPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<BlockPropertyUpdatedDTO>> {
  const blockPropertyService = ServiceFactory.createBlockPropertyService();
  // ...
}
```

**패턴 2: 의존성 주입 컨테이너 (고급)**

```typescript
// DI Container (예: InversifyJS, TSyringe)
import { container } from './container';

container.register<BlockRepository>('BlockRepository', {
  useClass: DrizzleBlockRepository,
});

container.register<BlockPropertyService>('BlockPropertyService', {
  useClass: BlockPropertyService,
});

// Action에서 사용
async function updateBlockPropertyInternal(...) {
  const blockPropertyService = container.get<BlockPropertyService>(
    'BlockPropertyService'
  );
  // ...
}
```

**권장 사항**: Next.js 환경에서는 **Factory 패턴**이 단순하고 충분합니다.

**문서에 추가 필요**:
- 의존성 주입 패턴 가이드
- 테스트를 위한 모킹 전략

---

### 6. 트랜잭션 경계 명확화 부족

#### 🔴 현재 문제점

문서에 **트랜잭션 경계**가 명확하지 않습니다:
- Repository 저장과 이벤트 처리가 별도 작업
- 실패 시 롤백 전략 부재
- 여러 Aggregate 작업 시 트랜잭션 범위 불명확

#### ✅ 개선 제안

```typescript
// ✅ 트랜잭션 경계 명확화
export class BlockManagementService {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly dbTransaction: DbTransaction // 트랜잭션 관리자
  ) {}

  async createBlock(params: { ... }): Promise<BlockAggregate> {
    // 트랜잭션 시작
    return await this.dbTransaction.execute(async (tx) => {
      // 1. Aggregate 생성
      const aggregate = BlockAggregate.create(createBlockCommand);
      
      // 2. Repository 저장 (트랜잭션 내)
      await this.blockRepository.create(aggregate.getBlock(), tx);
      
      // 3. 이벤트 처리 (트랜잭션 내)
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events, tx);
      
      // 4. 이벤트 커밋
      aggregate.markEventsAsCommitted();
      
      // 5. 트랜잭션 커밋 (모든 작업 성공 시)
      return aggregate;
    });
    // 실패 시 자동 롤백
  }
}
```

**문서에 추가 필요**:
- 트랜잭션 경계 정의
- 트랜잭션 관리 패턴
- 롤백 전략

---

### 7. 이벤트 처리 순서 및 의존성 관리

#### 🔴 현재 문제점

```typescript
// 현재 코드: 모든 이벤트를 병렬 처리
private async handleDomainEvents(events: Array<any>): Promise<void> {
  const results = await Promise.allSettled(
    events.map(async event => { ... })
  );
}
```

**문제점**:
1. **이벤트 순서 무시**: Event Storming에서 정의한 순서가 중요할 수 있음
2. **의존성 처리 없음**: 이벤트 간 의존성이 있을 수 있음
3. **실패 전파**: 하나의 이벤트 실패가 전체에 영향?

#### ✅ 개선 제안

```typescript
// 이벤트 처리 전략 정의
interface EventProcessingStrategy {
  processSequentially?: boolean; // 순차 처리 여부
  stopOnFailure?: boolean; // 실패 시 중단 여부
  retryable?: boolean; // 재시도 가능 여부
}

private async handleDomainEvents(
  events: Array<any>,
  strategy: EventProcessingStrategy = {
    processSequentially: false,
    stopOnFailure: false,
    retryable: true,
  }
): Promise<void> {
  if (strategy.processSequentially) {
    // 순차 처리 (의존성이 있는 경우)
    for (const event of events) {
      try {
        await this.processEvent(event);
      } catch (error) {
        if (strategy.stopOnFailure) {
          throw error;
        }
        // 로깅 및 계속
      }
    }
  } else {
    // 병렬 처리 (독립적인 경우)
    const results = await Promise.allSettled(
      events.map(event => this.processEvent(event))
    );
    
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0 && strategy.stopOnFailure) {
      throw new Error('Event processing failed');
    }
  }
}
```

**문서에 추가 필요**:
- 이벤트 처리 전략 가이드
- 순차 vs 병렬 처리 기준
- 이벤트 의존성 관리 방법

---

### 8. 성능 고려사항

#### ⚠️ 개선 제안

현재 패턴은 **동기적 이벤트 처리**를 기본으로 하므로, 이벤트 핸들러가 무거우면 응답 시간이 길어질 수 있습니다.

**최적화 전략**:

1. **경량 이벤트 핸들러**: 핵심 작업만 동기 처리
2. **비동기 작업 분리**: 무거운 작업은 Outbox Pattern으로 분리
3. **캐싱 전략**: 반복적인 이벤트 핸들러 결과 캐싱

```typescript
private async handleDomainEvents(events: Array<any>): Promise<void> {
  // 경량 작업: 동기 처리
  const lightweightEvents = events.filter(e => this.isLightweight(e));
  await Promise.all(lightweightEvents.map(e => this.processLightweight(e)));
  
  // 무거운 작업: Outbox에 추가 (비동기 처리)
  const heavyweightEvents = events.filter(e => !this.isLightweight(e));
  await this.eventOutbox.enqueue(heavyweightEvents);
}
```

---

## 🎯 우선순위별 개선 사항

### 🔴 높은 우선순위 (즉시 개선)

1. **Repository 반환 타입 통일** (Entity만 반환, Aggregate 재구성은 Service에서)
2. **이벤트 처리 실패 시 롤백 전략** 명시
3. **Command 패턴 일관성** (Service → Aggregate는 항상 Command)

### 🟡 중간 우선순위 (단기 개선)

4. **도메인 간 통신 패턴** 문서화
5. **의존성 주입 패턴** 개선 (Factory 패턴)
6. **트랜잭션 경계** 명확화

### 🟢 낮은 우선순위 (장기 개선)

7. **이벤트 처리 전략** 고도화 (순차/병렬, 의존성 관리)
8. **성능 최적화** (경량/무거운 작업 분리)

---

## 📝 문서 수정 체크리스트

- [ ] Section 5.2, 5.3: Repository 반환 타입을 Entity로 통일
- [ ] Section 3.2: 이벤트 처리 실패 시 롤백 전략 추가
- [ ] Edge 예시: Command 패턴으로 변경
- [ ] 새로운 섹션: "도메인 간 통신 패턴" 추가
- [ ] 새로운 섹션: "의존성 주입 패턴" 추가
- [ ] 새로운 섹션: "트랜잭션 경계 및 롤백 전략" 추가
- [ ] 새로운 섹션: "이벤트 처리 전략" 추가

---

## 🎓 결론

현재 컨벤션은 **DDD 원칙을 잘 따르고 있으며 실용적**입니다. 특히:
- 레이어 분리와 책임 분리가 명확
- Trust Boundary를 고려한 보안 전략 우수
- Event Storming과의 매칭이 잘 되어 있음

다만, **아키텍처 일관성**과 **확장성** 측면에서 개선이 필요합니다:
- Repository 반환 타입 통일
- 이벤트 처리 실패 전략 명시
- Command 패턴 일관성 확보

이러한 개선을 통해 **더 견고하고 확장 가능한 아키텍처**를 구축할 수 있을 것입니다.

---

**최종 업데이트**: 2025-01-XX  
**평가 버전**: v1.0

