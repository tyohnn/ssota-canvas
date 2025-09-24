# Visual Canvas Domain - Anti-Corruption Layer (ACL)

## 🛡️ Anti-Corruption Layer Overview

React Flow는 강력한 라이브러리지만, 우리 도메인 모델과는 다른 개념과 용어를 사용합니다. ACL은 이 두 세계를 연결하면서도 도메인의 순수성을 보호합니다.

### 왜 ACL이 필요한가?

1. **용어 차이**
   - Domain: Block, BlockPosition, Page (from Workspace Structure)
   - React Flow: Node, Position, Canvas

2. **데이터 구조 차이**
   - Domain: 정규화된 DB 스키마
   - React Flow: 비정규화된 플랫 구조

3. **라이브러리 교체 가능성**
   - React Flow → 다른 캔버스 라이브러리
   - 도메인 로직 변경 없이 교체 가능

---

## 🔄 Translation Layer

### 1. Block → Node Translator

```typescript
// Domain → React Flow
interface BlockToNodeTranslator {
  translate(
    block: Block,
    position: BlockPosition,
    metadata: BlockMetadata
  ): ReactFlowNode {
    return {
      id: block.id,
      type: mapBlockTypeToNodeType(block.type),
      position: {
        x: position.x,
        y: position.y
      },
      data: {
        // 도메인 데이터를 React Flow가 이해하는 형태로
        label: block.content.text,
        blockId: block.id,
        blockType: block.type,
        metadata: metadata,
        // React Flow 전용 속성
        draggable: true,
        selectable: true
      },
      width: position.width,
      height: position.height,
      selected: false
    };
  }
}
```

### 2. Node → Block Command Translator

```typescript
// React Flow → Domain
interface NodeToCommandTranslator {
  translateMove(
    nodeChange: NodePositionChange
  ): MoveBlockCommand {
    return {
      blockId: nodeChange.id,
      newPosition: {
        x: nodeChange.position.x,
        y: nodeChange.position.y
      },
      pageId: getCurrentPageId()
    };
  }

  translateConnect(
    connection: Connection
  ): CreateEdgeCommand {
    return {
      sourceBlockId: connection.source,
      targetBlockId: connection.target,
      sourceHandle: connection.sourceHandle || 'default',
      targetHandle: connection.targetHandle || 'default',
      pageId: getCurrentPageId() // from Workspace Structure context
    };
  }
}
```

---

## 🎭 Adapter Pattern

### Canvas Adapter Interface

```typescript
// 도메인이 캔버스 라이브러리와 상호작용하는 인터페이스
interface CanvasAdapter {
  // 초기화
  initialize(container: HTMLElement): void;
  
  // 데이터 로드
  loadBlocks(blocks: Block[], positions: BlockPosition[]): void;
  loadEdges(edges: Edge[]): void;
  
  // 상호작용 핸들러
  onBlockMove(callback: (blockId: string, position: Position) => void): void;
  onBlockSelect(callback: (blockIds: string[]) => void): void;
  onEdgeCreate(callback: (source: string, target: string) => void): void;
  
  // 명령 실행
  addBlock(block: Block, position: Position): void;
  removeBlock(blockId: string): void;
  updateBlockPosition(blockId: string, position: Position): void;
  
  // 뷰포트 제어
  fitToScreen(): void;
  zoomIn(): void;
  zoomOut(): void;
}
```

### React Flow Adapter 구현

```typescript
class ReactFlowAdapter implements CanvasAdapter {
  private reactFlowInstance: ReactFlowInstance;
  private translator: BlockToNodeTranslator;

  initialize(container: HTMLElement): void {
    // React Flow 초기화
  }

  loadBlocks(blocks: Block[], positions: BlockPosition[]): void {
    const nodes = blocks.map(block => {
      const position = positions.find(p => p.blockId === block.id);
      return this.translator.translate(block, position, {});
    });
    
    this.reactFlowInstance.setNodes(nodes);
  }

  onBlockMove(callback: (blockId: string, position: Position) => void): void {
    // React Flow의 onNodesChange를 도메인 이벤트로 변환
    this.reactFlowInstance.onNodesChange = (changes) => {
      changes
        .filter(change => change.type === 'position')
        .forEach(change => {
          callback(change.id, {
            x: change.position.x,
            y: change.position.y
          });
        });
    };
  }

  // ... 나머지 메서드 구현
}
```

---

## 🔍 Event Translation

### React Flow Events → Domain Events

| React Flow Event | Domain Event | Translation Logic |
|-----------------|--------------|-------------------|
| onNodesChange | BlockPositionChanged | Extract position changes only |
| onEdgesChange | EdgeRouteChanged | Filter routing updates |
| onConnect | EdgeCreated | Validate and transform connection |
| onNodeDoubleClick | BlockEditingStarted | Map node ID to block ID |
| onSelectionChange | BlocksSelected | Convert node IDs to block IDs |
| onInit | CanvasInitialized | Signal ready state |

### Domain Commands → React Flow Actions

| Domain Command | React Flow Action | Translation Logic |
|---------------|-------------------|-------------------|
| CreateBlock | addNodes | Generate node with position |
| MoveBlock | setNodes | Update specific node position |
| DeleteBlock | deleteElements | Remove node and connected edges |
| CreateEdge | addEdges | Create edge with styling |
| UpdateBlockContent | setNodes | Update node.data properties |

---

## 📦 Data Structure Mapping

### Block Entity → React Flow Node

```typescript
// Domain Model
interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// React Flow Model
interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  width?: number;
  height?: number;
}

// Mapping Function
function mapBlockToNode(
  block: Block,
  position: BlockPosition
): Node {
  return {
    id: block.id,
    type: getNodeTypeForBlockType(block.type),
    position: { x: position.x, y: position.y },
    data: {
      ...block.content,
      blockType: block.type,
      metadata: Object.fromEntries(block.metadata)
    },
    width: position.width,
    height: position.height
  };
}
```

### Edge Entity → React Flow Edge

```typescript
// Domain Model
interface Edge {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle: string;
  targetHandle: string;
  label?: string;
  pageId: string;
}

// React Flow Model
interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

// Mapping Function
function mapEdgeToReactFlowEdge(edge: Edge): ReactFlowEdge {
  return {
    id: edge.id,
    source: edge.sourceBlockId,
    target: edge.targetBlockId,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    type: 'smoothstep',
    animated: false
  };
}
```

---

## 🏗️ Implementation Strategy

### 1. Layer Architecture

```
┌─────────────────────────────────────┐
│         Domain Layer                │
│  (Blocks, Edges, Commands, Events)  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│    Anti-Corruption Layer (ACL)      │
│  (Translators, Adapters, Mappers)   │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      React Flow Library             │
│    (Nodes, Edges, Callbacks)        │
└─────────────────────────────────────┘
```

### 2. Folder Structure

```
src/
├── domains/
│   └── visual-canvas/
│       ├── entities/          # Block, Edge, etc.
│       ├── aggregates/        # Canvas, BlockCollection
│       ├── commands/          # CreateBlock, MoveBlock
│       ├── events/            # BlockCreated, BlockMoved
│       └── repositories/      # BlockRepository
│
├── infrastructure/
│   └── canvas/
│       ├── adapters/
│       │   ├── CanvasAdapter.ts
│       │   └── ReactFlowAdapter.ts
│       ├── translators/
│       │   ├── BlockToNodeTranslator.ts
│       │   └── NodeToCommandTranslator.ts
│       └── mappers/
│           ├── BlockTypeMapper.ts
│           └── PositionMapper.ts
│
└── presentation/
    └── components/
        └── canvas/
            └── ReactFlowCanvas.tsx  # React Flow 사용
```

### 3. Dependency Rule

```typescript
// ✅ 올바른 의존성 방향
import { CanvasAdapter } from '@/infrastructure/canvas/adapters/CanvasAdapter';
import { Block } from '@/domains/visual-canvas/entities/Block';

// ❌ 잘못된 의존성 방향 (도메인이 인프라에 의존)
import { Node } from '@xyflow/react'; // 도메인 레이어에서 직접 사용 금지
```

---

## 🔗 Cross-Domain ACL Patterns

### Workspace Structure Integration

ACL은 Workspace Structure Domain과의 통합에서도 중요한 역할을 합니다:

```typescript
// Page Context Integration
interface PageContextAdapter {
  getCurrentPageId(): string;
  validatePageAccess(pageId: string, userId: string): boolean;
  getPageMetadata(pageId: string): PageMetadata;
}

// Canvas Initialization with Page Context
class CanvasInitializer {
  constructor(
    private pageAdapter: PageContextAdapter,
    private canvasAdapter: CanvasAdapter
  ) {}

  async initializeForPage(pageId: string): Promise<void> {
    // 1. Validate page access through Workspace Structure
    const hasAccess = await this.pageAdapter.validatePageAccess(pageId, getCurrentUserId());
    if (!hasAccess) {
      throw new PageAccessDeniedError(pageId);
    }

    // 2. Get page metadata
    const pageMetadata = await this.pageAdapter.getPageMetadata(pageId);

    // 3. Initialize canvas with page context
    await this.canvasAdapter.initialize({
      pageId,
      metadata: pageMetadata,
      permissions: pageMetadata.userPermissions
    });
  }
}
```

### Event Translation for Cross-Domain

```typescript
// Translate Workspace Structure Events to Canvas Actions
class CrossDomainEventTranslator {
  translatePageEvent(event: WorkspaceStructureEvent): CanvasCommand[] {
    switch (event.type) {
      case 'PageCreated':
        return [new InitializeCanvasCommand(event.pageId)];
      
      case 'PageDeleted':
        return [new CleanupCanvasCommand(event.pageId)];
      
      case 'PageMoved':
        return [new UpdateCanvasContextCommand(event.pageId, event.newWorkspaceId)];
      
      default:
        return [];
    }
  }
}
```

---

## 🔒 Benefits of ACL

### 1. 도메인 보호
- React Flow API 변경이 도메인에 영향 없음
- 도메인 용어와 개념 유지
- 비즈니스 로직 순수성 보장

### 2. 테스트 용이성
- 도메인 로직을 React Flow 없이 테스트
- Mock CanvasAdapter로 단위 테스트
- 통합 테스트 시에만 실제 React Flow 사용

### 3. 유연성
- React Flow → 다른 라이브러리 교체 가능
- 멀티 플랫폼 지원 (Web, Mobile, Desktop)
- 다양한 렌더링 전략 실험 가능

### 4. 성능 최적화
- 변환 로직 중앙 집중화
- 배치 업데이트 최적화
- 캐싱 전략 적용 가능

---

## 📚 Next Steps

1. **ACL 구현**
   - CanvasAdapter 인터페이스 정의
   - ReactFlowAdapter 구현
   - Translator 클래스들 구현

2. **테스트 전략**
   - 도메인 레이어 단위 테스트
   - ACL 변환 로직 테스트
   - 통합 테스트

3. **성능 고려사항**
   - Debouncing 전략
   - Batch update 최적화
   - Virtual scrolling for large canvases
