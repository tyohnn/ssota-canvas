# 도메인 이벤트 사용 분석 및 개선 방안

**작성일**: 2025-10-27  
**버전**: v1.0

---

## 🔍 현재 상황 분석

### 현재 구현
```typescript
// 1. Aggregate에서 이벤트 생성
class BlockMountAggregate {
  static mountBlock(...) {
    const blockMount = BlockMount.create(...);
    const event = new BlockMountedEvent(...);
    aggregate._events.push(event); // 이벤트 저장
    return aggregate;
  }
}

// 2. Service에서 이벤트 처리
class CanvasBlockMountService {
  async createAndMountBlock(command) {
    const mountAggregate = BlockMountAggregate.mountBlock(...);
    await repository.save(mountAggregate);
    
    // 같은 서비스 내에서 이벤트 처리
    const events = mountAggregate.getUncommittedEvents();
    await this.handleDomainEvents(events); // ❌ 의미 없음
  }
}
```

---

## ❌ 문제점

### 1. **같은 서비스 내 이벤트 처리**
- **문제**: 이벤트를 생성하고 바로 같은 서비스에서 처리
- **결과**: 단순한 메서드 호출을 이벤트로 감싸는 오버엔지니어링
- **의미**: 없음 (직접 메서드 호출과 동일)

### 2. **동기적 처리**
- **문제**: 이벤트를 동기적으로 처리
- **결과**: 이벤트의 비동기적 장점을 활용하지 못함
- **의미**: 없음 (순차 실행과 동일)

### 3. **과도한 복잡성**
- **문제**: 단순한 비즈니스 로직을 이벤트로 복잡하게 만듦
- **결과**: 코드 이해도 저하, 유지보수 어려움
- **의미**: 없음 (YAGNI 원칙 위반)

---

## ✅ 도메인 이벤트가 의미 있는 경우

### 1. **도메인 간 통신**
```typescript
// ✅ 의미 있음: Block Management → Canvas Management
class BlockManagementService {
  async createBlock(command) {
    const aggregate = BlockAggregate.create(command);
    await this.blockRepository.save(aggregate);
    
    // 다른 도메인에 이벤트 발행
    await this.eventBus.publish(new BlockCreatedEvent(aggregate.getBlock()));
  }
}

class CanvasManagementService {
  @EventHandler(BlockCreatedEvent)
  async handleBlockCreated(event) {
    // 자동으로 캔버스에 마운트
    await this.autoMountBlock(event.blockId);
  }
}
```

### 2. **외부 시스템 연동**
```typescript
// ✅ 의미 있음: 외부 시스템과의 비동기 통신
@EventHandler(BlockCreatedEvent)
async handleBlockCreated(event) {
  // 알림 서비스에 전송
  await this.notificationService.sendBlockCreated(event);
  
  // 분석 서비스에 전송
  await this.analyticsService.trackBlockCreated(event);
  
  // 웹훅 전송
  await this.webhookService.notify(event);
}
```

### 3. **비동기 처리**
```typescript
// ✅ 의미 있음: 무거운 작업을 백그라운드에서 처리
@EventHandler(BlockCreatedEvent)
async handleBlockCreated(event) {
  // 이미지 최적화 (비동기)
  this.imageOptimizationQueue.add(event.blockId);
  
  // AI 분석 (비동기)
  this.aiAnalysisQueue.add(event.blockId);
  
  // 통계 업데이트 (비동기)
  this.statisticsQueue.add(event.blockId);
}
```

### 4. **이벤트 소싱**
```typescript
// ✅ 의미 있음: 모든 상태 변경을 이벤트로 저장
class EventStore {
  async saveEvents(events: DomainEvent[]) {
    // 감사 로그, 복원 가능한 상태 관리
    await this.eventRepository.save(events);
  }
}
```

---

## 🎯 현재 프로젝트에 대한 권장사항

### **Option 1: 이벤트 제거 (권장)**

현재 Next.js 서버리스 환경에서는 **이벤트를 제거하고 단순한 메서드 호출**로 변경:

```typescript
// ✅ 개선된 코드
class BlockMountAggregate {
  static mountBlock(...) {
    const blockMount = BlockMount.create(...);
    return new BlockMountAggregate(blockMount);
    // 이벤트 제거 - 단순한 생성자 호출
  }
}

class CanvasBlockMountService {
  async createAndMountBlock(command) {
    const mountAggregate = BlockMountAggregate.mountBlock(...);
    await repository.save(mountAggregate);
    
    // 직접 메서드 호출로 사이드 이펙트 처리
    await this.handleBlockMounted(mountAggregate);
    
    return { mountAggregate, blockEntity };
  }
  
  // Policy를 직접 메서드로 구현
  private async handleBlockMounted(aggregate: BlockMountAggregate) {
    // 자동 엣지 연결 확인
    await this.checkAutoConnectEdges(aggregate);
    
    // 캔버스 레이아웃 최적화
    await this.optimizeCanvasLayout(aggregate);
  }
}
```

### **Option 2: 진짜 이벤트 패턴 구현**

만약 이벤트가 필요하다면 **Event Bus와 비동기 처리**를 구현:

```typescript
// Event Bus 구현
class EventBus {
  private handlers = new Map<string, Function[]>();
  
  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }
  
  subscribe(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
}

// 사용
class CanvasBlockMountService {
  async createAndMountBlock(command) {
    const mountAggregate = BlockMountAggregate.mountBlock(...);
    await repository.save(mountAggregate);
    
    // 이벤트 발행 (비동기)
    const events = mountAggregate.getUncommittedEvents();
    await Promise.all(events.map(event => this.eventBus.publish(event)));
    
    mountAggregate.markEventsAsCommitted();
    return { mountAggregate, blockEntity };
  }
}
```

---

## 📊 결론

### 현재 상황
- **같은 서비스 내 동기적 이벤트 처리** = 의미 없음
- **과도한 복잡성** = 오버엔지니어링
- **YAGNI 원칙 위반** = 필요하지 않은 기능

### 권장사항
1. **이벤트 제거**: 단순한 메서드 호출로 변경
2. **Policy 직접 구현**: 사이드 이펙트를 명시적 메서드로 처리
3. **향후 확장**: 필요할 때 진짜 이벤트 패턴 도입

### 언제 이벤트를 도입할까?
- ✅ **도메인 간 통신**이 필요할 때
- ✅ **외부 시스템 연동**이 필요할 때  
- ✅ **비동기 처리**가 필요할 때
- ✅ **이벤트 소싱**이 필요할 때

**현재는 이벤트 없이 단순하게 가는 것이 최선입니다!** 🎯
