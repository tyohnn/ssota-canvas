# Visual Canvas Domain - Sprint 4 Stories

## 🎯 Sprint 4 Goal
스마트 가이드, 콘텐츠 편집, 타입 시스템 (Story Points: 18)

---

## 📋 Story VC-2.1: Smart Guides & Snapping (8pts) ⭐

### User Story
**As a** 사용자 **I want to** 블럭 이동 시 자동 정렬 가이드를 볼 수 있어야 **so that** 정확한 배치가 쉽다

### Command → Event Mapping
```typescript
Command: ShowSmartGuides
Events: Snap Guidelines Shown → Block Snapped to Guideline

Command: CalculateSnapPosition
Events: Smart Guides Calculated → Distance Between Blocks Shown
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Smart Guides & Snapping
  Scenario: Show alignment guidelines
    Given 캔버스에 여러 블럭이 있다
    When 블럭을 드래그한다
    Then 정렬 가이드라인이 표시된다
    And 블럭이 가이드라인에 스냅된다
    And 거리 측정값이 표시된다

  Scenario: Snap to grid
    Given 그리드가 활성화되어 있다
    When 블럭을 이동한다
    Then 블럭이 그리드에 스냅된다
    And 그리드 정렬이 시각적으로 표시된다

  Scenario: Multi-block alignment
    Given 여러 블럭이 선택되어 있다
    When 정렬 버튼을 클릭한다
    Then 선택된 블럭들이 정렬된다
    And 정렬 타입에 따라 배치된다
```

### Technical Implementation Details

#### Commands
```typescript
interface ShowSmartGuidesCommand {
  blockId: string
  currentPosition: { x: number; y: number }
  otherBlocks: BlockData[]
  snapThreshold: number
}

interface CalculateSnapPositionCommand {
  blockId: string
  targetPosition: { x: number; y: number }
  snapType: 'ALIGNMENT' | 'GRID' | 'DISTANCE'
}
```

#### Events
```typescript
interface SnapGuidelinesShownEvent {
  blockId: string
  guidelines: GuidelineData[]
  snapType: string
  timestamp: Date
}

interface BlockSnappedToGuidelineEvent {
  blockId: string
  snappedPosition: { x: number; y: number }
  guidelineId: string
  timestamp: Date
}

interface DistanceBetweenBlocksShownEvent {
  block1Id: string
  block2Id: string
  distance: number
  direction: 'HORIZONTAL' | 'VERTICAL'
  timestamp: Date
}
```

#### Aggregates
- **Canvas Aggregate**: 스마트 가이드 및 스냅 관리
- **Viewport Aggregate**: 뷰포트 설정 및 그리드 관리

#### Repository Methods
```typescript
interface CanvasRepository {
  findBlocksInViewport(viewport: Viewport): Promise<BlockData[]>
  findNearbyBlocks(blockId: string, threshold: number): Promise<BlockData[]>
  getSnapSettings(pageId: string): Promise<SnapSettings>
}
```

### Sub-tasks

#### Backend Domain
- [ ] SmartGuide Entity 구현
- [ ] SnapCalculator Service 구현
- [ ] Alignment Algorithm 구현
- [ ] Distance Calculator 구현

#### Database & Repository
- [ ] 스냅 설정 저장
- [ ] 가이드라인 히스토리
- [ ] 성능 최적화 쿼리

#### API & Server Action
- [ ] showSmartGuidesAction 구현
- [ ] calculateSnapPositionAction 구현
- [ ] 스냅 설정 API
- [ ] 실시간 가이드라인 API

#### Frontend
- [ ] 가이드라인 렌더링 UI
- [ ] 스냅 시각화
- [ ] 거리 측정 표시
- [ ] 그리드 설정 UI

#### React Flow Integration
- [ ] 커스텀 가이드라인 레이어
- [ ] 스냅 이벤트 처리
- [ ] 성능 최적화
- [ ] 애니메이션 효과

#### E2E & Observability
- [ ] 스마트 가이드 E2E 테스트
- [ ] 스냅 기능 테스트
- [ ] 다중 블럭 정렬 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 정렬 가이드라인 표시 완료
- [ ] 스냅 기능 작동 완료
- [ ] 그리드 정렬 완료
- [ ] 다중 블럭 정렬 완료
- [ ] 성능: 가이드라인 계산 < 50ms

---

## 📋 Story VC-2.2: Block Content Editing (5pts) ⭐

### User Story
**As a** 사용자 **I want to** 블럭 내용을 편집할 수 있어야 **so that** 원하는 텍스트나 속성을 설정할 수 있다

### Command → Event Mapping
```typescript
Command: EditBlockContent
Events: Block Content Updated → Block Style Applied

Command: UpdateBlockProperties
Events: Block Properties Updated → Block Rendering Updated
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Block Content Editing
  Scenario: Edit text block content
    Given 텍스트 블럭이 있다
    When 텍스트를 더블클릭한다
    Then 텍스트 편집 모드가 활성화된다
    And 텍스트를 수정할 수 있다
    And 저장 시 변경사항이 적용된다

  Scenario: Update block properties
    Given 블럭이 선택되어 있다
    When 속성 패널에서 속성을 변경한다
    Then 블럭 속성이 업데이트된다
    And 블럭 렌더링이 업데이트된다
    And 변경사항이 저장된다

  Scenario: Edit different block types
    Given 다양한 타입의 블럭이 있다
    When 각 블럭을 편집한다
    Then 타입별로 적절한 편집 UI가 표시된다
    And 타입별 속성만 편집 가능하다
```

### Technical Implementation Details

#### Commands
```typescript
interface EditBlockContentCommand {
  blockId: string
  content: any
  contentType: 'TEXT' | 'PROPERTIES' | 'STYLE'
  editedBy: string
}

interface UpdateBlockPropertiesCommand {
  blockId: string
  properties: Map<string, any>
  propertyType: 'DEFAULT' | 'CUSTOM' | 'STYLE'
  updatedBy: string
}
```

#### Events
```typescript
interface BlockContentUpdatedEvent {
  blockId: string
  oldContent: any
  newContent: any
  contentType: string
  editedBy: string
  timestamp: Date
}

interface BlockPropertiesUpdatedEvent {
  blockId: string
  updatedProperties: Map<string, any>
  propertyType: string
  updatedBy: string
  timestamp: Date
}

interface BlockStyleAppliedEvent {
  blockId: string
  appliedStyles: StyleData[]
  timestamp: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] BlockContent Entity 구현
- [ ] BlockProperties Value Object 구현
- [ ] ContentEditor Service 구현
- [ ] PropertyValidator Service 구현

#### Database & Repository
- [ ] 블럭 콘텐츠 저장
- [ ] 속성 히스토리 관리
- [ ] 타입별 속성 스키마

#### API & Server Action
- [ ] editBlockContentAction 구현
- [ ] updateBlockPropertiesAction 구현
- [ ] 속성 검증 로직
- [ ] 실시간 편집 API

#### Frontend
- [ ] 인라인 텍스트 편집
- [ ] 속성 패널 UI
- [ ] 타입별 편집 UI
- [ ] 편집 상태 관리

#### React Flow Integration
- [ ] 편집 모드 전환
- [ ] 실시간 렌더링 업데이트
- [ ] 편집 완료 이벤트
- [ ] 취소/저장 로직

#### E2E & Observability
- [ ] 텍스트 편집 E2E 테스트
- [ ] 속성 편집 E2E 테스트
- [ ] 타입별 편집 테스트
- [ ] 편집 성능 모니터링

### Definition of Done
- [ ] 인라인 텍스트 편집 완료
- [ ] 속성 패널 편집 완료
- [ ] 타입별 편집 UI 완료
- [ ] 실시간 렌더링 업데이트 완료
- [ ] 성능: 편집 응답 < 100ms

---

## 📋 Story VC-2.3: Block Type System (5pts) ⭐

### User Story
**As a** 개발자 **I want to** 다양한 블럭 타입을 지원해야 **so that** 다양한 콘텐츠를 표현할 수 있다

### Command → Event Mapping
```typescript
Command: DefineBlockType
Events: Block Type Defined → Type Rules Updated

Command: ChangeBlockType
Events: Block Type Changed → Block Properties Updated
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Block Type System
  Scenario: Define new block type
    Given 시스템에 블럭 타입이 없다
    When 새 블럭 타입을 정의한다
    Then 블럭 타입이 등록된다
    And 타입별 규칙이 설정된다
    And 기본 속성이 정의된다

  Scenario: Change block type
    Given 기존 블럭이 있다
    When 블럭 타입을 변경한다
    Then 블럭 타입이 변경된다
    And 호환되는 속성은 보존된다
    And 새로운 타입의 속성이 추가된다

  Scenario: Apply type-specific rules
    Given 블럭 타입이 정의되어 있다
    When 블럭을 생성한다
    Then 타입별 규칙이 적용된다
    And 사이징 규칙이 적용된다
    And 렌더링 규칙이 적용된다
```

### Technical Implementation Details

#### Commands
```typescript
interface DefineBlockTypeCommand {
  typeId: string
  name: string
  category: BlockCategory
  properties: PropertySchema[]
  sizingRules: SizingRule
  renderRules: RenderRule
}

interface ChangeBlockTypeCommand {
  blockId: string
  newTypeId: string
  preserveProperties: boolean
  updatedBy: string
}
```

#### Events
```typescript
interface BlockTypeDefinedEvent {
  typeId: string
  name: string
  category: BlockCategory
  definedAt: Date
}

interface BlockTypeChangedEvent {
  blockId: string
  oldTypeId: string
  newTypeId: string
  preservedProperties: string[]
  updatedBy: string
  timestamp: Date
}

interface TypeRulesUpdatedEvent {
  typeId: string
  updatedRules: TypeRule[]
  timestamp: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] BlockType Entity 구현
- [ ] PropertySchema Value Object 구현
- [ ] SizingRule Value Object 구현
- [ ] TypeRegistry Service 구현

#### Database & Repository
- [ ] block_types 테이블 생성
- [ ] 타입별 속성 스키마 저장
- [ ] 타입 변경 히스토리

#### API & Server Action
- [ ] defineBlockTypeAction 구현
- [ ] changeBlockTypeAction 구현
- [ ] 타입 검증 로직
- [ ] 타입별 렌더링 API

#### Frontend
- [ ] 블럭 타입 선택 UI
- [ ] 타입별 속성 UI
- [ ] 타입 변경 UI
- [ ] 타입 관리 UI

#### React Flow Integration
- [ ] 타입별 노드 렌더링
- [ ] 타입 변경 시 노드 업데이트
- [ ] 커스텀 노드 타입 등록
- [ ] 타입별 상호작용 처리

#### E2E & Observability
- [ ] 블럭 타입 정의 E2E 테스트
- [ ] 타입 변경 E2E 테스트
- [ ] 타입별 렌더링 테스트
- [ ] 타입 시스템 성능 모니터링

### Definition of Done
- [ ] 기본 블럭 타입 정의 완료
- [ ] 타입 변경 기능 완료
- [ ] 타입별 속성 시스템 완료
- [ ] 타입별 렌더링 완료
- [ ] 성능: 타입 변경 < 200ms

---

## 🚀 Sprint 4 완료 기준

### 기능적 완료
- [ ] 스마트 가이드 및 스냅 시스템 완성
- [ ] 블럭 콘텐츠 편집 완성
- [ ] 블럭 타입 시스템 완성
- [ ] Visual Canvas Domain 완성

### 기술적 완료
- [ ] Canvas Aggregate 고도화 완료
- [ ] React Flow 커스텀 기능 구현 완료
- [ ] 성능 최적화 완료
- [ ] 타입 시스템 확장성 확보

### 품질 완료
- [ ] 모든 블럭 타입 테스트 통과
- [ ] 스마트 가이드 정확도 95% 이상
- [ ] 편집 성능 요구사항 충족
- [ ] E2E 테스트 통과

**다음 Sprint 준비**: Component System Domain Sprint 5 구현을 위한 설계 검토 및 Visual Canvas 연동 준비