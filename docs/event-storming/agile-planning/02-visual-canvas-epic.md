# Phase 2: Visual Canvas Domain - Epic & Stories

Event Storming → DDD → Agile 연결 방법론을 적용하여 Visual Canvas Domain의 Epic과 Story를 정의합니다.  
**Workspace Structure Domain 기반으로 동작하는 시각적 편집 시스템입니다.**

---

## 🎯 Event Storming → Agile 매핑 (agile-discussion.md 기반)

### 핵심 매핑 원칙
- **Epic (Value slice)** ⇢ 도메인 프로세스나 Bounded Context 단위 capability
- **Story (Behavior change)** ⇢ **Command → Event** 쌍 + Policy & Invariants
- **Acceptance** ⇢ 특정 **도메인 이벤트 관찰** + Read Model 업데이트

---

## 🎯 Epic: Visual Canvas Foundation
**Priority**: Critical | **Story Points**: 34 | **Sprint**: 3-4

### Epic Goal/KPI
사용자가 Workspace Structure Domain의 페이지에서 블럭을 자유롭게 생성, 배치, 조작할 수 있는 기본 시각적 편집 환경 제공

### Domain Scope
- **Main Context**: Visual Canvas Context
- **Upstream**: Workspace Structure Context (Page 생성/삭제 이벤트)
- **Downstream**: Component System Context (블럭 → 컴포넌트 변환)

### Happy Path Events (Ordered)
1. `Page Created` (from Workspace Structure) → `Canvas Initialized` → `Page Blocks Loaded`
2. `Block Created` → `Block Mounted to Page`
3. `Block Position Changed` → `Block Snapped to Guideline`
4. `Block Content Updated` → `Block Style Applied`

### Non-Happy Paths
- `Page Access Denied` (권한 부족)
- `Block Creation Failed` (invalid type, position)
- `Block Mount Failed` (page not found)
- `Position Update Failed` (invalid coordinates)

### Done When
- [ ] Workspace Structure Domain과 연동된 캔버스 초기화
- [ ] 페이지 권한 기반 블럭 접근 제어
- [ ] 모든 기본 블럭 타입 생성 가능
- [ ] 페이지별 블럭 위치 관리 완성
- [ ] 스마트 가이드 및 스냅 기능 작동
- [ ] 성능: 1000개 블럭 로드 시간 < 2초

---

## 📋 Story VC-1.1: Block Creation & Mounting
**Story Points**: 8 | **Sprint**: 3

### User Story
**As a** 사용자 **I want to** 캔버스에 새 블럭을 생성 **so that** 시각적 콘텐츠를 만들 수 있다

### Command → Event Mapping
- **Command**: `CreateBlock(type, position, pageId, content?)`
- **Preconditions/Invariants**: 
  - pageId 존재해야 함
  - position이 캔버스 범위 내
  - blockType이 지원되는 타입
- **Policy**: "블럭 생성 시 페이지 마운트 필수"
- **Emits**: `BlockCreated{blockId, type, content}` + `BlockMountedToPage{blockId, pageId, position}`
- **Read Model Updates**: 
  - Block entity 저장
  - Page-Block mapping 추가
  - BlockPosition 기록

### Acceptance (Gherkin)
```gherkin
Given 사용자가 유효한 페이지에 있고
When CreateBlock(type="text", position={x:100, y:200}, pageId="page1") 명령을 실행하면
Then BlockCreated 이벤트가 발생하고
And BlockMountedToPage 이벤트가 발생하고
And Block read model에 새 블럭이 저장되고
And PageBlocks read model에 블럭-페이지 관계가 추가된다
```

### Technical Implementation
- **Aggregate**: Block Aggregate
- **Repository**: BlockRepository interface
- **Server Action**: `createBlockAction()`
- **DB Schema**: blocks, block_page_positions 테이블

---

## 📋 Story VC-1.2: Block Position Management
**Story Points**: 5 | **Sprint**: 3

### User Story
**As a** 사용자 **I want to** 블럭을 드래그하여 이동 **so that** 원하는 위치에 배치할 수 있다

### Command → Event Mapping
- **Command**: `MoveBlock(blockId, newPosition, pageId)`
- **Preconditions/Invariants**:
  - 블럭이 해당 페이지에 마운트되어 있어야 함
  - newPosition이 유효한 좌표
- **Policy**: "페이지별 위치 독립 관리"
- **Emits**: `BlockPositionChanged{blockId, pageId, oldPosition, newPosition}`
- **Read Model Updates**: BlockPosition 업데이트

### Acceptance (Gherkin)
```gherkin
Given 페이지에 마운트된 블럭이 있고
When MoveBlock(blockId="block1", newPosition={x:300, y:400}, pageId="page1") 명령을 실행하면
Then BlockPositionChanged 이벤트가 발생하고
And BlockPosition read model이 새 위치로 업데이트된다
```

---

## 📋 Story VC-2.1: Smart Guides & Snapping
**Story Points**: 8 | **Sprint**: 4

### User Story
**As a** 사용자 **I want to** 블럭 이동 시 자동 정렬 가이드 **so that** 정확한 배치가 쉽다

### Command → Event Mapping
- **Command**: `StartBlockDrag(blockId)` → `UpdateDragPosition(position)` → `EndBlockDrag()`
- **Policy**: "스마트 가이드 자동 활성화" + "임계값 내 자동 스냅"
- **Emits**: 
  - `BlockDragStarted{blockId}`
  - `SnapGuidelinesShown{guidelines[]}`
  - `BlockSnappedToGuideline{blockId, snapPosition}`
- **Read Model Updates**: Canvas state, 가이드라인 표시 상태

### Acceptance (Gherkin)
```gherkin
Given 캔버스에 여러 블럭이 배치되어 있고
When 사용자가 블럭을 드래그하면
Then SnapGuidelinesShown 이벤트가 발생하고
And 다른 블럭과의 정렬선이 표시되고
When 임계값(5px) 내로 이동하면
Then BlockSnappedToGuideline 이벤트가 발생하고
And 블럭이 자동으로 정렬된다
```

---

## 📋 Story VC-2.2: Block Content Editing
**Story Points**: 5 | **Sprint**: 4

### User Story
**As a** 사용자 **I want to** 블럭 내용을 편집 **so that** 원하는 텍스트나 속성을 설정할 수 있다

### Command → Event Mapping
- **Command**: `UpdateBlockContent(blockId, content)`
- **Preconditions/Invariants**: 
  - 블럭이 존재해야 함
  - content가 블럭 타입에 맞는 형식
- **Policy**: "콘텐츠 타입별 검증"
- **Emits**: `BlockContentUpdated{blockId, oldContent, newContent}`
- **Read Model Updates**: Block content 필드 업데이트

### Acceptance (Gherkin)
```gherkin
Given 텍스트 블럭이 존재하고
When UpdateBlockContent(blockId="block1", content="새로운 텍스트") 명령을 실행하면
Then BlockContentUpdated 이벤트가 발생하고
And Block read model의 content가 업데이트된다
```

---

## 📋 Story VC-1.3: Canvas Initialization & Loading
**Story Points**: 3 | **Sprint**: 3

### User Story
**As a** 사용자 **I want to** 페이지 진입 시 모든 블럭이 로드 **so that** 이전 작업을 이어갈 수 있다

### Command → Event Mapping
- **Command**: `InitializeCanvas(pageId)`
- **Policy**: "페이지의 모든 블럭을 로드해야 함"
- **Emits**: `CanvasInitialized{pageId}` + `PageBlocksLoaded{pageId, blockCount}`
- **Read Model Updates**: Canvas state, loaded blocks 정보

### Acceptance (Gherkin)
```gherkin
Given 페이지에 여러 블럭이 저장되어 있고
When InitializeCanvas(pageId="page1") 명령을 실행하면
Then CanvasInitialized 이벤트가 발생하고
And PageBlocksLoaded 이벤트가 발생하고
And 모든 블럭이 올바른 위치에 렌더링된다
```

---

## 📋 Story VC-2.3: Block Type System
**Story Points**: 5 | **Sprint**: 4

### User Story
**As a** 개발자 **I want to** 다양한 블럭 타입을 지원 **so that** 다양한 콘텐츠를 표현할 수 있다

### Command → Event Mapping
- **Command**: `DefineBlockType(typeId, schema, defaultProperties)`
- **Preconditions/Invariants**: typeId 유일성, schema 유효성
- **Policy**: "타입별 기본 속성 및 검증 규칙"
- **Emits**: `BlockTypeDefined{typeId, schema}` + `DefaultPropertiesSet{typeId, properties}`
- **Read Model Updates**: BlockType catalog, property schemas

### Acceptance (Gherkin)
```gherkin
Given 새로운 블럭 타입을 정의하려고 하고
When DefineBlockType(typeId="youtube", schema={url: "string"}) 명령을 실행하면
Then BlockTypeDefined 이벤트가 발생하고
And BlockType read model에 새 타입이 등록되고
And 해당 타입으로 블럭 생성이 가능해진다
```

---

## 🧪 Testing Strategy & DoD

### Story별 DoD Template
각 Story는 다음을 충족해야 함:
- [ ] **Domain Events 관찰**: 모든 예상 이벤트가 event stream에 기록
- [ ] **Invariants 검증**: Aggregate의 비즈니스 규칙 위반 시 적절한 예외
- [ ] **Read Model 동기화**: 이벤트 발생 후 Read Model이 올바르게 업데이트
- [ ] **Server Action 연동**: 클라이언트에서 서버 액션 호출 가능
- [ ] **Error Handling**: 실패 시나리오에 대한 적절한 에러 응답
- [ ] **Performance**: 응답 시간 < 200ms (단일 블럭 작업 기준)

### Integration & E2E
- **Walking Skeleton**: Sprint 1에서 블럭 생성→배치→이동 전체 플로우 end-to-end
- **Performance**: 대량 블럭(1000개) 로드/렌더링 성능 검증
- **Cross-browser**: Chrome, Safari, Firefox 호환성

---

## 📊 Sprint Breakdown & Dependencies

### Sprint 1 (Stories 1.1, 1.2, 1.5)
**Focus**: 기본 블럭 생성 및 위치 관리
**Walking Skeleton**: 블럭 생성 → 배치 → 페이지 로드 전체 플로우

### Sprint 2 (Stories 1.3, 1.4, 1.6)
**Focus**: 사용성 개선 및 확장성
**Advanced Features**: 스마트 가이드, 콘텐츠 편집, 타입 시스템

### Dependencies
- **Database Schema**: blocks, block_positions, block_types 테이블 설계 필요
- **Frontend Components**: Canvas renderer, block components
- **Integration**: Component System과의 연동 지점 준비 (Epic 완료 후)

---

## 🔧 Enabler Stories

### Enabler Story 1: Database Schema Setup
**Story Points**: 3 | **Sprint**: 0 (Setup Sprint)

#### Description
Visual Canvas Domain을 위한 데이터베이스 스키마 설정 및 마이그레이션 준비

#### Technical Tasks
- [ ] blocks 테이블 스키마 설계 및 migration
- [ ] block_page_positions 테이블 스키마 설계 및 migration
- [ ] edges 테이블 스키마 설계 및 migration
- [ ] 인덱스 설계 및 성능 최적화
- [ ] Seed data 준비

#### Acceptance Criteria
- 모든 migration이 성공적으로 실행됨
- 인덱스가 쿼리 성능을 50% 이상 개선
- 테스트 데이터가 모든 블럭 타입 포함

---

### Enabler Story 2: React Flow ACL Infrastructure
**Story Points**: 5 | **Sprint**: 0 (Setup Sprint)

#### Description
React Flow Anti-Corruption Layer 기본 인프라 구축

#### Technical Tasks
- [ ] CanvasAdapter interface 정의
- [ ] ReactFlowAdapter 기본 구현
- [ ] BlockToNodeTranslator 구현
- [ ] NodeToCommandTranslator 구현
- [ ] Mock Adapter for testing

#### Acceptance Criteria
- ACL이 도메인과 React Flow를 완전히 격리
- Mock Adapter로 단위 테스트 가능
- 번역 로직이 100% 테스트 커버리지

---

### Enabler Story 3: Domain Foundation
**Story Points**: 3 | **Sprint**: 0 (Setup Sprint)

#### Description
Visual Canvas Domain 기본 구조 및 공통 컴포넌트 설정

#### Technical Tasks
- [ ] Base Entity & Value Object classes
- [ ] Domain Event base classes
- [ ] Repository interfaces
- [ ] Result & Error types
- [ ] Domain exceptions

#### Acceptance Criteria
- 모든 도메인 객체가 base class 상속
- Error handling pattern 확립
- Repository pattern 구현 준비 완료

---

## 📊 Updated Sprint Breakdown

### Sprint 0: Foundation Setup (11 story points)
- Enabler Story 1: Database Schema (3pts)
- Enabler Story 2: React Flow ACL (5pts)
- Enabler Story 3: Domain Foundation (3pts)

### Sprint 1: Basic Operations (16 story points)
- Story VC-1.1: Block Creation & Mounting (8pts)
- Story VC-1.2: Block Position Management (5pts)
- Story VC-1.3: Canvas Initialization (3pts)

### Sprint 2: Advanced Features (18 story points)
- Story VC-2.1: Smart Guides & Snapping (8pts)
- Story VC-2.2: Block Content Editing (5pts)
- Story VC-2.3: Block Type System (5pts)

**Total**: 45 story points (11 enabler + 34 user stories), 3 sprints
