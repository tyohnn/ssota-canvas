# React Flow Canvas Domain

React Flow Canvas는 2D 캔버스 렌더링을 위한 독립적인 도메인입니다. 다양한 도메인(Canvas, Workflow, Landing Page 등)에서 재사용할 수 있도록 설계되었습니다.

## 🏗️ 아키텍처

```
📦 react-flow-canvas/
├── 📦 types/                    ← 타입 정의
│   ├── react-flow-types.ts      ← 핵심 타입들
│   └── selection-types.ts       ← 선택 관련 타입들
├── 📦 contexts/                 ← 상태 관리
│   └── ReactFlowCanvasContext.tsx
├── 📦 adapters/                 ← 이벤트 변환
│   └── useReactFlowEventAdapter.tsx
├── 📦 components/               ← UI 컴포넌트
│   ├── react-flow-renderer.tsx  ← 메인 렌더러
│   └── selection-box.tsx        ← 선택 박스
├── 📦 handlers/                 ← 이벤트 핸들러
├── 📦 hooks/                    ← 캔버스 제어
├── 📦 view-models/              ← 데이터 변환
└── 📦 index.ts                  ← 진입점
```

## 🎯 핵심 원칙

### 1. **도메인 독립성**
- React Flow Canvas는 특정 도메인에 종속되지 않음
- 설정과 이벤트를 통해 도메인별 커스터마이징 가능

### 2. **느슨한 결합**
- 도메인별 선택 상태는 외부에서 주입
- 뷰모델을 통한 데이터 변환으로 도메인 분리

### 3. **재사용성**
- 다양한 도메인에서 동일한 캔버스 기능 사용 가능
- 설정을 통한 기능 활성화/비활성화

## 📖 사용법

### 기본 사용법

```typescript
import {
  ReactFlowCanvasProvider,
  ReactFlowCanvasRenderer,
} from "@/domains/react-flow-canvas";

function MyCanvas() {
  const config = {
    nodeTypes: { /* 노드 타입 정의 */ },
    enableMultiSelection: true,
    enableDragSelection: true,
  };

  const events = {
    onNodeClick: (node, event) => {
      // 도메인별 선택 로직
    },
    onNodeDragStop: (node, event) => {
      // 도메인별 위치 업데이트
    },
  };

  return (
    <ReactFlowCanvasProvider config={config} events={events}>
      <ReactFlowCanvasRenderer />
    </ReactFlowCanvasProvider>
  );
}
```

### Canvas 도메인에서 사용

```typescript
// canvas-page.tsx
export function CanvasPage() {
  const { blocksById } = useCanvasData();
  const sel = useCanvasSelection();
  const commands = useCanvasCommandsContext();

  // 뷰모델을 통한 데이터 변환
  const { nodes, edges } = useReactFlowViewModel(
    blocksById,
    positions,
    sel.pageId,
    edges,
    sel.nodeIds
  );

  const config = {
    nodeTypes: { /* Canvas 노드 타입 */ },
    enableMultiSelection: true,
    enableDragSelection: true,
  };

  const events = {
    onNodeClick: (node, event) => {
      // Canvas 도메인 선택 상태 업데이트
      sel.setNodeSelection([node.id]);
    },
    onNodeDragStop: async (node, event) => {
      // Canvas 도메인 위치 업데이트
      await commands.updateNodePosition(node.id, node.position);
    },
  };

  return (
    <ReactFlowCanvasProvider config={config} events={events}>
      <ReactFlowCanvasRenderer />
    </ReactFlowCanvasProvider>
  );
}
```

### Workflow 도메인에서 사용

```typescript
// workflow-canvas.tsx
export function WorkflowCanvas() {
  const config = {
    nodeTypes: {
      start: StartNode,
      process: ProcessNode,
      end: EndNode,
    },
    enableMultiSelection: true,
    enableDragSelection: true,
  };

  const events = {
    onNodeClick: (node, event) => {
      // Workflow 도메인 선택 로직
    },
    onConnect: (connection) => {
      // Workflow 도메인 연결 로직
    },
  };

  return (
    <ReactFlowCanvasProvider config={config} events={events}>
      <ReactFlowCanvasRenderer />
    </ReactFlowCanvasProvider>
  );
}
```

## ⚙️ 설정 옵션

### ReactFlowCanvasConfig

```typescript
interface ReactFlowCanvasConfig {
  // 기본 설정
  nodeTypes: Record<string, React.ComponentType<any>>;
  minZoom?: number;
  maxZoom?: number;
  fitView?: boolean;
  
  // 상호작용 설정
  nodesDraggable?: boolean;
  elementsSelectable?: boolean;
  selectionOnDrag?: boolean;
  panOnDrag?: number[];
  
  // 선택 설정
  enableMultiSelection?: boolean;
  enableDragSelection?: boolean;
  
  // UI 설정
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
}
```

### ReactFlowCanvasEvents

```typescript
interface ReactFlowCanvasEvents {
  // 노드 이벤트
  onNodeClick?: (node: Node, event: React.MouseEvent) => void;
  onNodeDoubleClick?: (node: Node, event: React.MouseEvent) => void;
  onNodeDragStart?: (node: Node, event: React.MouseEvent) => void;
  onNodeDragStop?: (node: Node, event: React.MouseEvent) => void;
  
  // 엣지 이벤트
  onEdgeClick?: (edge: Edge, event: React.MouseEvent) => void;
  onEdgeDoubleClick?: (edge: Edge, event: React.MouseEvent) => void;
  
  // 캔버스 이벤트
  onPaneClick?: (event: React.MouseEvent) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  
  // 선택 이벤트
  onSelectionChange?: (selectedNodes: Node[], selectedEdges: Edge[]) => void;
  
  // 드래그 선택 이벤트
  onDragSelectionStart?: (startPos: { x: number; y: number }) => void;
  onDragSelectionUpdate?: (currentPos: { x: number; y: number }) => void;
  onDragSelectionEnd?: (selectedNodeIds: string[]) => void;
  
  // 연결 이벤트
  onConnect?: (connection: any) => void;
  onConnectStart?: (event: React.MouseEvent) => void;
  onConnectEnd?: (event: React.MouseEvent) => void;
  
  // 뷰포트 이벤트
  onMove?: (event: any, viewport: any) => void;
  onZoom?: (event: any, viewport: any) => void;
}
```

## 🔄 데이터 흐름

### 1. 도메인 → React Flow Canvas

```
도메인 상태 → 뷰모델 → React Flow Canvas 상태
```

### 2. React Flow Canvas → 도메인

```
사용자 이벤트 → 어댑터 → 도메인 이벤트 핸들러 → 도메인 상태 업데이트
```

### 3. 선택 상태 동기화

```
React Flow Canvas 선택 → 도메인 선택 상태 → 뷰모델 → React Flow Canvas 렌더링
```

## 🧪 테스트

### 단위 테스트

```typescript
// 어댑터 테스트
describe("useReactFlowEventAdapter", () => {
  it("should convert React Flow events to domain events", () => {
    const mockCommands = { selectNodes: jest.fn() };
    const adapter = useReactFlowEventAdapter(mockCommands);
    
    adapter.onNodeClick(mockNode, mockEvent);
    
    expect(mockCommands.selectNodes).toHaveBeenCalledWith([mockNode.id]);
  });
});
```

### 통합 테스트

```typescript
// React Flow Canvas 통합 테스트
describe("ReactFlowCanvasRenderer", () => {
  it("should render nodes and handle events", () => {
    render(
      <ReactFlowCanvasProvider config={mockConfig} events={mockEvents}>
        <ReactFlowCanvasRenderer />
      </ReactFlowCanvasProvider>
    );
    
    // 노드 렌더링 확인
    expect(screen.getByText("Node 1")).toBeInTheDocument();
    
    // 이벤트 처리 확인
    fireEvent.click(screen.getByText("Node 1"));
    expect(mockEvents.onNodeClick).toHaveBeenCalled();
  });
});
```

## 🚀 확장성

### 새로운 노드 타입 추가

```typescript
const config = {
  nodeTypes: {
    ...existingNodeTypes,
    customNode: CustomNodeComponent,
  },
};
```

### 새로운 이벤트 핸들러 추가

```typescript
const events = {
  ...existingEvents,
  onCustomEvent: (data) => {
    // 도메인별 커스텀 로직
  },
};
```

### 새로운 도메인에서 사용

```typescript
// 새로운 도메인
export function NewDomainCanvas() {
  const config = { /* 도메인별 설정 */ };
  const events = { /* 도메인별 이벤트 */ };
  
  return (
    <ReactFlowCanvasProvider config={config} events={events}>
      <ReactFlowCanvasRenderer />
    </ReactFlowCanvasProvider>
  );
}
```

## 📝 결론

React Flow Canvas 도메인은 **재사용 가능하고 확장 가능한 2D 캔버스 렌더링 솔루션**입니다. 

**주요 장점:**
- ✅ 도메인 독립성으로 다양한 컨텍스트에서 재사용 가능
- ✅ 느슨한 결합으로 도메인별 커스터마이징 용이
- ✅ 명확한 아키텍처로 유지보수성 향상
- ✅ 타입 안전성으로 개발자 경험 개선
- ✅ 테스트 용이성으로 품질 보장

이제 Canvas, Workflow, Landing Page 등 다양한 도메인에서 동일한 React Flow Canvas를 사용하여 일관된 사용자 경험을 제공할 수 있습니다! 🎉
