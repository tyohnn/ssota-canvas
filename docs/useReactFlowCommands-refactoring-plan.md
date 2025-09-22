# useReactFlowCommands.tsx 리팩토링 계획

## 📋 현재 문제점 분석

### 1. **단일 책임 원칙 위반**
- **React Flow 노드 조작**: `updateReactFlowNode`, `removeReactFlowNode`, `addReactFlowNode`
- **일반 비즈니스 로직**: `createBlockInPage`, `updateNodePosition`, `duplicateBlock`
- **컴포넌트 시스템 로직**: `promoteBlockToComponentDefinition`, `createInstanceInPage`, `detachComponentInstance`
- **UI 스타일 로직**: `updateShape`, `updateColor`, `updateFontSize`, `updateSize`
- **속성 업데이트 로직**: `updateLabel`, `updateProperty`

### 2. **SSOT 원칙 위반**
- React Flow Canvas 내에서는 **React Flow Node가 SSOT**여야 함
- 현재는 Canvas 도메인의 Block 상태와 React Flow Node 상태가 혼재

### 3. **코드 크기 문제**
- 1584줄의 거대한 훅
- 20개 이상의 함수가 한 곳에 집중
- 유지보수성과 테스트 용이성 저하

## 🎯 리팩토링 목표

### 1. **책임 분리**
```
React Flow Canvas 내부:
├── React Flow Node (SSOT)
├── React Flow 이벤트 핸들러
└── React Flow 상태 관리

Canvas 도메인:
├── Block 상태 (SSOT)
├── 비즈니스 로직 (Commands)
└── 서버 동기화
```

### 2. **아키텍처 패턴 적용**
```
UI Components (React Flow)
    ↓
React Flow Event Adapters
    ↓
React Flow Handlers
    ↓
React Flow Commands (React Flow Node SSOT + DB Sync)
    ↓
Server Actions
```

## 🏗️ 리팩토링 계획

### Phase 1: React Flow Node SSOT 확립

#### 1.1 **React Flow Node 상태 관리 분리**
```typescript
// 📦 domains/react-flow-canvas/hooks/useReactFlowNodeState.ts
export function useReactFlowNodeState() {
  const rf = useReactFlow();
  
  // React Flow Node CRUD (SSOT)
  const updateNode = useCallback((nodeId: string, updates: any) => {
    rf.setNodes((nodes) => nodes.map((node) => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, [rf]);
  
  const removeNode = useCallback((nodeId: string) => {
    rf.setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
  }, [rf]);
  
  const addNode = useCallback((node: any) => {
    rf.setNodes((nodes) => [...nodes, node]);
  }, [rf]);
  
  const rekeyNode = useCallback((fromId: string, toId: string, updates?: any) => {
    rf.setNodes((nodes) => nodes.map((node) =>
      node.id === fromId ? { ...node, id: toId, ...updates } : node
    ));
  }, [rf]);
  
  return {
    updateNode,
    removeNode,
    addNode,
    rekeyNode,
    getNodes: rf.getNodes,
    setNodes: rf.setNodes,
  };
}
```

#### 1.2 **React Flow 이벤트 핸들러 분리**
```typescript
// 📦 domains/react-flow-canvas/handlers/useReactFlowNodeHandler.ts
export function useReactFlowNodeHandler() {
  const nodeState = useReactFlowNodeState();
  const selectionCommands = useSelectionCommands();
  
  // React Flow 이벤트만 처리 (비즈니스 로직 없음)
  const onNodeClick = useCallback((evt: React.MouseEvent, node: ReactFlowNode) => {
    evt.preventDefault();
    evt.stopPropagation();
    selectionCommands.selectNodes([node.id]);
  }, [selectionCommands]);
  
  const onNodeDragStop = useCallback((_evt: React.MouseEvent, node: ReactFlowNode) => {
    // React Flow Node 위치만 업데이트 (SSOT)
    nodeState.updateNode(node.id, { position: node.position });
  }, [nodeState]);
  
  return {
    onNodeClick,
    onNodeDragStop,
    // ... 기타 React Flow 이벤트
  };
}
```

### Phase 2: 비즈니스 로직 분리

#### 2.1 **일반 비즈니스 로직 분리**
```typescript
// 📦 domains/react-flow-canvas/commands/useReactFlowBlockCommands.ts
export function useReactFlowBlockCommands() {
  const nodeState = useReactFlowNodeState();
  
  // React Flow Node SSOT + DB 동기화
  const createBlockInPage = useCallback(async (
    pageId: string,
    kind: string,
    at?: { x: number; y: number }
  ): Promise<CreateStatus> => {
    const optimisticId = generateUUID();
    const tmpl = getDefaultBlockTemplate(kind as any);
    
    // 1. React Flow Node 생성 (SSOT)
    const rfNode = {
      id: optimisticId,
      type: kind,
      position: { x: at?.x ?? 100, y: at?.y ?? 100 },
      data: { 
        block: {
          id: optimisticId,
          block_type: tmpl.block_type,
          name: "label",
          metadata: tmpl.metadata,
          // ... 기타 블록 속성
        }
      }
    };
    nodeState.addNode(rfNode);
    
    // 2. DB 동기화
    const result = await createBlockAction({
      blockType: tmpl.block_type,
      slug: tmpl.slug,
      name: "label",
      metadata: tmpl.metadata,
      parentBlockId: pageId,
      workspaceId,
    });
    
    if (result.success) {
      // 3. React Flow Node 업데이트 (실제 DB ID로)
      nodeState.rekeyNode(optimisticId, result.data.id, {
        data: { block: result.data }
      });
      
      // 4. 위치 정보 생성
      await createBlockPositionAction({
        blockId: result.data.id,
        contextBlockId: pageId,
        x: at?.x ?? 100,
        y: at?.y ?? 100,
      });
    } else {
      // 5. 실패 시 React Flow Node 제거
      nodeState.removeNode(optimisticId);
    }
    
    return { ok: result.success, error: result.error };
  }, [nodeState]);
  
  return {
    createBlockInPage,
    updateNodePosition,
    duplicateBlock,
    deleteBlock,
  };
}
```

#### 2.2 **컴포넌트 시스템 로직 분리**
```typescript
// 📦 domains/react-flow-canvas/commands/useReactFlowComponentCommands.ts
export function useReactFlowComponentCommands() {
  const nodeState = useReactFlowNodeState();
  
  const promoteBlockToComponentDefinition = useCallback(async (
    blockId: string,
    componentKey?: string,
    componentName?: string
  ): Promise<CreateStatus> => {
    // 1. React Flow Node에서 Block 데이터 추출
    const nodes = nodeState.getNodes();
    const sourceNode = nodes.find(n => n.id === blockId);
    const sourceBlock = sourceNode?.data?.block;
    
    if (!sourceBlock) {
      return { ok: false, error: "Source block not found" };
    }
    
    // 2. 컴포넌트 정의 생성 (DB)
    const definitionTemplate = generateComponentDefinitionTemplate(
      sourceBlock, componentKey, componentName
    );
    
    const defResult = await createBlockAction({
      workspaceId,
      blockType: definitionTemplate.block_type,
      name: definitionTemplate.name,
      slug: definitionTemplate.slug,
      metadata: definitionTemplate.metadata,
      object: "component",
    });
    
    if (!defResult.success) {
      return { ok: false, error: String(defResult.error) };
    }
    
    // 3. React Flow Node에 컴포넌트 정의 추가
    const definitionNode = {
      id: defResult.data.id,
      type: "component",
      position: { x: 100, y: 100 },
      data: { block: defResult.data }
    };
    nodeState.addNode(definitionNode);
    
    // 4. 원본 블록을 인스턴스로 변환 (DB)
    const instanceTemplate = generateComponentInstanceTemplate(
      defResult.data, sourceBlock.name
    );
    
    const instResult = await updateBlockAction({
      id: blockId,
      object: "block",
      metadata: instanceTemplate.metadata,
    });
    
    if (instResult.success) {
      // 5. React Flow Node 업데이트
      nodeState.updateNode(blockId, {
        data: { block: instResult.data }
      });
    }
    
    return { ok: instResult.success, error: instResult.error };
  }, [nodeState]);
  
  return {
    promoteBlockToComponentDefinition,
    createInstanceInPage,
    detachComponentInstance,
    resetInstanceStyle,
    resetInstanceField,
  };
}
```

#### 2.3 **UI 스타일 로직 분리**
```typescript
// 📦 domains/react-flow-canvas/commands/useReactFlowStyleCommands.ts
export function useReactFlowStyleCommands() {
  const nodeState = useReactFlowNodeState();
  
  const updateShape = useCallback(async (
    nodeId: string,
    shape: string
  ): Promise<CreateStatus> => {
    // 1. React Flow Node 즉시 업데이트 (SSOT)
    const nodes = nodeState.getNodes();
    const currentNode = nodes.find(n => n.id === nodeId);
    const currentBlock = currentNode?.data?.block;
    
    if (!currentBlock) {
      return { ok: false, error: "Block not found" };
    }
    
    nodeState.updateNode(nodeId, {
      data: {
        block: {
          ...currentBlock,
          metadata: {
            ...currentBlock.metadata,
            node_ui: {
              ...currentBlock.metadata?.node_ui,
              shape,
            }
          }
        }
      }
    });
    
    // 2. DB 동기화
    const result = await updateBlockAction({
      id: nodeId,
      metadata: {
        ...currentBlock.metadata,
        node_ui: {
          ...currentBlock.metadata?.node_ui,
          shape,
        }
      }
    });
    
    if (!result.success) {
      // 3. 실패 시 React Flow Node 롤백
      nodeState.updateNode(nodeId, {
        data: { block: currentBlock }
      });
    }
    
    return { ok: result.success, error: result.error };
  }, [nodeState]);
  
  return {
    updateShape,
    updateColor,
    updateFontSize,
    updateSize,
  };
}
```

### Phase 3: 통합 및 정리

#### 3.1 **메인 React Flow Commands 통합**
```typescript
// 📦 domains/react-flow-canvas/commands/useReactFlowCommands.ts
export function useReactFlowCommands() {
  const nodeHandler = useReactFlowNodeHandler();
  const blockCommands = useReactFlowBlockCommands();
  const componentCommands = useReactFlowComponentCommands();
  const styleCommands = useReactFlowStyleCommands();
  
  return {
    // React Flow 이벤트 핸들러
    ...nodeHandler,
    
    // 비즈니스 로직 명령
    ...blockCommands,
    ...componentCommands,
    ...styleCommands,
  };
}
```

#### 3.2 **타입 정의 분리**
```typescript
// 📦 domains/react-flow-canvas/types/react-flow-commands.ts
export interface ReactFlowNodeState {
  updateNode: (nodeId: string, updates: any) => void;
  removeNode: (nodeId: string) => void;
  addNode: (node: any) => void;
  rekeyNode: (fromId: string, toId: string, updates?: any) => void;
  getNodes: () => ReactFlowNode[];
  setNodes: (nodes: ReactFlowNode[]) => void;
}

export interface ReactFlowBlockCommands {
  createBlockInPage: (pageId: string, kind: string, at?: { x: number; y: number }) => Promise<CreateStatus>;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => Promise<CreateStatus>;
  duplicateBlock: (blockId: string, offset?: { x: number; y: number }) => Promise<CreateStatus>;
  deleteBlock: (blockId: string) => Promise<CreateStatus>;
}

export interface ReactFlowComponentCommands {
  promoteBlockToComponentDefinition: (blockId: string, componentKey?: string, componentName?: string) => Promise<CreateStatus>;
  createInstanceInPage: (pageId: string, definitionId: string, at?: { x: number; y: number }, instanceName?: string) => Promise<CreateStatus>;
  detachComponentInstance: (instanceId: string) => Promise<CreateStatus>;
  resetInstanceStyle: (instanceId: string) => Promise<CreateStatus>;
  resetInstanceField: (instanceId: string, fieldPath: string[]) => Promise<CreateStatus>;
}

export interface ReactFlowStyleCommands {
  updateShape: (nodeId: string, shape: string) => Promise<CreateStatus>;
  updateColor: (nodeId: string, color: string) => Promise<CreateStatus>;
  updateFontSize: (nodeId: string, fontSize: string) => Promise<CreateStatus>;
  updateSize: (nodeId: string, size: { width: number; height: number }) => Promise<CreateStatus>;
}
```

## 🔄 데이터 흐름 개선

### Before (현재)
```
React Flow Event → useReactFlowCommands (1584줄)
    ↓
React Flow Node + Block + Component + Style + Server Sync
```

### After (리팩토링 후)
```
React Flow Event → useReactFlowNodeHandler
    ↓
React Flow Node (SSOT) → useReactFlowCommands
    ↓
Server Actions
```

## 📊 리팩토링 효과

### 1. **단일 책임 원칙 준수**
- React Flow Node 상태 관리: `useReactFlowNodeState`
- React Flow 이벤트 처리: `useReactFlowNodeHandler`
- 일반 비즈니스 로직: `useReactFlowBlockCommands`
- 컴포넌트 시스템: `useReactFlowComponentCommands`
- UI 스타일: `useReactFlowStyleCommands`

### 2. **SSOT 원칙 준수**
- React Flow Canvas 내부: **React Flow Node가 SSOT**
- React Flow Node에서 바로 DB 동기화
- 명확한 경계와 책임 분리

### 3. **코드 품질 향상**
- 각 훅이 100-200줄 이내로 축소
- 독립적인 테스트 가능
- 재사용성 향상
- 유지보수성 개선

### 4. **성능 최적화**
- 필요한 기능만 import 가능
- 불필요한 리렌더링 방지
- 메모리 사용량 최적화

## 🚀 구현 우선순위

### **Phase 0 (1주차): React Flow Node Data 구조 변경** ⭐ **최우선**
**모든 후속 작업의 기반이 되는 핵심 작업**

#### 현재 문제점
```typescript
// 현재: 너무 깊은 구조
node.data.block.metadata.node_ui.color
node.data.block.metadata.data.customField
node.data.block.metadata.schema.fields
```

#### 목표 구조
```typescript
// 목표: Flat 구조
node.data.nodeUI.color
node.data.userData.customField
node.data.formSchema.fields
node.data.block // 원본 참조 유지
```

#### 작업 내용

##### 1. 새로운 타입 정의 (`types/react-flow-node-data.ts`)
```typescript
export type ReactFlowNodeData = {
  // 원본 Block 참조 (읽기 전용, 동기화용)
  block: Block;
  
  // React Flow에서 자주 사용하는 데이터들을 flat하게
  nodeUI: {
    color?: string;
    shape?: string;
    size?: { width: number; height: number };
    fontSize?: string;
    weight?: string;
  };
  
  userData: Record<string, unknown>; // metadata.data
  formSchema: UserSchema; // metadata.schema
  
  // 컴포넌트 관련
  componentId?: string;
  componentKey?: string;
  isInstance?: boolean;
  isDefinition?: boolean;
  
  // 기타 메타데이터
  [key: string]: unknown;
};
```

##### 2. useReactFlowCanvasAdapter.tsx 수정
```typescript
// Block → Flat ReactFlowNodeData 변환 함수
function transformBlockToFlatNodeData(
  block: Block,
  componentDefinitionsById?: Record<string, ComponentDefinition>
): ReactFlowNodeData {
  const metadata = block.metadata as DefaultMetadata;
  
  return {
    block,
    nodeUI: {
      color: metadata.node_ui?.color,
      shape: metadata.node_ui?.shape,
      size: metadata.node_ui?.size,
      fontSize: metadata.node_ui?.fontSize,
      weight: metadata.node_ui?.weight,
    },
    userData: metadata.data || {},
    formSchema: metadata.schema || { fields: [] },
    componentId: metadata.component_id,
    componentKey: metadata.component_key,
    isInstance: isComponentInstance(block),
    isDefinition: isComponentDefinition(block),
  };
}
```

##### 3. 정책들 수정

**block-rendering-policy.ts**: buildNode 메서드들
```typescript
class ShapeRenderingPolicy implements BlockRenderingPolicy {
  buildNode(block: Block): NodeDefinition {
    const flatData = transformBlockToFlatNodeData(block);
    return {
      nodeType: "shape",
      data: flatData,
      width: flatData.nodeUI.size?.width,
      height: flatData.nodeUI.size?.height,
    };
  }
}
```

**block-editor-policy.ts**: EditorField path 수정
```typescript
// EditorField path를 flat 구조에 맞게 수정
const shapeFields = [
  {
    key: "shape",
    label: "Shape",
    type: "shape",
    path: ["nodeUI", "shape"], // 변경됨
    options: ShapePolicy.getShapeOptions(),
  },
  {
    key: "color",
    label: "Color", 
    type: "color",
    path: ["nodeUI", "color"], // 변경됨
    options: ShapePolicy.getColorOptions(),
  },
];
```

**block-addition-policy.ts**: generateSchemaAndData 수정
```typescript
function generateSchemaAndData(kind: BlockType) {
  // flat 구조로 데이터 구성
  const nodeUI: NodeUIData = {};
  const userData: Record<string, unknown> = {};
  
  schemaFields.forEach((field) => {
    const path = field.path || ["userData", field.id];
    
    if (path[0] === "nodeUI" && path[1]) {
      nodeUI[path[1] as keyof NodeUIData] = defaultValue;
    } else {
      userData[field.id] = defaultValue;
    }
  });
  
  return { nodeUI, userData, formSchema: { fields: schemaFields } };
}
```

### Phase 1 (2주차): React Flow Node SSOT 확립
1. `useReactFlowNodeState` 구현 (flat 구조 기반)
2. `useReactFlowNodeHandler` 구현
3. 기존 코드에서 React Flow Node 조작 부분 분리

### Phase 2 (3주차): 비즈니스 로직 분리
1. `useReactFlowBlockCommands` 구현 (flat 구조 기반)
2. `useReactFlowComponentCommands` 구현
3. `useReactFlowStyleCommands` 구현 (nodeUI 직접 접근)

### Phase 3 (4주차): React Flow 컴포넌트 업데이트
1. Node 컴포넌트들 flat 구조 적용
2. Editor 컴포넌트들 path 처리 수정
3. Commands 함수들 flat 구조 업데이트

### Phase 4 (5주차): 통합 및 정리
1. `useReactFlowCommands` 통합
2. 기존 코드 마이그레이션 완료
3. 성능 검증 및 최종 정리



## 📝 결론

이 리팩토링을 통해:

1. **명확한 SSOT**: React Flow Canvas 내에서는 React Flow Node가 SSOT
2. **책임 분리**: 각 훅이 단일 책임을 가짐
3. **코드 품질**: 유지보수성과 테스트 용이성 향상
4. **성능 최적화**: 불필요한 리렌더링 방지
5. **확장성**: 새로운 기능 추가 시 해당 훅만 수정

핸들러 vs 훅 아키텍처 패턴을 완벽하게 적용하여 React Flow Canvas의 독립성과 재사용성을 확보할 수 있습니다! 🎉
