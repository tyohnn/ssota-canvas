# Next.js Server Actions Framework 제안서

## 📋 개요

이 문서는 Next.js Server Actions를 위한 **DDD(Domain-Driven Design) 통합 프레임워크** 제안서입니다. 현재 프로젝트에서 사용 중인 보안 패턴과 DDD 패턴을 기반으로, 재사용 가능한 프레임워크/라이브러리 개발 가능성을 탐색합니다.

**작성일**: 2026-01-01  
**상태**: 🧪 제안 단계

---

## 🎯 배경 및 동기

### 현재 상황

Next.js Server Actions는 강력한 기능이지만, 보안과 DDD 패턴 적용을 위해 매번 반복적인 보일러플레이트 코드를 작성해야 합니다:

```typescript
// 매번 반복되는 패턴
export async function createOrderAction(request: unknown) {
  // 1. 검증
  const parseResult = Schema.safeParse(request);
  // 2. 인증
  const user = await getAuthenticatedUser();
  // 3. 권한 확인
  const access = await verifyAccess(user.id);
  // 4. SafeDTO → Command 변환
  const command = createCommand(safeDto);
  // 5. Aggregate 생성
  const aggregate = Aggregate.create(command);
  // 6. Repository 저장
  await repository.save(aggregate);
  // 7. Event 발행
  await publishEvents(aggregate.getEvents());
  // 8. Response 반환
  return ok(aggregate.toView());
}
```

### 목표

- ✅ 반복적인 보안/DDD 패턴을 자동화
- ✅ 타입 안전성 보장
- ✅ Event Sourcing 준비
- ✅ 재사용 가능한 프레임워크/라이브러리화

---

## 📊 시장 분석

### 기존 라이브러리 현황

| 라이브러리 | 주간 다운로드 | 주요 기능 | DDD 지원 | Event Sourcing |
|-----------|-------------|----------|---------|----------------|
| **next-safe-action** | ~67,000 | Validation, Middleware, Type Safety | ❌ | ❌ |
| **zsa** | ~5,000 (추정) | Validation, Simple API | ❌ | ❌ |

### next-safe-action 상세 분석

**강점:**
- ✅ 강력한 미들웨어 시스템 (v8)
- ✅ Type-safe end-to-end
- ✅ Zod validation 통합
- ✅ Instance-level & Action-level middleware

**약점:**
- ❌ 인증 어댑터 없음 (직접 구현 필요)
- ❌ 권한 체크 시스템 없음 (직접 구현 필요)
- ❌ DDD 통합 없음
- ❌ Event Sourcing 지원 없음

**예시 코드:**
```typescript
// next-safe-action 스타일
const actionClient = createSafeActionClient()
  .use(async ({ next, clientInput }) => {
    // 미들웨어는 있지만, DDD 패턴은 직접 구현해야 함
    const result = await next();
    return result;
  });
```

### 시장 Gap 분석

| 기능 영역 | next-safe-action | **제안 프레임워크** |
|----------|-----------------|-------------------|
| Validation (Zod) | ✅ 있음 | 차별화 어려움 |
| Middleware Chain | ✅ 있음 | 차별화 어려움 |
| Auth Integration | ⚠️ 직접 구현 | **기회!** (어댑터 제공) |
| Authorization | ⚠️ 직접 구현 | **기회!** (RBAC/ABAC) |
| **DDD Integration** | ❌ 없음 | **🔥 큰 기회!** |
| **Event Sourcing** | ❌ 없음 | **🔥 큰 기회!** |
| **Command/Event Pattern** | ❌ 없음 | **🔥 큰 기회!** |

### 결론

**next-safe-action**은 이미 미들웨어 시스템이 잘 구축되어 있지만, **DDD + Event Sourcing 통합**은 아무도 하지 않고 있습니다.

**추천 전략:**
1. **next-safe-action 위에 DDD 레이어를 추가**하는 플러그인으로 접근
2. 또는 독자적인 **DDD-first Server Actions Framework** 구축

---

## 💡 제안하는 API 디자인

### 1. 기본 사용법 (Simple)

```typescript
import { createSecureAction } from 'next-action-guard';

export const createPostAction = createSecureAction()
  .schema(CreatePostSchema)
  .auth()  // 인증 필수
  .handler(async ({ data, user }) => {
    // data: Validated, user: Authenticated
    return { success: true };
  });
```

### 2. 리소스 기반 권한 (Resource-based Authorization)

```typescript
export const updatePostAction = createSecureAction()
  .schema(UpdatePostSchema)
  .auth()
  .authorize({
    resource: 'post',
    action: 'update',
    getResourceId: (data) => data.postId,
  })
  .handler(async ({ data, user, resource }) => {
    // resource: 이미 조회된 Post 엔티티
  });
```

### 3. 커스텀 미들웨어 체인

```typescript
export const adminOnlyAction = createSecureAction()
  .schema(AdminActionSchema)
  .auth()
  .use(requireRole('admin'))        // 역할 확인
  .use(rateLimit({ max: 10 }))      // Rate limiting
  .use(auditLog('admin-action'))    // 감사 로그
  .handler(async ({ data, user }) => {
    // Admin 전용 로직
  });
```

### 4. DDD 통합 (핵심 차별화 포인트) ⭐️

```typescript
export const createOrderAction = createSecureAction()
  .schema(CreateOrderSchema)
  .auth()
  .withCommand(CreateOrderCommand)  // SafeDTO → Command 자동 변환
  .withAggregate(OrderAggregate)    // Aggregate 연동
  .publishEvents()                   // Domain Event 발행
  .handler(async ({ command, aggregate, events }) => {
    // Event Sourcing Ready!
    return aggregate.toView();
  });
```

### 5. Context 추상화 및 확장성 🔌

프레임워크는 도메인 독립적인 `BaseActionContext`를 제공하고, 프로젝트별로 커스텀 Context를 주입할 수 있습니다:

```typescript
// 📦 Core 패키지 (도메인 독립적)
interface BaseActionContext<TUser = unknown> {
  user: TUser;
}

interface ContextBuilder<TRequest, TUser, TContext extends BaseActionContext<TUser>> {
  build(request: TRequest, user: TUser): Promise<TContext>;
}

// 📦 프로젝트별 어댑터 (예: Page-based 권한 시스템)
interface PageBasedActionContext extends BaseActionContext<AuthenticatedUser> {
  authenticatedUser: AuthenticatedUser;
  workspace: Workspace;
  page: Page;
}

class PageBasedContextBuilder 
  implements ContextBuilder<{ pageId: string }, AuthenticatedUser, PageBasedActionContext> {
  async build(
    request: { pageId: string },
    user: AuthenticatedUser
  ): Promise<PageBasedActionContext> {
    const accessResult = await verifyAccessByPageId(request.pageId, user.id);
    return {
      authenticatedUser: user,
      workspace: accessResult.workspace!,
      page: accessResult.page!,
    };
  }
}

// 사용 예시
export const createAndMountBlockAction = createSecureAction()
  .schema(CreateAndMountBlockRequestSchema)
  .auth()
  .withContext(new PageBasedContextBuilder()) // ✅ 커스텀 Context Builder 주입
  .handler(async ({ data, context }) => {
    // context: PageBasedActionContext 타입으로 추론됨
    const { authenticatedUser, workspace, page } = context;
    // 중복 조회 없이 바로 사용 가능
  });
```

**장점:**
- ✅ Core는 도메인 독립적 (오픈소스화 가능)
- ✅ 프로젝트별 Context 어댑터로 확장 가능
- ✅ 타입 안전성 보장 (TypeScript 제네릭)
- ✅ 중복 조회 제거 (검증된 리소스를 Context에 포함)

---

## 🔍 DDD 패턴 상세 설명

### 패턴 없이 vs 패턴 사용 비교

#### ❌ DDD 패턴 없이 (현재 방식)

```typescript
'use server';

export async function createOrderAction(request: unknown) {
  // 1️⃣ 검증
  const parseResult = CreateOrderSchema.safeParse(request);
  if (!parseResult.success) return err('Invalid request');
  
  const safeDto = parseResult.data;
  
  // 2️⃣ 인증/권한
  const user = await getAuthenticatedUser();
  const accessResult = await verifyAccess(user.id, safeDto.shopId);
  if (!accessResult.success) return err('Unauthorized');
  
  // 3️⃣ 🔴 여기서부터 개발자가 직접 DDD 패턴을 구현해야 함
  
  // SafeDTO → Command 변환 (Value Objects 생성)
  const command: CreateOrderCommand = {
    shopId: new ShopId(safeDto.shopId),
    customerId: new CustomerId(safeDto.customerId),
    items: safeDto.items.map(item => ({
      productId: new ProductId(item.productId),
      quantity: new Quantity(item.quantity),
      price: new Money(item.price),
    })),
    shippingAddress: new Address(safeDto.shippingAddress),
    userId: user.id,
  };
  
  // 4️⃣ 🔴 Aggregate에 Command 전달
  const orderAggregate = OrderAggregate.create(command);
  
  // 5️⃣ 🔴 Repository에 저장
  const orderRepository = new DrizzleOrderRepository();
  await orderRepository.save(orderAggregate);
  
  // 6️⃣ 🔴 Domain Events 추출 및 발행
  const events = orderAggregate.getUncommittedEvents();
  
  // 각 이벤트 핸들러 직접 호출
  for (const event of events) {
    if (event instanceof OrderCreatedEvent) {
      // 이메일 전송
      await emailService.sendOrderConfirmation(event);
      // 재고 감소
      await inventoryService.decreaseStock(event);
      // 분석 로깅
      await analyticsService.trackOrder(event);
    }
  }
  
  // 7️⃣ 🔴 이벤트 커밋
  orderAggregate.markEventsAsCommitted();
  
  // 8️⃣ Response 반환
  return ok(orderAggregate.toView());
}
```

**문제점:**
- 🔴 3~7단계를 모든 Action에서 반복해야 함
- 🔴 Value Object 생성 로직이 각 Action에 흩어짐
- 🔴 Event 발행 로직이 중복됨
- 🔴 실수로 이벤트 발행을 잊을 수 있음

#### ✅ DDD 패턴 사용 시 (제안 방식)

```typescript
'use server';

export const createOrderAction = createSecureAction()
  .schema(CreateOrderSchema)
  .auth()
  .authorize({
    resource: 'shop',
    getResourceId: data => data.shopId,
  })
  // ✨ 여기가 핵심! DDD 자동화
  .withCommand(CreateOrderCommand)   // SafeDTO → Command 자동 변환
  .withAggregate(OrderAggregate)     // Aggregate 생성 및 실행
  .publishEvents()                    // Event 자동 발행
  .handler(async ({ aggregate, events }) => {
    // ✅ 이미 모든 게 완료됨!
    // aggregate: 생성된 OrderAggregate
    // events: 발행된 이벤트 목록
    
    return aggregate.toView();
  });
```

**장점:**
- ✅ 40줄 → 15줄로 코드 감소
- ✅ DDD 패턴이 자동으로 적용됨
- ✅ 실수 방지 (이벤트 발행 자동화)
- ✅ 테스트 용이성 향상

---

### 내부 동작 원리

#### `.withCommand()` 내부 구현

```typescript
function withCommand<TDto, TCommand>(
  CommandClass: CommandFactory<TDto, TCommand>
) {
  return (context: ActionContext<TDto>) => {
    // SafeDTO → Command 자동 변환
    // CommandClass에 정의된 매핑 규칙을 사용
    const command = CommandClass.fromDto(context.data);
    
    return {
      ...context,
      command,  // context에 command 추가
    };
  };
}

// CommandClass 정의 예시
class CreateOrderCommand {
  constructor(
    public readonly shopId: ShopId,
    public readonly customerId: CustomerId,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address,
    public readonly userId: string
  ) {}
  
  // ✨ SafeDTO → Command 변환 규칙 정의
  static fromDto(dto: CreateOrderRequest): CreateOrderCommand {
    return new CreateOrderCommand(
      new ShopId(dto.shopId),
      new CustomerId(dto.customerId),
      dto.items.map(item => ({
        productId: new ProductId(item.productId),
        quantity: new Quantity(item.quantity),
        price: new Money(item.price),
      })),
      new Address(dto.shippingAddress),
      dto.userId
    );
  }
}
```

#### `.withAggregate()` 내부 구현

```typescript
function withAggregate<TCommand, TAggregate>(
  AggregateClass: AggregateFactory<TCommand, TAggregate>
) {
  return async (context: ActionContext & { command: TCommand }) => {
    // Command → Aggregate 생성 (정적 팩토리 메서드 호출)
    const aggregate = AggregateClass.handle(context.command);
    
    // Repository에 자동 저장
    const repository = context.getRepository(AggregateClass);
    await repository.save(aggregate);
    
    return {
      ...context,
      aggregate,  // context에 aggregate 추가
    };
  };
}

// Aggregate 정의 예시
class OrderAggregate {
  private uncommittedEvents: DomainEvent[] = [];
  
  // ✨ Command를 받아 Aggregate 생성 + Event 발생
  static handle(command: CreateOrderCommand): OrderAggregate {
    const orderId = OrderId.generate();
    
    const aggregate = new OrderAggregate(
      orderId,
      command.shopId,
      command.customerId,
      command.items,
      command.shippingAddress
    );
    
    // Domain Event 발생 (자동!)
    aggregate.addDomainEvent(
      new OrderCreatedEvent({
        orderId: orderId.value,
        shopId: command.shopId.value,
        customerId: command.customerId.value,
        items: command.items,
        occurredAt: new Date(),
      })
    );
    
    return aggregate;
  }
}
```

#### `.publishEvents()` 내부 구현

```typescript
function publishEvents(eventBus?: EventBus) {
  return async (context: ActionContext & { aggregate: AggregateRoot }) => {
    const events = context.aggregate.getUncommittedEvents();
    
    // 등록된 EventBus로 이벤트 발행
    const bus = eventBus || context.getEventBus();
    
    for (const event of events) {
      await bus.publish(event);
      
      // 예: OrderCreatedEvent가 발행되면
      // - EmailHandler가 이메일 전송
      // - InventoryHandler가 재고 감소
      // - AnalyticsHandler가 분석 로깅
    }
    
    // 이벤트 커밋
    context.aggregate.markEventsAsCommitted();
    
    return {
      ...context,
      events,  // context에 events 추가
    };
  };
}

// EventBus 설정 예시
const eventBus = new EventBus();

eventBus.subscribe(OrderCreatedEvent, [
  new SendOrderConfirmationEmailHandler(),
  new DecreaseInventoryHandler(),
  new TrackOrderAnalyticsHandler(),
]);
```

---

### 전체 흐름 비교

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ❌ 패턴 없이 (현재 방식)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  request → Schema.parse() → 인증 → 권한 → SafeDTO                    │
│                                       ↓                              │
│                           🔴 개발자가 직접:                           │
│                           1. SafeDTO → Command 변환                  │
│                           2. Value Objects 생성                      │
│                           3. Aggregate.create(command) 호출          │
│                           4. repository.save(aggregate)              │
│                           5. events 추출                             │
│                           6. 각 event 핸들러 호출                    │
│                           7. markEventsAsCommitted()                 │
│                                       ↓                              │
│                                   Response                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ✅ DDD 패턴 사용 시 (제안 방식)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  request → .schema() → .auth() → .authorize() → SafeDTO              │
│                                       ↓                              │
│                    ✨ .withCommand(CreateOrderCommand)               │
│                    (자동: SafeDTO → Command 변환)                    │
│                                       ↓                              │
│                    ✨ .withAggregate(OrderAggregate)                 │
│                    (자동: Aggregate 생성 + 저장)                     │
│                                       ↓                              │
│                    ✨ .publishEvents()                               │
│                    (자동: Event 추출 + 발행 + 커밋)                  │
│                                       ↓                              │
│                    .handler({ aggregate, events }) →                 │
│                    (개발자: 추가 로직만 작성)                         │
│                                       ↓                              │
│                                   Response                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 제안하는 패키지 구조

```
next-action-guard/
├── packages/
│   ├── core/                    # 핵심 HOF, 타입
│   │   ├── src/
│   │   │   ├── create-secure-action.ts
│   │   │   ├── middleware/
│   │   │   │   ├── types.ts
│   │   │   │   ├── chain.ts
│   │   │   │   └── built-in/
│   │   │   │       ├── rate-limit.ts
│   │   │   │       ├── audit-log.ts
│   │   │   │       └── cache.ts
│   │   │   ├── validation/
│   │   │   ├── context/
│   │   │   │   ├── types.ts          # BaseActionContext
│   │   │   │   └── builder.ts        # ContextBuilder 인터페이스
│   │   │   ├── ddd/
│   │   │   │   ├── command.ts
│   │   │   │   ├── aggregate.ts
│   │   │   │   └── event.ts
│   │   │   └── result/
│   │   └── package.json
│   │
│   ├── auth-supabase/           # Supabase 어댑터
│   ├── auth-nextauth/           # NextAuth 어댑터
│   ├── auth-clerk/              # Clerk 어댑터
│   │
│   ├── authorize-rbac/           # RBAC 권한 체크
│   ├── authorize-abac/          # ABAC 권한 체크
│   │
│   ├── context-page-based/        # Page-based Context 어댑터 (예시)
│   │
│   └── ddd/                     # DDD 통합 (선택적)
│       ├── command/
│       ├── aggregate/
│       └── event/
│
├── examples/
│   ├── with-supabase/
│   ├── with-nextauth/
│   └── with-ddd/
│
└── docs/
```

---

## 🎯 차별화 포인트

### 1. Builder Pattern API
```typescript
// 체이닝으로 직관적인 설정
createSecureAction()
  .schema(...)
  .auth()
  .authorize(...)
  .use(...)
  .handler(...)
```

### 2. Type-Safe End-to-End
```typescript
// 모든 단계에서 타입 추론
const action = createSecureAction()
  .schema(z.object({ postId: z.string() }))
  .auth()
  .handler(async ({ data, user }) => {
    data.postId  // ✅ string으로 추론
    user.id      // ✅ User 타입으로 추론
  });
```

### 3. Middleware Composition
```typescript
// Express처럼 미들웨어 조합
const adminAction = createSecureAction()
  .use(requireAuth)
  .use(requireRole('admin'))
  .use(rateLimit({ max: 10, window: '1m' }))
  .use(auditLog());
```

### 4. Resource-based Authorization
```typescript
// 리소스 기반 권한 (ABAC/RBAC)
.authorize({
  resource: 'post',
  action: 'update',
  getResourceId: (data) => data.postId,
  policy: async (user, post) => {
    return user.id === post.authorId || user.role === 'admin';
  },
})
```

### 5. DDD Integration (Unique!) ⭐️
```typescript
// Event Storming + DDD 패턴 지원
.withCommand(CreateOrderCommand)
.withAggregate(OrderAggregate)
.publishEvents(eventBus)
```

### 6. Context 추상화 및 확장성 🔌
```typescript
// 프로젝트별 Context 어댑터로 확장 가능
.withContext(new PageBasedContextBuilder())
// 또는
.withContext(new OrganizationBasedContextBuilder())
// Core는 도메인 독립적, 프로젝트는 자유롭게 확장
```

---

## 📊 비교표

| 기능 | next-safe-action | zsa | **제안 프레임워크** |
|------|-----------------|-----|-------------------|
| Zod Validation | ✅ | ✅ | ✅ |
| Type Safety | ✅ | ✅ | ✅ |
| Middleware Chain | ✅ | ❌ | ✅ |
| Auth Integration | ❌ | ❌ | ✅ |
| Authorization | ❌ | ❌ | ✅ |
| Rate Limiting | ❌ | ❌ | ✅ |
| Audit Logging | ❌ | ❌ | ✅ |
| **DDD Support** | ❌ | ❌ | ✅ |
| **Event Sourcing** | ❌ | ❌ | ✅ |
| **Command/Event Pattern** | ❌ | ❌ | ✅ |
| **Context Abstraction** | ❌ | ❌ | ✅ |

---

## 🚀 구현 로드맵

### Phase 1: MVP (2-3주)
- [ ] Core HOF 구현
- [ ] Zod Validation
- [ ] Supabase Auth Adapter
- [ ] Basic Middleware Chain
- [ ] BaseActionContext 및 ContextBuilder 인터페이스

### Phase 2: Auth Adapters (2주)
- [ ] NextAuth Adapter
- [ ] Clerk Adapter
- [ ] Custom Adapter Interface

### Phase 3: Authorization (2주)
- [ ] RBAC Implementation
- [ ] Resource-based Authorization
- [ ] Policy Engine

### Phase 4: Advanced Features (3주)
- [ ] Rate Limiting
- [ ] Audit Logging
- [ ] Caching
- [ ] Error Handling

### Phase 5: DDD Integration (3주) ⭐️
- [ ] Command Factory
- [ ] Aggregate Runner
- [ ] Event Publisher
- [ ] Event Store Integration

---

## 💰 시장 가능성

### 타겟 사용자
1. **Next.js App Router 사용자**: Server Actions 보안 필요
2. **Enterprise 개발자**: 체계적인 보안 패턴 필요
3. **DDD 실천자**: Event Sourcing 지원 필요

### 경쟁 우위
- ✅ **DDD 통합**: 현재 시장에 없는 기능
- ✅ **Event Sourcing**: 독보적인 차별점
- ✅ **Context 추상화**: 도메인 독립적 Core + 확장 가능한 어댑터 패턴
- ✅ **실전 검증**: 이미 프로젝트에서 사용 중인 패턴
- ✅ **타입 안전성**: End-to-end 타입 추론

---

## 🤔 고려사항

### 장점
- ✅ 현재 시장에 비슷한 패키지 없음 (블루오션)
- ✅ Next.js App Router 사용자 증가 추세
- ✅ 이미 프로젝트에서 검증된 패턴
- ✅ DDD 통합은 독보적인 차별점

### 단점/리스크
- ⚠️ Next.js의 Server Actions API가 변경될 수 있음
- ⚠️ 유지보수 부담 (오픈소스)
- ⚠️ 초기 사용자 확보 필요
- ⚠️ next-safe-action과의 차별화 필요

### 이름 후보
1. `next-action-guard` - 보안 중심
2. `next-action-kit` - 도구 모음 느낌
3. `next-secure-actions` - 직관적
4. `next-ddd-actions` - DDD 강조
5. `actionify` - 간결함

---

## 📚 참고 자료

### 기존 라이브러리
- [next-safe-action](https://next-safe-action.dev/) - 미들웨어 시스템이 잘 구축됨
- [zsa](https://github.com/sachinraja/zsa) - 간단한 타입 안전 Server Actions

### 관련 문서
- [Server-Side DDD 컨벤션](./server-side-ddd-conventions.md) - 현재 프로젝트의 DDD 패턴
- [Next.js Server Actions 보안 가이드](https://nextjs.org/blog/security-nextjs-server-components-actions)

### 관련 논의
- [Event Sourcing with Next.js](https://upstash.com/blog/nextjs-kafka-upstash-cqrs)
- [DDD + Next.js 예제](https://github.com/lapidix/nextjs-fsd-ddd-example)

---

## 🎓 결론

### 핵심 가치 제안

1. **DDD 통합**: Command/Aggregate/Event 패턴 자동화
2. **Event Sourcing 준비**: Domain Event 기반 아키텍처
3. **보안 강화**: Defense in Depth 패턴 적용
4. **Context 추상화**: 도메인 독립적 Core + 프로젝트별 확장 가능한 어댑터 패턴
5. **개발자 경험**: 반복 코드 제거, 타입 안전성, 중복 조회 제거

### 다음 단계

1. **프로토타입 개발**: MVP로 핵심 기능 검증
2. **커뮤니티 피드백**: Next.js 커뮤니티에서 의견 수집
3. **오픈소스화**: GitHub에 공개하여 사용자 확보
4. **문서화**: 상세한 문서와 예제 제공

---

**작성자**: AI Assistant  
**검토 필요**: 팀 리뷰 및 피드백 수집  
**상태**: 🧪 제안 단계 - 구현 전 검토 필요
