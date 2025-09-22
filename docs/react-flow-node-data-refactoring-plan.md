# React Flow Node Data 구조 리팩토링 계획

## 📋 현재 문제점

### 1. 너무 깊은 구조
```typescript
// 현재: 3-4단계 깊이
node.data.block.metadata.node_ui.color
node.data.block.metadata.data.customField
node.data.block.metadata.schema.fields
```

### 2. 렌더링 성능 이슈
- React Flow 노드 렌더링 시마다 깊은 객체 접근
- 불필요한 리렌더링 발생
- 타입 안정성 부족

## 🎯 목표: Flat 구조로 변경

### 새로운 React Flow Node Data 구조
```typescript
type ReactFlowNodeData = {
  // 원본 Block 참조 (읽기 전용, 동기화용)
  block: Block;
  
  // React Flow에서 자주 사용하는 데이터들을 flat하게
  nodeUI: {
    color?: string;
    shape?: string;
    size?: { width: number; height: number };
    fontSize?: string;
    weight?: string;
    // ... 기타 UI 관련 속성들
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

### 접근 경로 개선
```typescript
// Before
node.data.block.metadata.node_ui.color
node.data.block.metadata.data.customField
node.data.block.metadata.schema.fields

// After
node.data.nodeUI.color
node.data.userData.customField
node.data.formSchema.fields
```

## 🔧 수정이 필요한 컴포넌트들

### 1. **useReactFlowCanvasAdapter.tsx**
- `buildComponentAwareNodeDefinition` 함수 수정
- Block → ReactFlowNodeData 변환 로직 변경
- 컴포넌트 관련 메타데이터 처리

### 2. **block-rendering-policy.ts**
- `buildNode` 메서드들의 반환 데이터 구조 변경
- 각 정책별 flat 구조 적용
- NodeDefinition 타입 업데이트

### 3. **block-editor-policy.ts**
- `getMergedFields` 함수의 path 처리 로직 변경
- EditorField의 path를 flat 구조에 맞게 수정
- 컴포넌트 인스턴스 필드 처리 개선

### 4. **block-addition-policy.ts**
- `generateSchemaAndData` 함수 수정
- `getDefaultBlockTemplate` 함수의 메타데이터 구조 변경

### 5. **component-policy.ts**
- 컴포넌트 정의/인스턴스 생성 시 flat 구조 적용
- 스타일 오버라이드 로직 수정

## 📋 Phase별 구현 계획

### Phase 1: 타입 정의 및 어댑터 수정 (1주)

#### 1.1 새로운 타입 정의
```typescript
// types/react-flow-node-data.ts
export type ReactFlowNodeData = {
  block: Block;
  nodeUI: NodeUIData;
  userData: Record<string, unknown>;
  formSchema: UserSchema;
  componentId?: string;
  componentKey?: string;
  isInstance?: boolean;
  isDefinition?: boolean;
  [key: string]: unknown;
};

export type NodeUIData = {
  color?: string;
  shape?: string;
  size?: { width: number; height: number };
  fontSize?: string;
  weight?: string;
};
```

#### 1.2 useReactFlowCanvasAdapter 수정
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

### Phase 2: 정책들 수정 (1주)

#### 2.1 block-rendering-policy.ts 수정
```typescript
// 각 정책의 buildNode 메서드 수정
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

#### 2.2 block-editor-policy.ts 수정
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

#### 2.3 block-addition-policy.ts 수정
```typescript
// generateSchemaAndData에서 flat 구조 적용
function generateSchemaAndData(kind: BlockType) {
  // ... 기존 로직
  
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

### Phase 3: React Flow 컴포넌트들 수정 (1주)

#### 3.1 Node 컴포넌트들 수정
- `shape-node.tsx`: `node.data.nodeUI.color` 접근 방식으로 변경
- `basic-text-node.tsx`: flat 구조 접근으로 변경
- `node-chrome.tsx`: 공통 스타일 처리 로직 수정

#### 3.2 Editor 컴포넌트들 수정
- Property 입력 컴포넌트들의 path 처리 로직 변경
- Form validation 로직 수정

#### 3.3 Commands 함수들 수정
```typescript
// useReactFlowCommands에서 flat 구조 업데이트
const updateShape = useCallback(async (nodeId: string, shape: string) => {
  // React Flow Node 즉시 업데이트 (SSOT)
  nodeState.updateNode(nodeId, {
    data: {
      ...currentData,
      nodeUI: {
        ...currentData.nodeUI,
        shape,
      }
    }
  });
  
  // DB 동기화
  await updateBlockAction(nodeId, {
    metadata: {
      ...currentBlock.metadata,
      node_ui: {
        ...currentBlock.metadata.node_ui,
        shape,
      }
    }
  });
}, []);
```

## 🔄 데이터 동기화 전략

### React Flow Node → DB Block
```typescript
function syncNodeDataToBlock(nodeData: ReactFlowNodeData): Partial<Block> {
  return {
    metadata: {
      ...nodeData.block.metadata,
      node_ui: nodeData.nodeUI,
      data: nodeData.userData,
      schema: nodeData.formSchema,
      component_id: nodeData.componentId,
      component_key: nodeData.componentKey,
    }
  };
}
```

### DB Block → React Flow Node
```typescript
function syncBlockToNodeData(block: Block): ReactFlowNodeData {
  return transformBlockToFlatNodeData(block);
}
```

## ✅ 검증 계획

### 1. 타입 안정성 검증
- TypeScript 컴파일 에러 없음
- 모든 접근 경로 타입 체크 통과

### 2. 렌더링 성능 검증
- React DevTools Profiler로 리렌더링 측정
- 깊은 객체 접근 횟수 감소 확인

### 3. 기능 정상 동작 검증
- 노드 생성/수정/삭제 정상 동작
- 에디터 패널 정상 동작
- 컴포넌트 시스템 정상 동작

## 🎯 예상 개선 효과

1. **개발자 경험 향상**: 짧고 직관적인 접근 경로
2. **렌더링 성능 개선**: 깊은 객체 접근 최소화
3. **타입 안정성 향상**: 명확한 타입 정의
4. **유지보수성 향상**: 일관된 데이터 구조
5. **SSOT 원칙 준수**: React Flow Node가 명확한 SSOT 역할

## 📅 구현 일정

- **Week 1**: Phase 1 (타입 정의 및 어댑터)
- **Week 2**: Phase 2 (정책들 수정)  
- **Week 3**: Phase 3 (React Flow 컴포넌트들)
- **Week 4**: 통합 테스트 및 최적화
