# Component System Domain - Software Design

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Component System Domain의 Bounded Context를 정의합니다.

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Component Manager | **Component Aggregate** | 컴포넌트 정의, 라이브러리 관리, 인스턴스 생성 |
| Component Sync Manager | **ComponentSync Aggregate** | 인스턴스 동기화, 배치 업데이트 관리 |
| Property Override Manager | **PropertyOverride Aggregate** | 오버라이드 상태, 히스토리 관리 |
| Component Lifecycle Manager | **ComponentLifecycle Aggregate** | 컴포넌트 생성/삭제, 안전장치 |

---

## 📦 Aggregate 상세 정의

### 1. Component Aggregate

**핵심 개념**: "재사용 가능한 블럭 템플릿"

#### Commands (받는 명령)
- Define Component
- Convert Block to Component
- Update Component Properties
- Update Component Style Rules
- Delete Component

#### Events (발생 이벤트)
- Component Block Defined
- Component Custom Properties Copied
- Component Style Rules Updated
- Component Registered in Library
- Component Deleted

#### 핵심 불변식 (Invariants)
- 컴포넌트 ID는 전역적으로 유일해야 함
- 컴포넌트는 최소 하나의 속성을 가져야 함
- 삭제된 컴포넌트는 복구 가능해야 함 (soft delete)
- 컴포넌트 이름은 워크스페이스 내에서 중복 허용 (ID로 구분)

#### 속성 (Properties)
```typescript
{
  id: ComponentId,
  name: string,
  description?: string,
  category: ComponentCategory,
  defaultProperties: Map<PropertyKey, PropertyValue>,
  customProperties: Map<PropertyKey, PropertySchema>,
  styleRules: Array<StylePropertyRule>,
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date,
  version: number
}
```

---

### 2. ComponentSync Aggregate

**핵심 개념**: "인스턴스 동기화 오케스트레이션"

#### Commands
- Sync All Instances
- Sync Selected Instances
- Apply Property Changes
- Handle Sync Failure
- Batch Update Instances

#### Events
- Instance Sync Started
- Instance Property Updated from Component
- New Property Added to Instance
- Deleted Property Soft Removed from Instance
- Instance Sync Completed
- Instance Sync Failed
- Batch Sync Progress Updated

#### 핵심 불변식
- 동기화는 원자적 단위로 실행되어야 함
- 실패한 인스턴스가 있어도 다른 인스턴스 동기화는 계속됨
- 오버라이드된 속성은 동기화에서 제외
- 동기화 진행률은 실시간으로 추적되어야 함

#### 속성
```typescript
{
  syncId: SyncId,
  componentId: ComponentId,
  targetInstances: Array<InstanceId>,
  syncScope: 'all' | 'selected',
  overrideMap: Map<InstanceId, Set<PropertyKey>>,
  progress: SyncProgress,
  failures: Array<SyncFailure>,
  startedAt: Date,
  completedAt?: Date
}
```

---

### 3. PropertyOverride Aggregate

**핵심 개념**: "인스턴스별 속성 커스터마이징"

#### Commands
- Override Instance Property
- Reset Instance Property
- Batch Override Properties
- Track Override History
- Visualize Override Status

#### Events
- Instance Property Overridden
- Instance Property Reset
- Override Status Visualized
- Override History Recorded
- Component Default Value Applied

#### 핵심 불변식
- 오버라이드된 속성은 명확히 추적되어야 함
- 오버라이드 히스토리는 삭제되지 않아야 함
- 속성 타입과 값의 일관성이 유지되어야 함
- 존재하지 않는 속성은 오버라이드할 수 없음

#### 속성
```typescript
{
  instanceId: InstanceId,
  componentId: ComponentId,
  overriddenProperties: Map<PropertyKey, {
    value: PropertyValue,
    overriddenAt: Date,
    previousValue?: PropertyValue
  }>,
  overrideHistory: Array<OverrideHistoryEntry>,
  visualState: OverrideVisualState
}
```

---

### 4. ComponentLifecycle Aggregate

**핵심 개념**: "컴포넌트와 인스턴스의 생명주기 관리"

#### Commands
- Request Component Deletion
- Convert Instances to Regular Blocks
- Detach Single Instance
- Validate Deletion Safety
- Execute Safe Deletion
- Rollback Failed Deletion

#### Events
- Component Deletion Requested
- Instance Conversion Started
- Instance Detached to Regular Block
- Single Instance Detachment Requested
- Instance Properties Converted to Regular Block
- Override Values Finalized
- Instance Detachment Completed
- All Instances Converted
- Component Deletion Failed
- Deletion Safety Validated

#### 핵심 불변식
- 삭제 전 모든 인스턴스가 일반 블럭으로 변환되어야 함
- 변환 실패 시 전체 삭제 작업이 롤백되어야 함
- 인스턴스 변환 시 모든 데이터가 보존되어야 함
- 삭제 작업은 사용자 확인을 거쳐야 함
- 개별 인스턴스 분리 시 오버라이드 값이 최종 속성으로 고정되어야 함
- 분리된 인스턴스는 더 이상 컴포넌트 동기화 대상이 아니어야 함

#### 속성
```typescript
{
  componentId: ComponentId,
  deletionRequestId: DeletionRequestId,
  affectedInstances: Array<InstanceId>,
  conversionStatus: Map<InstanceId, ConversionStatus>,
  safetyChecks: Array<SafetyCheck>,
  userConfirmation: boolean,
  rollbackData?: RollbackData
}
```

---

## 🔲 Bounded Context 정의

### Component System Context

**언어적 특징**:
- "컴포넌트" = 재사용 가능한 템플릿, 추상화된 개념 정의
- "인스턴스" = 컴포넌트의 구체적 실현체
- "동기화" = 템플릿 변경의 인스턴스 반영
- "오버라이드" = 인스턴스별 커스터마이징
- "라이브러리" = 컴포넌트 저장소

**핵심 책임**:
- 재사용 가능한 개념 정의와 관리
- 템플릿-인스턴스 관계 유지
- 속성 커스터마이징과 동기화

**포함된 Aggregates**:
- Component Aggregate
- ComponentSync Aggregate
- PropertyOverride Aggregate
- ComponentLifecycle Aggregate

---

## 🔀 Visual Canvas Context와의 경계 및 Integration

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

- [ ] 각 Aggregate가 단일 책임을 가지는가?
- [ ] Context 간 직접 참조가 없는가?
- [ ] Integration Event가 도메인 언어를 사용하는가?
- [ ] Anti-Corruption Layer가 적절히 설계되었는가?
- [ ] Eventual Consistency가 보장되는가?

---

## 📊 성과 측정 지표

1. **Integration 성공률**: Context 간 이벤트 처리 성공률 99% 이상
2. **동기화 성능**: 인스턴스 1000개 기준 동기화 시간 5초 이내
3. **데이터 일관성**: Context 간 데이터 불일치 0.1% 이하
4. **오버라이드 추적**: 오버라이드 상태 정확도 100%
