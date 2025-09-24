# Visual Canvas Domain - Sprint 3 Stories

## 🎯 Sprint 3 Goal
기본 블럭 생성, 배치, 위치 관리 (Workspace Structure 기반) (Story Points: 16)

---

## 📋 Story VC-1.1: Block Creation & Mounting (8pts) ⭐

### User Story
**As a** 사용자 **I want to** 캔버스에 새 블럭을 생성할 수 있어야 **so that** 시각적 콘텐츠를 만들 수 있다

### Command → Event Mapping
```typescript
Command: CreateBlock
Events: Block Created → Block Mounted to Page → Block Default Property Set

Command: MountBlockToPage
Events: Block Mounted to Page → Canvas Initialized (if first block)
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Block Creation & Mounting
  Scenario: Create text block on canvas
    Given 사용자가 페이지에 접근했다
    And 페이지에 블럭이 없다
    When 텍스트 블럭을 생성한다
    Then 블럭이 생성된다
    And 블럭이 현재 페이지에 마운트된다
    And 블럭의 기본 속성이 설정된다
    And 캔버스가 초기화된다

  Scenario: Create block with specific position
    Given 사용자가 페이지에 접근했다
    When 특정 위치에 블럭을 생성한다
    Then 블럭이 해당 위치에 생성된다
    And 블럭이 페이지에 마운트된다
    And 위치 정보가 저장된다

  Scenario: Create different block types
    Given 사용자가 페이지에 접근했다
    When 다양한 타입의 블럭을 생성한다
    Then 각 타입별로 적절한 기본 속성이 설정된다
    And 블럭이 페이지에 마운트된다
```

### Technical Implementation Details

#### Commands
```typescript
interface CreateBlockCommand {
  blockType: BlockType
  position: { x: number; y: number }
  pageId: string
  initialContent?: any
  createdBy: string
}

interface MountBlockToPageCommand {
  blockId: string
  pageId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}
```

#### Events
```typescript
interface BlockCreatedEvent {
  blockId: string
  blockType: BlockType
  pageId: string
  position: { x: number; y: number }
  createdBy: string
  timestamp: Date
}

interface BlockMountedToPageEvent {
  blockId: string
  pageId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  timestamp: Date
}
```

#### Aggregates
- **Block Aggregate**: 블럭의 생명주기 및 속성 관리
- **Canvas Aggregate**: 캔버스 초기화 및 상태 관리

#### Repository Methods
```typescript
interface BlockRepository {
  save(block: Block): Promise<void>
  findById(id: BlockId): Promise<Block | null>
  findByPageId(pageId: string): Promise<Block[]>
  findDeleted(): Promise<Block[]>
}

interface BlockPositionRepository {
  save(position: BlockPosition): Promise<void>
  findByBlockId(blockId: string): Promise<BlockPosition[]>
  findByPageId(pageId: string): Promise<BlockPosition[]>
}
```

#### Server Actions
```typescript
async function createBlockAction(input: CreateBlockInput): Promise<BlockResult>
async function mountBlockToPageAction(input: MountBlockInput): Promise<MountResult>
```

#### Database Schema
```sql
-- blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  content JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- block_page_positions table
CREATE TABLE block_page_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES blocks(id),
  page_id UUID REFERENCES pages(id),
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  z_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(block_id, page_id)
);
```

### Sub-tasks

#### Backend Domain
- [ ] Block Entity 구현
- [ ] Block Aggregate 구현
- [ ] CreateBlock Command Handler
- [ ] MountBlockToPage Command Handler
- [ ] Block Domain Events 정의

#### Database & Repository
- [ ] blocks 테이블 생성
- [ ] block_page_positions 테이블 생성
- [ ] BlockRepository 구현
- [ ] BlockPositionRepository 구현
- [ ] 데이터베이스 인덱스 설정

#### API & Server Action
- [ ] createBlockAction 구현
- [ ] mountBlockToPageAction 구현
- [ ] 에러 처리 및 검증 로직
- [ ] Workspace Structure 권한 검증

#### Frontend
- [ ] 블럭 생성 UI 컴포넌트
- [ ] 블럭 타입 선택 UI
- [ ] 캔버스 초기화 로직
- [ ] 블럭 렌더링 컴포넌트

#### React Flow Integration
- [ ] React Flow Adapter 구현
- [ ] Block → Node 변환 로직
- [ ] 초기 데이터 로딩
- [ ] Workspace Structure 연동

#### E2E & Observability
- [ ] 블럭 생성 E2E 테스트
- [ ] 페이지 마운트 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 다양한 블럭 타입 생성 가능
- [ ] 블럭이 페이지에 정확히 마운트됨
- [ ] Workspace Structure 권한 검증 완료
- [ ] React Flow와 데이터 동기화 완료
- [ ] 성능: 블럭 생성 < 200ms

---

## 📋 Story VC-1.2: Block Position Management (5pts) ⭐

### User Story
**As a** 사용자 **I want to** 블럭을 드래그하여 이동할 수 있어야 **so that** 원하는 위치에 배치할 수 있다

### Command → Event Mapping
```typescript
Command: MoveBlock
Events: Block Position Changed → Block Position Confirmed on Page

Command: ResizeBlock
Events: Block Size Changed → Block Position Updated
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Block Position Management
  Scenario: Move block by dragging
    Given 캔버스에 블럭이 있다
    When 블럭을 드래그한다
    Then 블럭 위치가 실시간으로 업데이트된다
    And 드래그 완료 시 위치가 저장된다
    And React Flow와 DB가 동기화된다

  Scenario: Resize block
    Given 캔버스에 블럭이 있다
    When 블럭 크기를 조정한다
    Then 블럭 크기가 업데이트된다
    And 크기 정보가 저장된다
    And 블럭 타입별 사이징 규칙이 적용된다

  Scenario: Batch position updates
    Given 여러 블럭이 선택되어 있다
    When 선택된 블럭들을 이동한다
    Then 모든 블럭이 함께 이동된다
    And 상대 위치가 유지된다
```

### Technical Implementation Details

#### Commands
```typescript
interface MoveBlockCommand {
  blockId: string
  newPosition: { x: number; y: number }
  pageId: string
  movedBy: string
}

interface ResizeBlockCommand {
  blockId: string
  newSize: { width: number; height: number }
  pageId: string
  resizedBy: string
}
```

#### Events
```typescript
interface BlockPositionChangedEvent {
  blockId: string
  pageId: string
  oldPosition: { x: number; y: number }
  newPosition: { x: number; y: number }
  timestamp: Date
}

interface BlockSizeChangedEvent {
  blockId: string
  pageId: string
  oldSize: { width: number; height: number }
  newSize: { width: number; height: number }
  timestamp: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] Block Position Entity 구현
- [ ] MoveBlock Command Handler
- [ ] ResizeBlock Command Handler
- [ ] 위치 변경 검증 로직

#### Database & Repository
- [ ] BlockPosition 업데이트 로직
- [ ] 배치 업데이트 최적화
- [ ] 트랜잭션 관리

#### API & Server Action
- [ ] moveBlockAction 구현
- [ ] resizeBlockAction 구현
- [ ] 배치 업데이트 API
- [ ] Debouncing 로직

#### Frontend
- [ ] 드래그 앤 드롭 UI
- [ ] 리사이즈 핸들 UI
- [ ] 다중 선택 UI
- [ ] 실시간 위치 표시

#### React Flow Integration
- [ ] onNodesChange 이벤트 처리
- [ ] 위치 동기화 로직
- [ ] 성능 최적화 (Debouncing)
- [ ] 충돌 해결 로직

#### E2E & Observability
- [ ] 블럭 이동 E2E 테스트
- [ ] 리사이즈 E2E 테스트
- [ ] 다중 선택 이동 테스트
- [ ] 성능 모니터링

### Definition of Done
- [ ] 블럭 드래그 이동이 부드럽게 작동
- [ ] 리사이즈가 블럭 타입별 규칙에 따라 작동
- [ ] 다중 선택 블럭 이동 완료
- [ ] React Flow ↔ DB 동기화 완료
- [ ] 성능: 위치 업데이트 < 100ms

---

## 📋 Story VC-1.3: Canvas Initialization & Loading (3pts) ⭐

### User Story
**As a** 사용자 **I want to** 페이지 진입 시 모든 블럭이 로드되어야 **so that** 이전 작업을 이어갈 수 있다

### Command → Event Mapping
```typescript
Command: InitializeCanvas
Events: Canvas Initialized → Page Blocks Loaded → React Flow Initialized

Command: LoadPageBlocks
Events: Page Blocks Loaded → Blocks Transformed to Nodes
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Canvas Initialization & Loading
  Scenario: Initialize canvas for existing page
    Given 페이지에 블럭들이 있다
    When 페이지에 접근한다
    Then 캔버스가 초기화된다
    And 모든 블럭이 로드된다
    And React Flow가 초기화된다
    And 블럭들이 올바른 위치에 렌더링된다

  Scenario: Initialize canvas for new page
    Given 빈 페이지가 있다
    When 페이지에 접근한다
    Then 캔버스가 초기화된다
    And 빈 캔버스가 표시된다
    And 새 블럭 추가 준비가 완료된다

  Scenario: Handle page access denied
    Given 사용자가 페이지 접근 권한이 없다
    When 페이지에 접근한다
    Then 접근이 거부된다
    And 권한 오류 메시지가 표시된다
```

### Technical Implementation Details

#### Commands
```typescript
interface InitializeCanvasCommand {
  pageId: string
  userId: string
  viewportSettings?: ViewportSettings
}

interface LoadPageBlocksCommand {
  pageId: string
  includeDeleted?: boolean
}
```

#### Events
```typescript
interface CanvasInitializedEvent {
  pageId: string
  userId: string
  blockCount: number
  timestamp: Date
}

interface PageBlocksLoadedEvent {
  pageId: string
  blocks: BlockData[]
  edges: EdgeData[]
  loadedAt: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] Canvas Entity 구현
- [ ] Canvas Aggregate 구현
- [ ] InitializeCanvas Command Handler
- [ ] LoadPageBlocks Command Handler

#### Database & Repository
- [ ] 페이지 블럭 조회 최적화
- [ ] 엣지 데이터 조회
- [ ] 권한 검증 쿼리

#### API & Server Action
- [ ] initializeCanvasAction 구현
- [ ] loadPageBlocksAction 구현
- [ ] Workspace Structure 권한 검증
- [ ] 에러 처리 로직

#### Frontend
- [ ] 캔버스 초기화 UI
- [ ] 로딩 상태 표시
- [ ] 권한 오류 UI
- [ ] 빈 상태 UI

#### React Flow Integration
- [ ] 초기 데이터 로딩
- [ ] Node/Edge 변환
- [ ] 뷰포트 설정
- [ ] Workspace Structure 연동

#### E2E & Observability
- [ ] 캔버스 초기화 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 로딩 성능 테스트
- [ ] 에러 상황 테스트

### Definition of Done
- [ ] 기존 페이지 블럭 로딩 완료
- [ ] 새 페이지 캔버스 초기화 완료
- [ ] 권한 검증 통합 완료
- [ ] React Flow 초기화 완료
- [ ] 성능: 초기 로딩 < 2초

---

## 🚀 Sprint 3 완료 기준

### 기능적 완료
- [ ] Workspace Structure 기반 블럭 생성 완성
- [ ] 블럭 위치 관리 완성
- [ ] 캔버스 초기화 및 로딩 완성
- [ ] React Flow 통합 완성

### 기술적 완료
- [ ] Block Aggregate 구현 완료
- [ ] Canvas Aggregate 구현 완료
- [ ] Workspace Structure 연동 완료
- [ ] React Flow ACL 구현 완료

### 품질 완료
- [ ] 권한 검증 테스트 통과
- [ ] React Flow 동기화 테스트 통과
- [ ] 성능 요구사항 충족
- [ ] E2E 테스트 통과

**다음 Sprint 준비**: Smart Guides & Snapping (Story VC-2.1) 구현을 위한 설계 검토