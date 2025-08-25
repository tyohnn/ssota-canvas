# Canvas Domain Refactoring - 완료 보고서

## 🔍 리팩토링 배경 및 이유

### 기존 문제점

**"모든 것이 한 곳에 섞여있어요"**

기존 캔버스 코드는 마치 모든 재료를 한 냄비에 넣고 끓이는 것처럼:

- 데이터 관리 (블록, 엣지, 위치)
- UI 상태 (패널 열기/닫기, 선택)
- React Flow 특화 로직
- 데이터베이스 저장
- 이벤트 처리

이 모든 것이 `CanvasContext`와 `useCanvasBlocks`에 뒤엉켜 있어서 **테스트하기 어렵고, 수정하기 어렵고, 확장하기 어려운** 상태였습니다.

### 구체적인 문제점들

1. **God Context Surface**

   - `CanvasContext`가 SSOT 데이터, XYFlow 노드/엣지, 선택 상태, 패널 제어, 변이 명령을 모두 혼재
   - 79줄의 거대한 인터페이스로 너무 많은 책임을 가짐

2. **Orchestration in a Single Hook**

   - `useCanvasBlocks`가 스토어 초기화, 캐싱, XYFlow 매핑, 핸들러, UI 반응, 명령을 한 곳에서 처리
   - 여러 축의 변경이 하나의 단위에 집중되어 응집도가 낮음

3. **Side Effects in State Hooks**

   - `useEdgeState.upsertEdge`가 상태 업데이트마다 DB에 쓰기
   - `useBlockHandler.createBlockInPage`가 UI 패널, 선택, SSOT, DB 라운드트립을 모두 연결

4. **UI Events Directly Mutate Domain**
   - `useReactFlowHandler`가 `useCanvas`를 읽고 블록 메타데이터/위치를 직접 수정
   - UI 패널 조작도 함께 수행하여 결합도가 높음

## 🎯 리팩토링 목표

**"각자 맡은 일을 하도록 분리하자"**

### 설계 원칙

1. **단일 책임 원칙**: 각 모듈은 하나의 명확한 책임만 가짐
2. **의존성 역전**: 고수준 모듈이 저수준 모듈에 의존하지 않음
3. **관심사 분리**: 도메인 로직, UI 로직, 데이터 접근 로직을 명확히 분리
4. **테스트 용이성**: 각 계층을 독립적으로 테스트 가능

## 🏗️ 구현된 아키텍처

### 1. **도메인 계층** (핵심 비즈니스 로직)

```
📦 Policy/
├── 🎯 BlockRenderingPolicy - 블록 렌더링 정책
├── 🎯 BlockEditorPolicy - 블록 편집 정책
├── 🎯 BlockAdditionPolicy - 블록 추가 정책
├── 🎯 ComponentPolicy - 컴포넌트 시스템 정책
├── 🎨 ShapePolicy - 도형 및 색상 정책 (SSOT)
└── 👁️ ViewPolicy - 뷰 타입 및 설정 정책
```

- **순수한 비즈니스 로직만** 담당
- UI나 데이터베이스에 의존하지 않음
- **SSOT (Single Source of Truth)** 역할로 색상, 도형, 뷰 정의를 중앙화

#### 🎨 ShapePolicy - 도형 및 색상 SSOT

**핵심 기능:**

- **색상 정의**: 8가지 기본 색상 (gray, red, orange, yellow, green, blue, purple, pink)
- **도형 정의**: 7가지 기본 도형 (rect, circle, diamond, hexagon, cylinder, parallelogram, triangle)
- **일관된 스타일링**: 모든 UI 컴포넌트에서 동일한 색상 팔레트 사용
- **SVG 아이콘**: 각 도형별 React SVG 아이콘 제공

**주요 메서드:**

```typescript
// 색상 관련
ShapePolicy.getColorDefinition(colorKey); // 색상 정의 조회
ShapePolicy.getColorOptions(); // 선택 옵션용 색상 목록
ShapePolicy.getBadgeStyle(colorKey); // 배지 스타일 클래스
ShapePolicy.getHexColor(colorKey); // 파스텔 색상 (SSOT)
ShapePolicy.getMainHexColor(colorKey); // 메인 색상

// 도형 관련
ShapePolicy.getShapeDefinition(shapeKey); // 도형 정의 조회
ShapePolicy.getShapeOptions(); // 선택 옵션용 도형 목록
ShapePolicy.getShapeComponentProps(); // React 컴포넌트용 props
ShapePolicy.getResizeComponentProps(); // 리사이저용 props
```

#### 👁️ ViewPolicy - 뷰 타입 및 설정 정책

**핵심 기능:**

- **뷰 타입 정의**: canvas, table, kanban, markdown
- **뷰 설정 관리**: 각 뷰 타입별 설정 구조 정의
- **페이지별 뷰**: 페이지 블록의 메타데이터에서 뷰 정보 추출
- **기본 뷰 해결**: 뷰 정의가 없을 때 기본값 처리

**주요 메서드:**

```typescript
ViewPolicy.extractPageViewsMetadata(pageBlock); // 페이지 뷰 메타데이터 추출
ViewPolicy.getAvailableViews(pageBlock); // 사용 가능한 뷰 목록
ViewPolicy.resolveInitialViewId(pageBlock); // 초기 뷰 ID 해결
ViewPolicy.findViewDefinition(pageBlock, viewId); // 특정 뷰 정의 조회
```

### 2. **저장소 계층** (데이터 관리)

```
📦 Stores/
├── 🗄️ blocks.store.ts - 블록 상태 관리
├── 🗄️ edges.store.ts - 엣지 상태 관리
├── 🗄️ positions.store.ts - 위치 상태 관리 (LRU 캐시)
└── 🗄️ selection.store.ts - 선택 상태 관리
```

- **상태 관리만** 담당
- 데이터베이스 저장 로직 제거
- 순수한 reducer 패턴 사용

### 3. **컨텍스트 계층** (의존성 주입)

```
📦 Contexts/
├── 📊 CanvasDataContext - 도메인 데이터 쿼리/변경 (컴포넌트 시스템 포함)
├── 🎯 CanvasSelectionContext - 선택 상태 관리
├── ⚡ CanvasCommandsContext - 애플리케이션 명령
└── 🎨 UiLayoutContext - UI 레이아웃 상태
```

- **책임별로 분리된 컨텍스트**
- 각 컨텍스트는 명확한 API 제공
- 선택적 의존성 주입 가능

### 4. **뷰모델 계층** (도메인 → UI 변환)

```
📦 ViewModels/
└── 🔄 useReactFlowViewModel - 도메인 상태를 React Flow 노드/엣지로 변환 (컴포넌트 스타일 해석 포함)
```

- **순수한 변환 로직**
- 컨텍스트 사용하지 않음
- 도메인 타입을 UI 타입으로 매핑
- **SSOT 통합**: ShapePolicy를 통한 일관된 색상/도형 렌더링

#### 🎨 SSOT 통합 예시

**ShapePolicy를 통한 일관된 색상 관리:**

```typescript
// 모든 UI 컴포넌트에서 동일한 색상 팔레트 사용
const colorOptions = ShapePolicy.getColorOptions(); // 선택 옵션
const badgeStyle = ShapePolicy.getBadgeStyle("blue"); // 배지 스타일
const hexColor = ShapePolicy.getHexColor("blue"); // 파스텔 색상

// 도형 렌더링에서 일관된 스타일 적용
const shapeProps = ShapePolicy.getShapeComponentProps(
  "circle",
  "blue",
  100,
  100
);
const resizeProps = ShapePolicy.getResizeComponentProps(
  "circle",
  "blue",
  100,
  100
);
```

**ViewPolicy를 통한 뷰 관리:**

```typescript
// 페이지별 뷰 설정 추출
const { definitions, default: defaultView } =
  ViewPolicy.extractPageViewsMetadata(pageBlock);
const availableViews = ViewPolicy.getAvailableViews(pageBlock);
const initialViewId = ViewPolicy.resolveInitialViewId(pageBlock);
```

### 5. **어댑터 계층** (UI 이벤트 → 도메인 명령)

```
📦 Adapters/
└── 🎮 useReactFlowEventAdapter - React Flow 이벤트를 도메인 명령으로 변환
```

- **이벤트 변환만** 담당
- 직접적인 상태 변경 없음
- 명령 패턴으로 도메인과 연결

### 6. **애플리케이션 계층** (사용 사례)

```
📦 Hooks/
├── ⚡ useCanvasCommands - 복잡한 비즈니스 시나리오 구현 (컴포넌트 명령 포함)
└── 📦 usePagePositionCache - 페이지별 위치 캐싱
```

- **비즈니스 시나리오** 구현
- 여러 저장소를 조합해서 복잡한 작업 수행
- 낙관적 업데이트 + 재조정 패턴

### 7. **핸들러 계층** (UI 이벤트 처리)

```
📦 Handlers/
├── 🎮 useReactFlowHandler - React Flow 이벤트 처리
└── 🎨 useUiLayoutHandler - UI 레이아웃 이벤트 처리
```

- **사용자 상호작용** 처리
- 어댑터와 명령을 조합하여 사용

### 8. **컴포넌트 시스템 계층** (새로 추가)

```
📦 Types/
└── 🧩 component.ts - 컴포넌트 정의/인스턴스 타입 및 유틸리티

📦 Actions/
└── 🗄️ component.action.ts - 컴포넌트 CRUD 서버 액션

📦 Components/
├── 🎨 editor/editor-panel.tsx - 컴포넌트 인스턴스 편집 UI
├── ➕ block-insert-panel.tsx - 컴포넌트 정의 선택 UI
├── 🎮 react-flow-nodes/node-chrome.tsx - 컴포넌트 생성 컨텍스트 메뉴
└── 🐛 debug/ssot-debug-panel.tsx - 컴포넌트 시스템 디버깅 도구
```

- **컴포넌트 정의/인스턴스** 관리
- **스타일 상속 및 오버라이드** 시스템
- **컴포넌트 라이프사이클** 관리

## 🔄 구체적인 개선 사항

### Before (기존)

```typescript
// 하나의 훅에서 모든 것을 처리
const useCanvasBlocks = () => {
  // 데이터 관리
  const { blocks, upsertBlock } = useBlockState();

  // UI 상태
  const { openEditorPanel } = useUiLayoutState();

  // 데이터베이스 저장 (부작용)
  const createBlock = async () => {
    upsertBlock(newBlock); // 즉시 UI 업데이트
    await createBlockAction(newBlock); // DB 저장
    openEditorPanel(); // UI 조작
  };
};
```

### After (리팩토링 완료)

```typescript
// 각자 맡은 일만 처리

// 1. 도메인 저장소 (순수)
const useBlocksStore = () => ({ blocks, upsertBlock });

// 2. 애플리케이션 명령 (비즈니스 로직)
const useCanvasCommands = () => ({
  createBlock: async (data) => {
    blockStore.upsertBlock(newBlock); // 낙관적 업데이트
    await blockRepository.create(newBlock); // DB 저장
    return { ok: true };
  },
  promoteBlockToComponentDefinition: async (blockId, componentKey) => {
    // 컴포넌트 정의 생성 및 원본 블록을 인스턴스로 변환
    const definition = await createComponentDefinition(
      sourceBlock,
      componentKey
    );
    const instance = convertToComponentInstance(sourceBlock, definition.id);
    return { ok: true, definition, instance };
  },
});

// 3. 이벤트 어댑터 (사용자 이벤트)
const useReactFlowEventAdapter = () => ({
  onNodeDrag: (node) => {
    // 단순히 위치 업데이트만
    updateContextPositions(contextId, [{ id: node.id, x: pos.x, y: pos.y }]);
  },
});
```

## 📊 실제 구현된 구조

### 컨텍스트 분리

```typescript
// CanvasDataContext - 도메인 데이터만 (컴포넌트 시스템 포함)
export type CanvasDataContextValue = {
  // Queries
  blocksById: Record<string, Block>;
  positionsByPage: Record<
    string,
    { positions: BlockPosition[]; lastAccessed: Date }
  >;
  edgesById: Record<string, Edge>;

  // Component Queries
  componentDefinitionsById: Record<string, ComponentDefinition>;
  componentInstancesById: Record<string, ComponentInstance>;
  getComponentDefinitionById: (id: string) => ComponentDefinition | null;
  getInstancesForDefinition: (definitionId: string) => ComponentInstance[];
  getAllComponentDefinitions: () => ComponentDefinition[];
  getAllComponentInstances: () => ComponentInstance[];

  // Mutations
  upsertBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;

  // Component Mutations
  upsertComponentDefinition: (definition: ComponentDefinition) => void;
  upsertComponentInstance: (instance: ComponentInstance) => void;
  updateComponentDefinition: (
    id: string,
    updates: Partial<ComponentDefinition>
  ) => void;
  updateComponentInstance: (
    id: string,
    updates: Partial<ComponentInstance>
  ) => void;
  // ... 기타 도메인 변이
};

// CanvasSelectionContext - 선택 상태만
export type CanvasSelectionContextValue = {
  pageId: string | null;
  componentId: string | null;
  nodeIds: string[];
  edgeId: string | null;
  selectPage: (id: string | null) => void;
  // ... 기타 선택 관련
};

// CanvasCommandsContext - 애플리케이션 명령만
export type CanvasCommandsContextValue = {
  createNewPage: () => Promise<CreateStatus>;
  createBlockInPage: (
    pageId: string,
    kind: string,
    at?: { x: number; y: number }
  ) => Promise<CreateStatus>;

  // Component Commands
  promoteBlockToComponentDefinition: (
    blockId: string,
    componentKey?: string,
    componentName?: string
  ) => Promise<CreateStatus>;
  linkBlocksToComponentDefinition: (
    blockIds: string[],
    definitionId: string
  ) => Promise<CreateStatus>;
  createInstanceInPage: (
    pageId: string,
    definitionId: string,
    at?: { x: number; y: number },
    instanceName?: string
  ) => Promise<CreateStatus>;
  resetInstanceStyle: (instanceId: string) => Promise<UpdateStatus>;
  updateInstanceStyle: (
    instanceId: string,
    styleOverrides: Partial<NodeUI>
  ) => Promise<UpdateStatus>;
  openComponentDefinitionEditor: (instanceId: string) => Promise<void>;
  // ... 기타 명령
};
```

### 저장소 순수화

```typescript
// blocks.store.ts - 순수한 상태 관리
export function useBlocksStore(initial?: Block[]) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 데이터베이스 호출 제거
  const upsertBlock = useCallback(
    (block: Block) => dispatch({ type: "UPSERT", payload: { block } }),
    []
  );

  return { state, blocks, upsertBlock, removeBlock, updateBlock };
}
```

### 뷰모델 분리

```typescript
// useReactFlowViewModel - 순수한 변환 로직 (컴포넌트 스타일 해석 포함)
export function useReactFlowViewModel(
  blockById: Record<string, Block>,
  positions: BlockPosition[],
  selectedPageId: string | null,
  dbEdges: DbEdge[]
) {
  // 컴포넌트 정의 추출
  const componentDefinitionsById = useMemo(() => {
    const definitions = extractComponentDefinitions(Object.values(blockById));
    return definitions.reduce((acc, def) => {
      acc[def.id] = def;
      return acc;
    }, {} as Record<string, ComponentDefinition>);
  }, [blockById]);

  // 컴포넌트 인스턴스 스타일 해석
  const buildComponentAwareNodeDefinition = useCallback(
    (block: Block): ReactFlowNode => {
      const baseNode = buildNodeDefinition(block, position);

      // 컴포넌트 인스턴스인 경우 스타일 해석 적용
      if (isComponentInstance(block)) {
        const resolvedStyle = resolveNodeStyle(block, componentDefinitionsById);
        return {
          ...baseNode,
          style: {
            ...baseNode.style,
            ...resolvedStyle,
          },
        };
      }

      return baseNode;
    },
    [componentDefinitionsById]
  );

  // 컨텍스트 사용하지 않음
  // 도메인 데이터를 React Flow 형식으로 변환만
  return { nodes: state.nodes, edges: state.edges };
}
```

### 명령 패턴 도입

```typescript
// useCanvasCommands - 복잡한 비즈니스 로직 (컴포넌트 시스템 포함)
export function useCanvasCommands({ workspaceId, blocksById, upsertBlock, ... }) {
  const createNewPage = useCallback(async (): Promise<CreateStatus> => {
    // 1. 낙관적 업데이트
    const optimisticId = generateUUID();
    const newPage: Block = { /* ... */ };
    upsertBlock(newPage);
    setPagePositions(optimisticId, []);
    selectPage(optimisticId);

    // 2. 서버 동기화
    const res = await createBlockAction({ /* ... */ });

    // 3. 재조정 또는 롤백
    if (isFailure(res)) {
      return { ok: false, error: String(res.error) };
    }

    updateBlock(optimisticId, { id: dbBlock.id, /* ... */ });
    selectPage(dbBlock.id as string);
    return { ok: true };
  }, [/* ... */]);

  // 컴포넌트 시스템 명령
  const promoteBlockToComponentDefinition = useCallback(
    async (
      blockId: string,
      componentKey?: string,
      componentName?: string
    ): Promise<CreateStatus> => {
      const sourceBlock = blocksById[blockId];
      if (!sourceBlock) {
        return { ok: false, error: "Block not found" };
      }

      // 1. 컴포넌트 정의 생성
      const definitionTemplate: ComponentDefinition = {
        ...sourceBlock,
        object: "component",
        metadata: {
          ...sourceBlock.metadata,
          role: "definition",
          node_ui: undefined, // 기본 스타일 템플릿 제거
          schema: undefined, // 데이터 필드 정의 제거
          component_key: componentKey || generateComponentKey(),
          component_category: "custom",
          description: `Component based on ${sourceBlock.name}`,
        },
      };

      // 2. 원본 블록을 인스턴스로 변환
      const instanceTemplate: ComponentInstance = {
        ...sourceBlock,
        object: "component",
        metadata: {
          ...sourceBlock.metadata,
          role: "instance",
          component_id: definitionTemplate.id,
          node_ui: undefined, // 기본 스타일 오버라이드 제거
          data: undefined, // 인스턴스별 데이터 제거
        },
      };

      // 3. 낙관적 업데이트
      upsertBlock(definitionTemplate);
      upsertBlock(instanceTemplate);

      // 4. 서버 동기화
      const [defRes, instRes] = await Promise.all([
        createBlockAction(definitionTemplate),
        updateBlockAction(blockId, instanceTemplate),
      ]);

      // 5. 재조정
      if (isSuccess(defRes) && isSuccess(instRes)) {
        return { ok: true };
      }

      return { ok: false, error: "Failed to create component" };
    },
    [blocksById, upsertBlock]
  );

  const resetInstanceStyle = useCallback(
    async (instanceId: string): Promise<UpdateStatus> => {
      const instance = blocksById[instanceId];
      if (!isComponentInstance(instance)) {
        return { ok: false, error: "Not a component instance" };
      }

      // 스타일 오버라이드 제거
      const updatedInstance: ComponentInstance = {
        ...instance,
        metadata: {
          ...instance.metadata,
          node_ui: undefined, // 오버라이드 제거
          data: undefined, // 인스턴스별 데이터 제거
        },
      };

      upsertBlock(updatedInstance);

      const res = await updateBlockAction(instanceId, updatedInstance);
      return isSuccess(res) ? { ok: true } : { ok: false, error: "Failed to reset style" };
    },
    [blocksById, upsertBlock]
  );
}
```

## 🧩 컴포넌트 시스템 구현

### 컴포넌트 타입 정의

```typescript
// component.ts - 컴포넌트 시스템 핵심 타입
export type ComponentDefinition = Block & {
  object: "component";
  metadata: DefaultMetadata & {
    role: "definition";
    node_ui: NodeUI; // 기본 스타일 템플릿
    schema?: UserSchema; // 데이터 필드 정의
    component_key: string; // 고유 컴포넌트 식별자
    component_category?: string; // 카테고리 (선택사항)
    description?: string; // 설명 (선택사항)
  };
};

export type ComponentInstance = Block & {
  object: "component";
  metadata: DefaultMetadata & {
    role: "instance";
    component_id: string; // 정의 블록 ID 참조
    node_ui?: Partial<NodeUI>; // 스타일 오버라이드 (선택사항)
    data?: Record<string, unknown>; // 인스턴스별 데이터
  };
};

// 스타일 해석 유틸리티
export function resolveNodeStyle(
  block: Block,
  definitionsById: Record<string, ComponentDefinition>
): NodeUI {
  // 컴포넌트 인스턴스: 정의 스타일 + 오버라이드
  if (isComponentInstance(block)) {
    const definition = definitionsById[block.metadata.component_id];
    const baseStyle = definition?.metadata?.node_ui ?? DEFAULT_NODE_UI;
    const overrideStyle = block.metadata?.node_ui;

    return overrideStyle
      ? { ...baseStyle, ...overrideStyle, __overridden: true }
      : baseStyle;
  }

  // 컴포넌트 정의: 자체 스타일
  if (isComponentDefinition(block)) {
    return block.metadata?.node_ui ?? DEFAULT_NODE_UI;
  }

  // 일반 블록: 메타데이터 스타일
  return block.metadata?.node_ui ?? DEFAULT_NODE_UI;
}
```

### 컴포넌트 정책

```typescript
// component-policy.ts - 컴포넌트 시스템 정책
export class ComponentCreationPolicy {
  static validateDefinition(definition: ComponentDefinition): ValidationResult {
    // 컴포넌트 정의 유효성 검사
    if (!definition.metadata.component_key) {
      return { valid: false, error: "Component key is required" };
    }
    return { valid: true };
  }

  static validateInstance(instance: ComponentInstance): ValidationResult {
    // 컴포넌트 인스턴스 유효성 검사
    if (!instance.metadata.component_id) {
      return { valid: false, error: "Component ID is required" };
    }
    return { valid: true };
  }
}

export class ComponentStylePolicy {
  static allowsStyleOverrides(instance: ComponentInstance): boolean {
    // 스타일 오버라이드 허용 여부
    return true; // 모든 인스턴스에서 오버라이드 허용
  }

  static getAllowedStyleOverrideFields(): (keyof NodeUI)[] {
    // 오버라이드 가능한 스타일 필드
    return ["color", "shape", "size", "fontSize", "weight"];
  }
}
```

### 컴포넌트 서버 액션

```typescript
// component.action.ts - 컴포넌트 CRUD 서버 액션
export async function createComponentDefinitionAction(
  definition: ComponentDefinition
): Promise<ActionResult<Block>> {
  // 컴포넌트 정의 생성
  const validation = ComponentCreationPolicy.validateDefinition(definition);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const result = await createBlockAction(definition);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateComponentInstanceAction(
  instanceId: string,
  updates: Partial<ComponentInstance>
): Promise<ActionResult<Block>> {
  // 컴포넌트 인스턴스 업데이트
  const validation = ComponentCreationPolicy.validateInstance(
    updates as ComponentInstance
  );
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const result = await updateBlockAction(instanceId, updates);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### 컴포넌트 UI 컴포넌트

```typescript
// editor-panel.tsx - 컴포넌트 인스턴스 편집 UI
export function EditorPanel({ blockId }: { blockId: string }) {
  const { blocksById, getComponentDefinitionById } = useCanvasData();
  const block = blocksById[blockId];

  const componentInfo = useMemo(() => {
    if (isComponentInstance(block)) {
      const definition = getComponentDefinitionById(
        block.metadata.component_id
      );
      return {
        isInstance: true,
        definition,
        hasStyleOverrides: !!(
          block.metadata.node_ui &&
          Object.keys(block.metadata.node_ui).length > 0
        ),
      };
    }
    return { isInstance: false };
  }, [block, getComponentDefinitionById]);

  return (
    <div>
      {componentInfo.isInstance && (
        <>
          <div className="component-badge">Component Instance</div>
          {componentInfo.hasStyleOverrides && (
            <div className="custom-style-badge">Custom Style</div>
          )}
          <div className="based-on">
            Based on: {componentInfo.definition?.name}
          </div>
          <div className="component-actions">
            <button onClick={() => openComponentDefinitionEditor(blockId)}>
              Edit Definition
            </button>
            <button onClick={() => resetInstanceStyle(blockId)}>
              Reset to Definition Style
            </button>
          </div>
        </>
      )}
      {/* 일반 편집 필드들 */}
    </div>
  );
}
```

## ✅ 달성된 개선사항

### 1. **테스트 용이성**

- 각 저장소를 독립적으로 테스트 가능
- 뷰모델은 순수 함수로 단위 테스트 가능
- 명령은 모킹 없이 테스트 가능
- 컴포넌트 시스템 정책은 순수 함수로 테스트 가능
- **SSOT 정책은 순수 함수로 테스트 가능**

### 2. **유지보수성**

- 한 부분 수정이 다른 부분에 영향 주지 않음
- 명확한 책임 분리로 버그 추적 용이
- 코드 리뷰 시 변경 범위 명확
- 컴포넌트 시스템이 기존 아키텍처와 완전히 통합
- **SSOT를 통한 색상/도형 정의 중앙화로 일관성 보장**

### 3. **확장성**

- 새로운 블록 타입 추가 시 정책만 수정
- 새로운 UI 컴포넌트 추가 시 어댑터만 수정
- 새로운 명령 추가 시 명령 계층만 수정
- 컴포넌트 시스템이 기존 블록 시스템과 완전히 호환
- **새로운 색상/도형 추가 시 ShapePolicy만 수정**
- **새로운 뷰 타입 추가 시 ViewPolicy만 수정**

### 4. **재사용성**

- 도메인 로직을 다른 UI에서도 사용 가능
- 정책을 다른 프로젝트에서도 재사용 가능
- 저장소를 다른 컨텍스트에서도 사용 가능
- 컴포넌트 시스템이 독립적인 모듈로 분리
- **ShapePolicy를 다른 프로젝트에서 색상/도형 시스템으로 재사용 가능**
- **ViewPolicy를 다른 프로젝트에서 뷰 관리 시스템으로 재사용 가능**

### 5. **디버깅**

- 문제 발생 시 어느 계층에서 발생했는지 명확
- 상태 변화 추적 용이
- 명령 실행 흐름 명확
- 컴포넌트 시스템 디버깅 도구 제공
- **SSOT를 통한 색상/도형 문제 추적 용이**
- **뷰 설정 문제 추적 용이**

## 📈 성능 개선

### 1. **불필요한 리렌더링 감소**

- 컨텍스트 분리로 필요한 컴포넌트만 리렌더링
- 선택 상태 변경 시 UI 레이아웃 컴포넌트 리렌더링 방지
- 컴포넌트 스타일 해석이 메모이제이션으로 최적화

### 2. **메모리 사용량 최적화**

- LRU 캐시로 페이지별 위치 데이터 효율적 관리
- 불필요한 객체 생성 방지
- 컴포넌트 정의/인스턴스 매핑이 메모이제이션으로 최적화

### 3. **번들 크기 최적화**

- 필요한 기능만 import 가능
- 트리 쉐이킹으로 사용하지 않는 코드 제거
- 컴포넌트 시스템이 선택적 로딩 가능

## 🧩 컴포넌트 시스템 성과

### 1. **사용자 경험 향상**

- 기존 블록을 컴포넌트로 쉽게 변환
- 컴포넌트 인스턴스의 스타일 오버라이드 지원
- 컴포넌트 정의와 인스턴스 간 명확한 관계
- 직관적인 컴포넌트 편집 인터페이스

### 2. **개발자 경험 향상**

- 컴포넌트 시스템 디버깅 도구 제공
- 타입 안전한 컴포넌트 조작
- 명확한 컴포넌트 라이프사이클 관리
- 기존 아키텍처와 완전한 통합

### 3. **확장성 확보**

- 새로운 컴포넌트 타입 쉽게 추가 가능
- 컴포넌트 간 상속 및 조합 지원
- 컴포넌트 버전 관리 준비
- 실시간 협업을 위한 컴포넌트 동기화 기반

## 🚀 다음 단계 (향후 개선사항)

### 1. **이벤트 시스템 도입**

```typescript
// Domain Events
type BlockCreated = { type: "BlockCreated"; payload: { block: Block } };
type BlockMoved = {
  type: "BlockMoved";
  payload: { blockId: string; position: Position };
};
type ComponentDefinitionCreated = {
  type: "ComponentDefinitionCreated";
  payload: { definition: ComponentDefinition };
};
type ComponentInstanceCreated = {
  type: "ComponentInstanceCreated";
  payload: { instance: ComponentInstance; definitionId: string };
};
```

### 2. **Undo/Redo 시스템**

```typescript
// Command Stack
type Command = { execute: () => void; undo: () => void };
type ComponentCommand = {
  execute: () => void;
  undo: () => void;
  type: "promoteToComponent" | "createInstance" | "resetStyle";
};
```

### 3. **실시간 협업**

```typescript
// Operational Transform
type Operation = { type: "insert" | "delete"; position: number; data?: any };
type ComponentOperation = {
  type: "createDefinition" | "createInstance" | "updateStyle";
  componentId: string;
  data: any;
};
```

### 4. **오프라인 지원**

```typescript
// Offline Queue
type PendingOperation = { command: Command; timestamp: number };
type PendingComponentOperation = {
  command: ComponentCommand;
  timestamp: number;
  requiresSync: boolean;
};
```

### 5. **컴포넌트 시스템 고도화**

```typescript
// 컴포넌트 버전 관리
type ComponentVersion = {
  version: string;
  definition: ComponentDefinition;
  createdAt: Date;
  changes: string[];
};

// 컴포넌트 템플릿 시스템
type ComponentTemplate = {
  id: string;
  name: string;
  category: string;
  definition: ComponentDefinition;
  preview: string;
  tags: string[];
};

// 컴포넌트 라이브러리
type ComponentLibrary = {
  id: string;
  name: string;
  templates: ComponentTemplate[];
  shared: boolean;
};
```

## 📝 결론

캔버스 도메인 리팩토링과 컴포넌트 시스템 구현을 통해 **깔끔하고 유지보수 가능한 아키텍처**를 구축했습니다.

**주요 성과:**

- ✅ 책임 분리로 코드 가독성 향상
- ✅ 테스트 용이성 대폭 개선
- ✅ 확장성과 재사용성 확보
- ✅ 성능 최적화 달성
- ✅ 개발자 경험 향상
- ✅ **컴포넌트 시스템 완전 구현**
- ✅ **기존 아키텍처와 완벽한 통합**
- ✅ **사용자 친화적인 컴포넌트 인터페이스**
- ✅ **SSOT를 통한 색상/도형 정의 중앙화**
- ✅ **뷰 타입 및 설정 정책 체계화**
- ✅ **일관된 UI/UX 경험 제공**

이제 캔버스 기능을 안정적으로 확장하고 유지보수할 수 있는 견고한 기반이 마련되었으며, 컴포넌트 시스템을 통해 더욱 강력하고 유연한 캔버스 경험을 제공할 수 있습니다! 🎉
