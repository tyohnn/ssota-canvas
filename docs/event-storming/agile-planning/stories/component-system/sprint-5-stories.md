# Component System Domain - Sprint 5 Stories

## 🎯 Sprint 5 Goal
기본 컴포넌트 생성 및 인스턴스 시스템 구축 (Story Points: 16)

---

## 📋 Story CS-1.1: Component Creation from Block (8pts) ⭐

### User Story
**As a** 사용자 **I want to** 기존 블럭을 컴포넌트로 변환할 수 있어야 **so that** 재사용 가능한 템플릿을 만들 수 있다

### Command → Event Mapping
```typescript
Command: CreateComponentFromBlock
Events: Component Created → Block Converted to Instance → Component Library Updated

Command: ExtractPropertiesFromBlock
Events: Properties Extracted → Component Properties Defined
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Component Creation from Block
  Scenario: Convert block to component
    Given 캔버스에 완성된 블럭이 있다
    When "컴포넌트로 만들기" 버튼을 클릭한다
    Then 새로운 컴포넌트가 생성된다
    And 원본 블럭이 첫 번째 인스턴스가 된다
    And 컴포넌트 라이브러리에 추가된다

  Scenario: Set component metadata
    Given 컴포넌트가 생성될 때
    When 컴포넌트 이름과 설명을 입력한다
    Then 컴포넌트 메타데이터가 저장된다
    And 검색 가능한 태그가 설정된다

  Scenario: Extract block properties
    Given 블럭이 컴포넌트로 변환될 때
    When 블럭의 사용자 정의 속성이 있으면
    Then 해당 속성들이 컴포넌트 속성으로 추출된다
    And 기본값이 현재 블럭의 값으로 설정된다
```

### Technical Implementation Details

#### Commands
```typescript
interface CreateComponentFromBlockCommand {
  blockId: string
  componentName: string
  description?: string
  tags: string[]
  workspaceId: string
  createdBy: string
}

interface ExtractPropertiesFromBlockCommand {
  blockId: string
  componentId: string
  preserveValues: boolean
}
```

#### Events
```typescript
interface ComponentCreatedEvent {
  componentId: string
  blockId: string
  componentName: string
  workspaceId: string
  createdBy: string
  timestamp: Date
}

interface BlockConvertedToInstanceEvent {
  blockId: string
  componentId: string
  instanceId: string
  timestamp: Date
}

interface ComponentPropertiesDefinedEvent {
  componentId: string
  properties: ComponentProperty[]
  extractedFromBlock: string
  timestamp: Date
}
```

#### Aggregates
- **Component Aggregate**: 컴포넌트 정의 및 메타데이터 관리
- **ComponentInstance Aggregate**: 인스턴스 생성 및 관리

#### Repository Methods
```typescript
interface ComponentRepository {
  save(component: Component): Promise<void>
  findById(id: ComponentId): Promise<Component | null>
  findByWorkspace(workspaceId: string): Promise<Component[]>
  findByTags(tags: string[]): Promise<Component[]>
}
```

### Sub-tasks

#### Backend Domain
- [ ] Component Entity 구현
- [ ] ComponentInstance Entity 구현
- [ ] CreateComponentFromBlock Command Handler
- [ ] ExtractPropertiesFromBlock Command Handler
- [ ] Component Domain Events 정의

#### Database & Repository
- [ ] components 테이블 생성
- [ ] component_instances 테이블 생성
- [ ] ComponentRepository 구현
- [ ] ComponentInstanceRepository 구현

#### API & Server Action
- [ ] createComponentFromBlockAction 구현
- [ ] extractPropertiesFromBlockAction 구현
- [ ] Workspace Structure 권한 검증
- [ ] 에러 처리 및 검증 로직

#### Frontend
- [ ] 컴포넌트 생성 UI
- [ ] 메타데이터 입력 폼
- [ ] 컴포넌트 라이브러리 UI
- [ ] 태그 관리 UI

#### Integration Task
- [ ] Visual Canvas Domain 연동
- [ ] Workspace Structure 권한 연동
- [ ] 컴포넌트 라이브러리 통합

#### E2E & Observability
- [ ] 컴포넌트 생성 E2E 테스트
- [ ] 속성 추출 E2E 테스트
- [ ] 라이브러리 통합 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 블럭을 컴포넌트로 변환 완료
- [ ] 컴포넌트 메타데이터 관리 완료
- [ ] 속성 추출 시스템 완료
- [ ] 컴포넌트 라이브러리 통합 완료
- [ ] 성능: 컴포넌트 생성 < 300ms

---

## 📋 Story CS-1.2: Component Instance Creation (5pts) ⭐

### User Story
**As a** 사용자 **I want to** 컴포넌트에서 인스턴스를 생성할 수 있어야 **so that** 동일한 디자인을 여러 곳에서 재사용할 수 있다

### Command → Event Mapping
```typescript
Command: CreateComponentInstance
Events: Component Instance Created → Instance Placed on Canvas → Instance Properties Initialized

Command: PlaceInstanceOnCanvas
Events: Instance Position Set → Canvas Updated
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Component Instance Creation
  Scenario: Create instance from component library
    Given 컴포넌트 라이브러리에 컴포넌트가 있다
    When 컴포넌트를 캔버스로 드래그한다
    Then 새 인스턴스가 생성된다
    And 인스턴스가 캔버스에 배치된다
    And 컴포넌트의 기본 속성이 적용된다

  Scenario: Create multiple instances
    Given 컴포넌트가 선택되어 있다
    When 여러 위치에 인스턴스를 생성한다
    Then 각각 독립적인 인스턴스가 생성된다
    And 각 인스턴스는 고유한 ID를 가진다
    And 모든 인스턴스가 캔버스에 배치된다

  Scenario: Instance property initialization
    Given 컴포넌트에 정의된 속성이 있다
    When 인스턴스를 생성한다
    Then 모든 속성이 기본값으로 초기화된다
    And 속성 오버라이드가 가능하다
```

### Technical Implementation Details

#### Commands
```typescript
interface CreateComponentInstanceCommand {
  componentId: string
  pageId: string
  position: { x: number; y: number }
  createdBy: string
}

interface PlaceInstanceOnCanvasCommand {
  instanceId: string
  pageId: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
}
```

#### Events
```typescript
interface ComponentInstanceCreatedEvent {
  instanceId: string
  componentId: string
  pageId: string
  position: { x: number; y: number }
  createdBy: string
  timestamp: Date
}

interface InstancePlacedOnCanvasEvent {
  instanceId: string
  pageId: string
  position: { x: number; y: number }
  timestamp: Date
}

interface InstancePropertiesInitializedEvent {
  instanceId: string
  properties: InstanceProperty[]
  initializedAt: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] ComponentInstance Aggregate 구현
- [ ] InstanceProperty Value Object 구현
- [ ] CreateComponentInstance Command Handler
- [ ] Instance 초기화 로직

#### Database & Repository
- [ ] component_instances 테이블 생성
- [ ] instance_properties 테이블 생성
- [ ] ComponentInstanceRepository 구현
- [ ] InstancePropertyRepository 구현

#### API & Server Action
- [ ] createComponentInstanceAction 구현
- [ ] placeInstanceOnCanvasAction 구현
- [ ] 인스턴스 초기화 API
- [ ] 에러 처리 로직

#### Frontend
- [ ] 컴포넌트 드래그 앤 드롭
- [ ] 인스턴스 생성 UI
- [ ] 인스턴스 배치 UI
- [ ] 속성 초기화 UI

#### Integration Task
- [ ] Visual Canvas Domain 연동
- [ ] 컴포넌트 라이브러리 연동
- [ ] 캔버스 배치 로직

#### E2E & Observability
- [ ] 인스턴스 생성 E2E 테스트
- [ ] 다중 인스턴스 테스트
- [ ] 드래그 앤 드롭 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 컴포넌트에서 인스턴스 생성 완료
- [ ] 다중 인스턴스 생성 완료
- [ ] 인스턴스 속성 초기화 완료
- [ ] 캔버스 배치 완료
- [ ] 성능: 인스턴스 생성 < 200ms

---

## 📋 Story CS-1.3: Component Basic Properties (3pts) ⭐

### User Story
**As a** 사용자 **I want to** 컴포넌트의 기본 속성을 관리할 수 있어야 **so that** 컴포넌트의 기본 동작을 설정할 수 있다

### Command → Event Mapping
```typescript
Command: DefineComponentProperties
Events: Component Properties Defined → Property Schema Updated

Command: UpdatePropertyDefaults
Events: Property Defaults Updated → All Instances Synchronized
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Component Basic Properties
  Scenario: Define component properties
    Given 컴포넌트가 생성되었다
    When 컴포넌트 속성을 정의한다
    Then 속성 스키마가 생성된다
    And 기본값이 설정된다
    And 속성 타입이 정의된다

  Scenario: Update property defaults
    Given 컴포넌트에 속성이 정의되어 있다
    When 속성 기본값을 변경한다
    Then 기본값이 업데이트된다
    And 기존 인스턴스들은 변경되지 않는다
    And 새 인스턴스는 새 기본값을 사용한다

  Scenario: Property type validation
    Given 컴포넌트 속성이 정의되어 있다
    When 잘못된 타입의 값을 설정한다
    Then 검증 오류가 발생한다
    And 올바른 타입의 값만 허용된다
```
```

### Technical Implementation Details

#### Commands
```typescript
interface DefineComponentPropertiesCommand {
  componentId: string
  properties: PropertyDefinition[]
  updatedBy: string
}

interface UpdatePropertyDefaultsCommand {
  componentId: string
  propertyName: string
  newDefaultValue: any
  updatedBy: string
}
```

#### Events
```typescript
interface ComponentPropertiesDefinedEvent {
  componentId: string
  properties: PropertyDefinition[]
  definedBy: string
  timestamp: Date
}

interface PropertyDefaultsUpdatedEvent {
  componentId: string
  propertyName: string
  oldDefaultValue: any
  newDefaultValue: any
  updatedBy: string
  timestamp: Date
}

interface AllInstancesSynchronizedEvent {
  componentId: string
  synchronizedInstances: string[]
  syncType: string
  timestamp: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] PropertyDefinition Value Object 구현
- [ ] PropertyType Enum 구현
- [ ] PropertyValidator Service 구현
- [ ] Property Schema 관리

#### Database & Repository
- [ ] component_properties 테이블 생성
- [ ] 속성 스키마 저장
- [ ] 기본값 관리

#### API & Server Action
- [ ] defineComponentPropertiesAction 구현
- [ ] updatePropertyDefaultsAction 구현
- [ ] 속성 검증 API
- [ ] 에러 처리 로직

#### Frontend
- [ ] 속성 정의 UI
- [ ] 속성 타입 선택 UI
- [ ] 기본값 설정 UI
- [ ] 속성 검증 UI

#### Integration Task
- [ ] 인스턴스 동기화 로직
- [ ] 속성 상속 시스템
- [ ] 타입 검증 시스템

#### E2E & Observability
- [ ] 속성 정의 E2E 테스트
- [ ] 기본값 업데이트 테스트
- [ ] 타입 검증 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 컴포넌트 속성 정의 완료
- [ ] 속성 타입 검증 완료
- [ ] 기본값 관리 완료
- [ ] 인스턴스 동기화 완료
- [ ] 성능: 속성 업데이트 < 100ms

---

## 🚀 Sprint 5 완료 기준

### 기능적 완료
- [ ] 블럭을 컴포넌트로 변환 완성
- [ ] 컴포넌트 인스턴스 생성 완성
- [ ] 컴포넌트 기본 속성 관리 완성
- [ ] Visual Canvas Domain과 연동 완성

### 기술적 완료
- [ ] Component Aggregate 구현 완료
- [ ] ComponentInstance Aggregate 구현 완료
- [ ] 속성 시스템 구현 완료
- [ ] 라이브러리 통합 완료

### 품질 완료
- [ ] 컴포넌트 생성 테스트 통과
- [ ] 인스턴스 생성 테스트 통과
- [ ] 속성 관리 테스트 통과
- [ ] 성능 요구사항 충족

**다음 Sprint 준비**: Property Override Management (Story CS-2.1) 구현을 위한 설계 검토