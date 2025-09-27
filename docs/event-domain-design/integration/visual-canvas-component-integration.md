# Visual Canvas ↔ Component System Integration

## 🎯 Integration Overview

Visual Canvas Context와 Component System Context 간의 통합 설계로, 두 독립적인 Bounded Context가 협력하여 통합된 사용자 경험을 제공합니다.

---

## 🔄 언어적 경계 및 Integration Points

### 언어적 차이 분석

| Visual Canvas Context | Component System Context | 통합 지점 |
|---------------------|-------------------------|---------|
| "블럭을 캔버스에 배치한다" | "인스턴스를 생성한다" | Instance Creation |
| "블럭을 이동한다" | "인스턴스 위치를 업데이트한다" | Position Sync |
| "블럭 속성을 변경한다" | "속성을 오버라이드한다" | Property Override |
| "블럭을 삭제한다" | "인스턴스를 제거한다" | Instance Removal |
| "블럭을 복사한다" | "새 인스턴스를 생성한다" | Instance Duplication |

### Integration Events 정의

#### 1. Component System → Visual Canvas

```typescript
// 인스턴스 생성 요청
interface ComponentInstanceRequested {
  componentId: ComponentId
  targetPageId: PageId
  position: Position
  requestedBy: UserId
  timestamp: Date
}

// 인스턴스 속성 변경 알림
interface InstancePropertyChanged {
  instanceId: InstanceId
  propertyKey: PropertyKey
  newValue: PropertyValue
  isOverride: boolean
  timestamp: Date
}

// 인스턴스 분리 알림 (컴포넌트 삭제 시 또는 개별 분리)
interface InstanceDetachedFromComponent {
  instanceId: InstanceId
  formerComponentId: ComponentId
  newBlockId: BlockId
  preservedProperties: Map<PropertyKey, PropertyValue>
  detachmentReason: 'component_deletion' | 'manual_detach'
  timestamp: Date
}
```

#### 2. Visual Canvas → Component System

```typescript
// 블럭의 컴포넌트 변환 요청
interface BlockComponentConversionRequested {
  sourceBlockId: BlockId
  componentName: string
  includeCustomProperties: boolean
  requestedBy: UserId
  timestamp: Date
}

// 인스턴스 속성 업데이트 (Visual Canvas에서 발생)
interface InstanceVisualPropertyUpdated {
  instanceId: InstanceId
  propertyUpdates: Map<PropertyKey, PropertyValue>
  pageId: PageId
  updatedBy: UserId
  timestamp: Date
}

// 인스턴스 삭제 알림
interface InstanceRemovedFromCanvas {
  instanceId: InstanceId
  pageId: PageId
  removedBy: UserId
  timestamp: Date
}

// 개별 인스턴스 분리 요청
interface SingleInstanceDetachRequested {
  instanceId: InstanceId
  preserveProperties: boolean
  preserveOverrides: boolean
  requestedBy: UserId
  timestamp: Date
}
```

---

## 🏗️ Context Integration Architecture

### Anti-Corruption Layer (ACL)

두 Context 간 데이터 변환과 무결성 보장을 위한 ACL 설계:

```typescript
class ComponentCanvasIntegrationService {
  
  // Component System → Visual Canvas 변환
  async handleInstanceCreation(event: ComponentInstanceRequested): Promise<void> {
    // 1. 컴포넌트 정보 조회
    const component = await this.componentRepo.findById(event.componentId)
    
    // 2. Visual Canvas의 Block 생성 Command로 변환
    const createBlockCommand = {
      blockType: 'component-instance',
      position: event.position,
      pageId: event.targetPageId,
      properties: component.defaultProperties,
      metadata: {
        componentId: event.componentId,
        instanceId: generateInstanceId(),
        isInstance: true
      }
    }
    
    // 3. Visual Canvas로 전달
    await this.canvasService.createBlock(createBlockCommand)
  }
  
  // Visual Canvas → Component System 변환
  async handlePropertyOverride(event: InstanceVisualPropertyUpdated): Promise<void> {
    // 1. 인스턴스 정보 확인
    const instance = await this.instanceRepo.findById(event.instanceId)
    
    // 2. Component System의 Override Command로 변환
    for (const [propertyKey, propertyValue] of event.propertyUpdates) {
      const overrideCommand = {
        instanceId: event.instanceId,
        propertyKey,
        propertyValue,
        markAsOverridden: true,
        updatedBy: event.updatedBy
      }
      
      await this.propertyOverrideService.overrideProperty(overrideCommand)
    }
  }
  
  // 개별 인스턴스 분리 처리
  async handleSingleInstanceDetach(event: SingleInstanceDetachRequested): Promise<void> {
    // 1. 인스턴스 정보 조회 (모든 속성 + 오버라이드 상태)
    const instance = await this.instanceRepo.findById(event.instanceId)
    const overrideState = await this.overrideRepo.findByInstanceId(event.instanceId)
    
    // 2. Component System에서 인스턴스 분리
    const detachCommand = {
      instanceId: event.instanceId,
      preserveProperties: event.preserveProperties,
      preserveOverrides: event.preserveOverrides,
      requestedBy: event.requestedBy
    }
    
    const detachedBlockData = await this.componentLifecycleService.detachInstance(detachCommand)
    
    // 3. Visual Canvas에 일반 블럭 생성 알림
    const blockCreatedEvent = {
      originalInstanceId: event.instanceId,
      newBlockId: detachedBlockData.blockId,
      preservedProperties: detachedBlockData.properties,
      detachmentReason: 'manual_detach',
      timestamp: new Date()
    }
    
    await this.canvasService.notifyInstanceDetachment(blockCreatedEvent)
  }
}
```

### Eventual Consistency 보장

두 Context 간 데이터 일관성을 위한 전략:

1. **Event Sourcing**: 모든 변경사항을 이벤트로 기록
2. **Saga Pattern**: 복잡한 비즈니스 트랜잭션의 오케스트레이션
3. **Compensation**: 실패 시 보상 트랜잭션 실행

```typescript
class ComponentInstanceSaga {
  async createInstance(command: CreateComponentInstanceCommand): Promise<void> {
    try {
      // 1. Component System에서 인스턴스 생성
      const instance = await this.componentService.createInstance(command)
      
      // 2. Visual Canvas에 블럭 생성 요청
      await this.canvasService.createBlockFromInstance(instance)
      
      // 3. 성공 시 인스턴스 활성화
      await this.componentService.activateInstance(instance.id)
      
    } catch (error) {
      // 4. 실패 시 보상 트랜잭션
      await this.componentService.rollbackInstanceCreation(command)
      throw error
    }
  }
}
```

---

## 🔄 Context Map

```
┌─────────────────────────────────────────────────────────────┐
│                Component System Context                      │
│                                                             │
│  ┌───────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────┐ │
│  │Component  │ │ComponentSync│ │PropertyOverride│ │Lifecycle│ │
│  │Aggregate  │ │Aggregate    │ │Aggregate      │ │Aggregate│ │
│  └─────┬─────┘ └──────┬──────┘ └───────┬──────┘ └───┬────┘ │
│        │              │                │             │      │
│        └──────────────┴────────────────┴─────────────┘      │
│                              ▼                              │
│                    Integration Service                       │
│                    (Anti-Corruption Layer)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Integration Events
                              ▼
        ┌─────────────────────────────────────────────────────┐
        │              Integration Events                      │
        ├─────────────────────────────────────────────────────┤
        │ Upstream (Component → Canvas):                       │
        │ • ComponentInstanceRequested                         │
        │ • InstancePropertyChanged                            │
        │ • InstanceDetachedFromComponent                      │
        │                                                     │
        │ Downstream (Canvas → Component):                     │
        │ • BlockComponentConversionRequested                  │
        │ • InstanceVisualPropertyUpdated                      │
        │ • InstanceRemovedFromCanvas                          │
        │ • SingleInstanceDetachRequested                      │
        └─────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Visual Canvas Context                        │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐         │
│  │  Block  │ │ Canvas  │ │  Edge   │ │ Viewport │         │
│  │Aggregate│ │Aggregate│ │Aggregate│ │Aggregate │         │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. 이중 책임 해결
- **Component System**: 템플릿 관리, 동기화, 오버라이드
- **Visual Canvas**: 시각적 배치, 렌더링, 상호작용
- **해결**: 각자의 관심사에 집중, Event로 협조

### 2. 인스턴스 데이터 분산
- Component System: 컴포넌트 관계, 오버라이드 상태
- Visual Canvas: 위치, 크기, 시각적 속성
- **해결**: 각 Context가 필요한 데이터만 소유

### 3. 동기화 복잡성
- 오버라이드된 속성과 일반 속성 구분
- 배치 업데이트와 개별 업데이트 혼재
- **해결**: ComponentSync Aggregate로 복잡성 캡슐화

---

## ✅ 검증 체크리스트

- [ ] 각 Context가 독립적으로 진화할 수 있는가?
- [ ] Integration Event가 도메인 언어를 사용하는가?
- [ ] Anti-Corruption Layer가 적절히 설계되었는가?
- [ ] 데이터 일관성이 보장되는가?
- [ ] 성능 요구사항을 충족하는가?

---

## 📊 성과 측정 지표

1. **Integration 성공률**: Context 간 이벤트 처리 성공률 99% 이상
2. **동기화 성능**: 인스턴스 1000개 기준 동기화 시간 5초 이내
3. **데이터 일관성**: Context 간 데이터 불일치 0.1% 이하
4. **오버라이드 추적**: 오버라이드 상태 정확도 100%
