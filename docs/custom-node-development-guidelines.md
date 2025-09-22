# 커스텀 노드 개발 지침서

## 개요

이 문서는 React Flow Canvas를 활용한 서비스에서 새로운 커스텀 노드를 개발할 때 따라야 할 지침과 패턴을 설명합니다. 현재 구현된 `TextNode`와 `ShapeNode`를 기반으로 공통된 아키텍처 패턴과 개발 원칙을 정리했습니다.

## 현재 코드 구조 분석

### 1. 노드 컴포넌트 구조

모든 커스텀 노드는 다음과 같은 공통 구조를 따릅니다:

```
CustomNode/
├── index.ts                    # 노드 등록 및 export
├── custom-node.tsx            # 메인 노드 컴포넌트
├── toolbar-items/             # 툴바 아이템들
│   ├── index.ts              # 툴바 아이템 export
│   ├── custom-toolbar-item.tsx
│   └── ...
└── resizer-controls/          # 리사이즈 컨트롤
    ├── custom-resizer.tsx
    └── ...
```

### 2. 핵심 컴포넌트 패턴

#### 2.1 메인 노드 컴포넌트 (`custom-node.tsx`)

```tsx
export function CustomNode({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // 1. 데이터 추출 및 검증
  const d = (data || {}) as CustomNodeData;
  const nodeUI = d.nodeUI || {};
  
  // 2. 현재 노드 객체 생성 (props 기반)
  const currentNode = {
    id,
    type: "custom",
    selected,
    position: { x: 0, y: 0 },
    data: d,
    width,
    height,
  };

  // 3. 툴바 아이템 구성
  const toolbarItems = (
    <>
      <CustomToolbarItem
        node={currentNode}
        currentValue={value}
      />
      {/* 추가 툴바 아이템들 */}
    </>
  );

  // 4. 렌더링 구조
  return (
    <>
      {/* 리사이즈 컨트롤 */}
      <CustomResizerControl
        node={currentNode}
        selected={selected || false}
        minWidth={80}
        minHeight={40}
      />

      {/* 상단 툴바 */}
      <NodeTopToolbar
        node={currentNode}
        toolbarItems={toolbarItems}
      />

      {/* 핸들 */}
      <Handle type="target" position={Position.Left} />
      
      {/* 노드 본문 */}
      <div className="...">
        {/* 노드별 고유 콘텐츠 */}
      </div>

      <Handle type="source" position={Position.Right} />
    </>
  );
}
```

#### 2.2 툴바 아이템 패턴

```tsx
interface CustomToolbarItemProps {
  node: Node;
  currentValue: string;
  disabled?: boolean;
}

export function CustomToolbarItem({ 
  node,
  currentValue, 
  disabled = false 
}: CustomToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleValueChange = useCallback(async (newValue: string) => {
    const result = await styleCommands.updateCustomProperty(node, newValue);
    if (!result.ok) {
      console.error("업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          {/* 툴바 아이템 UI */}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        {/* 툴바 아이템 콘텐츠 */}
      </PopoverContent>
    </Popover>
  );
}
```

#### 2.3 리사이즈 컨트롤 패턴

```tsx
interface CustomResizerControlProps {
  node: Node;
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
  resizeDirection?: "horizontal" | "vertical" | "both";
}

export function CustomResizerControl({
  node,
  selected,
  minWidth = 80,
  minHeight = 40,
  resizeDirection = "both"
}: CustomResizerControlProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  const handleResizeEnd = useCallback(async (_event: any, resizeData: { width: number; height: number }) => {
    const result = await styleCommands.updateSize(node, {
      width: resizeData.width,
      height: resizeData.height,
    });

    if (!result.ok) {
      console.error("노드 사이즈 업데이트 실패:", result.error);
      // 실패 시 원래 크기로 롤백
      reactFlow.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id
            ? { ...n, width: node.width, height: node.height }
            : n
        )
      );
    }
  }, [node, styleCommands, reactFlow]);

  if (!selected) return null;

  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      onResizeEnd={handleResizeEnd}
      // 추가 스타일링 및 설정
    />
  );
}
```

## 데이터 구조 및 타입 정의

### 1. 노드 데이터 타입 정의

```tsx
// 1. 노드 UI 타입 정의
export type CustomNodeUI = BaseNodeUI & { 
  customProperty: string;
  // 추가 UI 속성들
};

// 2. 폼 데이터 타입 정의
export type CustomFormData = FormDataWithExtras<{
  // 노드별 고유 폼 데이터
}>;

// 3. 메타데이터 타입 정의
export type CustomMetadata = DefaultMetadata & {
  nodeUI: CustomNodeUI;
  formData: CustomFormData;
};

// 4. React Flow 노드 타입 정의
export type ReactFlowCustomNodeData = ReactFlowNodeData & {
  nodeUI: CustomNodeUI;
  formData: CustomFormData;
};
```

### 2. 공통 데이터 구조

모든 노드는 다음 공통 구조를 따릅니다:

```tsx
type DefaultMetadata = {
  nodeUI: NodeUI;           // 노드 UI 속성
  formSchema: FormSchema;    // 폼 스키마 정의
  formData: Record<string, unknown>; // 폼 데이터
  role: "definition" | "instance";   // 노드 역할
  instanceData?: ComponentInstanceData; // 컴포넌트 인스턴스 데이터
  componentData?: ComponentDefinitionData; // 컴포넌트 정의 데이터
  pageData?: PageBlockData;  // 페이지 데이터
  content?: string;          // 콘텐츠
  [key: string]: unknown;    // 추가 속성들
};
```

## 개발 원칙 및 지침

### 1. 단일 진실 소스 (SSOT) 원칙

- **React Flow 노드가 SSOT**: 모든 상태 변경은 React Flow 노드를 통해 이루어져야 함
- **Optimistic Updates**: 사용자 경험을 위해 즉시 UI 업데이트 후 백그라운드에서 DB 저장
- **롤백 메커니즘**: 실패 시 원래 상태로 복원하는 로직 필수

### 2. 컴포넌트 분리 원칙

- **관심사 분리**: 노드 렌더링, 툴바, 리사이즈 컨트롤을 별도 컴포넌트로 분리
- **재사용성**: 공통 기능은 별도 컴포넌트로 추출하여 재사용
- **책임 명확화**: 각 컴포넌트의 역할과 책임을 명확히 정의

### 3. 타입 안전성

- **TypeScript 활용**: 모든 props와 데이터에 적절한 타입 정의
- **런타임 검증**: 데이터 유효성 검증 및 기본값 처리
- **타입 가드**: 런타임에서 타입 안전성 보장

### 4. 에러 처리

- **Graceful Degradation**: 에러 발생 시에도 사용자 경험 유지
- **사용자 피드백**: 에러 상황에 대한 명확한 피드백 제공
- **로깅**: 디버깅을 위한 적절한 로깅 구현

## 새로운 노드 개발 단계

### 1. 타입 정의

```tsx
// 1. 노드 UI 타입 정의
export type NewNodeUI = BaseNodeUI & {
  // 노드별 고유 UI 속성들
};

// 2. 폼 데이터 타입 정의
export type NewFormData = FormDataWithExtras<{
  // 노드별 고유 폼 데이터
}>;

// 3. 메타데이터 타입 정의
export type NewMetadata = DefaultMetadata & {
  nodeUI: NewNodeUI;
  formData: NewFormData;
};

// 4. React Flow 노드 타입 정의
export type ReactFlowNewNodeData = ReactFlowNodeData & {
  nodeUI: NewNodeUI;
  formData: NewFormData;
};
```

### 2. 메인 노드 컴포넌트 구현

```tsx
export function NewNode({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // 데이터 추출 및 검증
  const d = (data || {}) as NewNodeData;
  const nodeUI = d.nodeUI || {};
  
  // 현재 노드 객체 생성
  const currentNode = {
    id,
    type: "new-node",
    selected,
    position: { x: 0, y: 0 },
    data: d,
    width: Math.max(80, nodeW || nodeUI?.size?.width || 160),
    height: Math.max(40, nodeH || nodeUI?.size?.height || 64),
  };

  // 툴바 아이템 구성
  const toolbarItems = (
    <>
      {/* 필요한 툴바 아이템들 */}
    </>
  );

  return (
    <>
      {/* 리사이즈 컨트롤 */}
      <NewNodeResizerControl
        node={currentNode}
        selected={selected || false}
        minWidth={80}
        minHeight={40}
      />

      {/* 상단 툴바 */}
      <NodeTopToolbar
        node={currentNode}
        toolbarItems={toolbarItems}
      />

      {/* 핸들 */}
      <Handle type="target" position={Position.Left} className="opacity-50 w-2.5 h-2.5" />
      
      {/* 노드 본문 */}
      <div className="...">
        {/* 노드별 고유 콘텐츠 */}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-50 w-2.5 h-2.5" />
    </>
  );
}
```

### 3. 툴바 아이템 구현

```tsx
export function NewNodeToolbarItem({ 
  node,
  currentValue, 
  disabled = false 
}: NewNodeToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleValueChange = useCallback(async (newValue: string) => {
    const result = await styleCommands.updateCustomProperty(node, newValue);
    if (!result.ok) {
      console.error("업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          {/* 툴바 아이템 UI */}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        {/* 툴바 아이템 콘텐츠 */}
      </PopoverContent>
    </Popover>
  );
}
```

### 4. 리사이즈 컨트롤 구현

```tsx
export function NewNodeResizerControl({
  node,
  selected,
  minWidth = 80,
  minHeight = 40,
  resizeDirection = "both"
}: NewNodeResizerControlProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  const handleResizeEnd = useCallback(async (_event: any, resizeData: { width: number; height: number }) => {
    const result = await styleCommands.updateSize(node, {
      width: resizeData.width,
      height: resizeData.height,
    });

    if (!result.ok) {
      console.error("노드 사이즈 업데이트 실패:", result.error);
      // 롤백 로직
      reactFlow.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id
            ? { ...n, width: node.width, height: node.height }
            : n
        )
      );
    }
  }, [node, styleCommands, reactFlow]);

  if (!selected) return null;

  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      onResizeEnd={handleResizeEnd}
      resizeDirection={resizeDirection}
      // 추가 스타일링
    />
  );
}
```

### 5. 노드 등록

```tsx
// index.ts
export { NewNode } from './new-node';
export { NewNodeToolbarItem } from './toolbar-items/new-node-toolbar-item';
export { NewNodeResizerControl } from './resizer-controls/new-node-resizer-control';

// 노드 타입 등록
export const NEW_NODE_TYPE = 'new-node';
```

## 공통 패턴 및 베스트 프랙티스

### 1. 이벤트 처리

```tsx
// 이벤트 전파 방지
onMouseDown={(e) => e.stopPropagation()}
onClick={(e) => e.stopPropagation()}

// 키보드 이벤트 처리
const handleEscape = useCallback((e: React.KeyboardEvent) => {
  e.stopPropagation();
  if (isEditing) {
    setIsEditing(false);
  } else if (selected) {
    selectionCommands.selectNodes([]);
  }
}, [isEditing, selected, selectionCommands]);
```

### 2. 상태 관리

```tsx
// 로컬 상태는 최소화하고 React Flow 노드를 SSOT로 활용
const [isEditing, setIsEditing] = useState(false);

// 노드 데이터는 props에서 추출
const nodeUI = d.nodeUI || {};
const title = d.title ?? "Default Title";
```

### 3. 스타일링

```tsx
// Tailwind CSS 클래스 활용
className={`w-full p-2 rounded-md transition-colors relative flex overflow-hidden ${tailwindOutlineColor} ${selected ? 'outline-4' : 'outline-0'}`}

// 동적 스타일링
style={{ 
  backgroundColor: data.nodeUI.richStyle ? backgroundColor : 'transparent',
  width: width,
  outlineOffset: '0px',
}}
```

### 4. 접근성

```tsx
// 적절한 ARIA 레이블과 타이틀
title="Text Color"
aria-label="Select color"

// 키보드 네비게이션 지원
onKeyDown={handleKeyDown}
tabIndex={0}
```

## 테스트 및 품질 보증

### 1. 단위 테스트

```tsx
// 컴포넌트 렌더링 테스트
describe('NewNode', () => {
  it('should render correctly with default props', () => {
    // 테스트 로직
  });

  it('should handle toolbar interactions', () => {
    // 툴바 상호작용 테스트
  });
});
```

### 2. 통합 테스트

```tsx
// React Flow와의 통합 테스트
describe('NewNode Integration', () => {
  it('should work with React Flow commands', () => {
    // React Flow 명령어와의 통합 테스트
  });
});
```

### 3. 사용성 테스트

- 키보드 네비게이션 테스트
- 접근성 테스트
- 반응형 동작 테스트

## 성능 최적화

### 1. 메모이제이션

```tsx
// 컴포넌트 메모이제이션
export default memo(NewNode);

// 콜백 메모이제이션
const handleValueChange = useCallback(async (newValue: string) => {
  // 로직
}, [node, styleCommands]);

// 계산된 값 메모이제이션
const computedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 2. 렌더링 최적화

- 불필요한 리렌더링 방지
- 조건부 렌더링 최적화
- 가상화 고려 (대량 노드 처리 시)

## 결론

이 지침서는 현재 구현된 `TextNode`와 `ShapeNode`의 패턴을 기반으로 작성되었습니다. 새로운 커스텀 노드를 개발할 때는 이 패턴을 따르되, 노드의 고유한 요구사항에 맞게 적절히 조정하시기 바랍니다.

주요 핵심 원칙:
1. **React Flow 노드를 SSOT로 활용**
2. **컴포넌트 분리 및 재사용성 고려**
3. **타입 안전성 및 에러 처리 철저히**
4. **사용자 경험을 위한 Optimistic Updates**
5. **일관된 UI/UX 패턴 유지**

이러한 원칙을 따르면 확장 가능하고 유지보수가 용이한 커스텀 노드 시스템을 구축할 수 있습니다.
