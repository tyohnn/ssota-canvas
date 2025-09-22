# Visual Canvas Domain - Software Design

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Visual Canvas Domain의 Bounded Context를 정의합니다.

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Block Manager | **Block Aggregate** | 블럭의 생명주기, 속성, 페이지 마운트 관리 |
| Canvas Renderer | **Canvas Aggregate** | 뷰포트, 렌더링, 스냅/가이드 관리 |
| Block Type Manager | **BlockType Aggregate** | 블럭 타입 정의, 타입별 규칙 관리 |
| Group Manager | **Group Aggregate** | 블럭 그룹화, 그룹 조작 관리 |
| Edge Manager | **Edge Aggregate** | 블럭 간 연결, 엣지 라우팅 관리 |
| Viewport Controller | **Viewport Aggregate** | 줌/패닝, 화면 맞추기 관리 |

---

## 📦 Aggregate 상세 정의

### 1. Block Aggregate

**핵심 개념**: "시각적 요소로서의 블럭"

#### Commands (받는 명령)
- Create Block
- Mount Block to Page  
- Update Block Position
- Update Block Size
- Change Block Type
- Update Block Content
- Delete Block
- Restore Block

#### Events (발생 이벤트)
- Block Created
- Block Mounted to Page
- Block Position Changed
- Block Size Changed
- Block Type Changed
- Block Content Updated
- Block Deleted
- Block Restored

#### 핵심 불변식 (Invariants)
- 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
- 블럭 ID는 전역적으로 유일해야 함
- 삭제된 블럭은 복구 가능해야 함 (soft delete)

#### 속성 (Properties)
```typescript
{
  id: BlockId,
  type: BlockType,
  content: BlockContent,
  defaultProperties: Map<PropertyKey, Value>,
  customProperties: Map<PropertyKey, Value>,
  pagePositions: Map<PageId, Position>,
  pageSizes: Map<PageId, Size>,
  pageZOrders: Map<PageId, number>,
  createdAt: Date,
  deletedAt?: Date
}
```

---

### 2. Canvas Aggregate

**핵심 개념**: "렌더링과 상호작용 컨텍스트"

#### Commands
- Initialize Canvas
- Load Page Blocks
- Update Snap Settings
- Show Guidelines
- Calculate Smart Guides
- Show Distance Measurements

#### Events  
- Canvas Initialized
- Page Blocks Loaded
- Snap Settings Updated
- Guidelines Shown
- Smart Guides Calculated
- Distance Measurements Shown

#### 핵심 불변식
- 스냅 임계값은 1px 이상이어야 함
- 가이드라인은 뷰포트 내에서만 표시
- 캔버스는 초기화 시 페이지의 모든 블럭을 로드해야 함

#### 속성
```typescript
{
  pageId: PageId,
  snapThreshold: number,
  gridSize: number,
  showGrid: boolean,
  showGuidelines: boolean,
  showDistances: boolean,
  loadedBlocks: Set<BlockId>
}
```

---

### 3. BlockType Aggregate

**핵심 개념**: "블럭 타입별 규칙과 기본값"

#### Commands
- Define Block Type
- Update Type Rules
- Set Default Properties
- Define Sizing Rules

#### Events
- Block Type Defined
- Type Rules Updated  
- Default Properties Set
- Sizing Rules Defined

#### 핵심 불변식
- 각 블럭 타입은 고유한 식별자를 가져야 함
- 사이징 규칙은 반드시 정의되어야 함

#### 속성
```typescript
{
  typeId: BlockTypeId,
  name: string,
  category: BlockCategory,
  defaultProperties: PropertySchema,
  sizingRule: 'width-only' | 'fixed-ratio' | 'free',
  minSize?: Size,
  maxSize?: Size,
  aspectRatio?: number
}
```

---

### 4. Group Aggregate

**핵심 개념**: "복수 블럭의 논리적 묶음"

#### Commands
- Create Group
- Add Block to Group
- Remove Block from Group
- Move Group
- Ungroup

#### Events
- Group Created
- Block Added to Group
- Block Removed from Group
- Group Moved
- Group Ungrouped

#### 핵심 불변식
- 그룹은 최소 2개 이상의 블럭을 포함해야 함
- 블럭은 하나의 그룹에만 속할 수 있음
- 중첩 그룹은 허용하지 않음

---

### 5. Edge Aggregate

**핵심 개념**: "블럭 간 연결 관계"

#### Commands
- Create Edge
- Update Edge Label
- Update Edge Style
- Reconnect Edge
- Delete Edge

#### Events
- Edge Created
- Edge Label Updated
- Edge Style Updated
- Edge Reconnected
- Edge Deleted

#### 핵심 불변식
- Self-loop 불가 (source ≠ target)
- 소스와 타겟 블럭이 모두 존재해야 함
- 블럭 삭제 시 연결된 엣지도 삭제 (cascade)

---

### 6. Viewport Aggregate

**핵심 개념**: "캔버스 보기 상태"

#### Commands
- Set Zoom Level
- Pan Viewport
- Fit to Screen
- Center on Blocks
- Save Viewport State

#### Events
- Zoom Level Changed
- Viewport Panned
- Screen Fitted
- Viewport Centered
- Viewport State Saved

#### 핵심 불변식
- 줌 레벨은 10% ~ 500% 범위
- 뷰포트는 항상 유효한 좌표를 가져야 함

---

## 🔲 Bounded Context 정의

### Visual Canvas Context

**언어적 특징**:
- "블럭" = 시각적 요소, 캔버스에 배치되는 객체
- "엣지" = 시각적 연결선
- "캔버스" = 무한한 2D 작업 공간
- "뷰포트" = 보이는 영역
- "스냅" = 자동 정렬

**핵심 책임**:
- 시각적 편집과 조작
- 공간적 배치와 정렬
- 실시간 렌더링과 상호작용

**포함된 Aggregates**:
- Block Aggregate (시각적 측면)
- Canvas Aggregate
- Edge Aggregate  
- Viewport Aggregate
- Group Aggregate

---

## 🔀 다른 Context와의 경계

### Component Context와의 경계

**언어적 차이**:
| Visual Canvas Context | Component Context |
|---------------------|-------------------|
| "블럭을 배치한다" | "컴포넌트를 정의한다" |
| "블럭을 이동한다" | "인스턴스를 생성한다" |
| "엣지로 연결한다" | "속성을 오버라이드한다" |

**통합 이벤트**:
- `Component Instance Requested` → `Block Created`
- `Block Type Changed` → `Component Type Checked`

### Data View Context와의 경계

**언어적 차이**:
| Visual Canvas Context | Data View Context |
|---------------------|-------------------|
| "블럭을 선택한다" | "레코드를 조회한다" |
| "블럭을 정렬한다" | "데이터를 정렬한다" |
| "엣지로 연결한다" | "관계를 설정한다" |

**통합 이벤트**:
- `Table Cell Edited` → `Block Property Updated`
- `Block Created` → `Table Row Added`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────┐
│                Visual Canvas Context                 │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ │
│  │  Block  │ │ Canvas  │ │  Edge   │ │ Viewport │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘ │
│       │           │           │            │        │
│       └───────────┴───────────┴────────────┘        │
│                        ▼                            │
│                 Domain Service                      │
│              (Canvas Coordinator)                   │
└─────────────────────────────────────────────────────┘
                         │
                         │ Events
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • Block Created                       │
     │ • Block Property Changed              │
     │ • Block Position Changed              │
     │ • Edge Connected                      │
     └──────────────────────────────────────┘
                    │         │
        ┌───────────┘         └───────────┐
        ▼                                 ▼
┌─────────────────┐             ┌──────────────────┐
│ Component       │             │ Data View        │
│ Context         │             │ Context          │
└─────────────────┘             └──────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Block Aggregate의 이중성
- Visual Canvas Context에서는 "시각적 요소"
- 하지만 Component/Data View에서 다른 의미 획득
- **해결**: 각 Context별로 별도 Aggregate 유지, Event로 동기화

### 2. 페이지별 독립성
- 같은 블럭이 여러 페이지에 다른 위치/크기로 존재
- **해결**: pagePositions, pageSizes Map으로 관리

### 3. 삭제 정책
- 실제 삭제가 아닌 Soft Delete
- **이유**: 복구 기능, 이력 추적, 참조 무결성

### 4. 엣지의 독립성
- 엣지는 페이지별로 독립적
- **이유**: 같은 블럭이라도 페이지마다 다른 연결 관계

---

## 📖 Read Models (Query Side)

### PageBlocksView
**목적**: 특정 페이지의 모든 블럭 정보를 효율적으로 조회

```typescript
interface PageBlocksView {
  pageId: PageId
  blocks: Array<{
    blockId: BlockId
    type: BlockType
    position: Position
    size: Size
    zOrder: number
    content: BlockContent
    properties: Map<string, any>
  }>
  edges: Array<{
    edgeId: EdgeId
    sourceBlockId: BlockId
    targetBlockId: BlockId
    label?: string
  }>
}
```

**Query Handler 책임**:
- 페이지 ID로 해당 페이지의 모든 블럭 조회
- 블럭의 페이지별 위치, 크기, Z-Order 포함
- 연결된 엣지 정보 포함
- 캔버스 초기화 시 한 번의 쿼리로 필요한 모든 데이터 제공

### BlockRenderingView  
**목적**: 블럭의 페이지별 렌더링 정보 관리

```typescript
interface BlockRenderingView {
  blockId: BlockId
  pageRenderingData: Map<PageId, {
    position: Position
    size: Size
    zOrder: number
    visible: boolean
    locked: boolean
  }>
}
```

**최적화 포인트**:
- 페이지별 렌더링 데이터를 별도로 관리하여 쿼리 성능 향상
- 블럭의 기본 정보와 렌더링 정보 분리
- 인덱싱: (pageId, blockId) 복합 인덱스로 빠른 조회

---

## 🚀 구현 가이드라인

### Repository 패턴
```typescript
interface BlockRepository {
  save(block: Block): Promise<void>
  findById(id: BlockId): Promise<Block>
  findByPageId(pageId: PageId): Promise<Block[]>
  findDeleted(): Promise<Block[]>
}
```

### Domain Service 예시
```typescript
class CanvasCoordinator {
  constructor(
    private blockRepo: BlockRepository,
    private edgeRepo: EdgeRepository,
    private queryHandler: CanvasQueryHandler
  ) {}

  async initializeCanvas(pageId: PageId): Promise<void> {
    // 1. 페이지의 모든 블럭과 엣지 로드 (Read Model 활용)
    const pageData = await this.queryHandler.getPageBlocksView(pageId)
    
    // 2. Canvas Aggregate 초기화
    const canvas = Canvas.initialize(pageId)
    
    // 3. 로드된 블럭 정보 설정
    canvas.setLoadedBlocks(pageData.blocks.map(b => b.blockId))
    
    // 4. 이벤트 발행
    await this.eventBus.publish([
      new CanvasInitialized(pageId),
      new PageBlocksLoaded(pageId, pageData.blocks.length)
    ])
  }

  async createAndMountBlock(
    command: CreateBlockCommand
  ): Promise<void> {
    // 1. Block 생성
    const block = Block.create(command)
    
    // 2. 페이지에 마운트
    block.mountToPage(command.pageId, command.position)
    
    // 3. 이벤트 발행
    await this.eventBus.publish(block.getEvents())
  }
}
```

### Query Handler 예시
```typescript
class CanvasQueryHandler {
  async getPageBlocksView(pageId: PageId): Promise<PageBlocksView> {
    // 실제 구현에서는 최적화된 쿼리 사용
    // 예: JOIN을 통한 한 번의 쿼리로 모든 데이터 조회
    const blocksWithRendering = await this.db.query(`
      SELECT b.*, br.position, br.size, br.z_order
      FROM blocks b
      JOIN block_renderings br ON b.id = br.block_id
      WHERE br.page_id = ? AND b.deleted_at IS NULL
    `, [pageId])
    
    const edges = await this.db.query(`
      SELECT * FROM edges 
      WHERE page_id = ? AND deleted_at IS NULL
    `, [pageId])
    
    return {
      pageId,
      blocks: blocksWithRendering,
      edges: edges
    }
  }
}
```

### Integration Event 예시
```typescript
// Visual Canvas → Component Context
interface BlockCreatedEvent {
  blockId: string
  blockType: string
  pageId: string
  position: { x: number, y: number }
  timestamp: Date
}

// Component Context → Visual Canvas  
interface ComponentInstanceRequested {
  componentId: string
  targetPageId: string
  position: { x: number, y: number }
}
```

---

## ✅ 검증 체크리스트

- [ ] 각 Aggregate가 명확한 경계와 책임을 가지는가?
- [ ] 불변식이 비즈니스 규칙을 정확히 반영하는가?
- [ ] Context 간 통합이 느슨하게 결합되어 있는가?
- [ ] 언어적 경계가 명확하게 구분되는가?
- [ ] 이벤트가 도메인 언어를 사용하는가?

---

## 📊 성과 측정 지표

1. **Aggregate 응집도**: 각 Aggregate 내 메서드 간 상호 의존성
2. **Context 독립성**: Context 간 직접 참조 0개 목표
3. **이벤트 명확성**: 도메인 전문가가 이벤트명만으로 이해 가능
4. **변경 영향도**: 한 Context 변경이 다른 Context에 미치는 영향 최소화
