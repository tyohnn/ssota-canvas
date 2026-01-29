# Canvas Management - Undo/Redo 아키텍처 문서

## 📁 전체 폴더 구조

```
frontend/
├── acl/                          # Anti-Corruption Layer (React Flow 타입 격리)
├── components/                   # UI 컴포넌트
│   ├── block/                   # 블록 관련 컴포넌트
│   ├── clipboard/               # 클립보드 기능
│   ├── editor-panel-wrapper/    # 에디터 패널
│   ├── react-flow-wrapper/      # React Flow 래퍼 (핵심 컴포넌트)
│   │   ├── components/         # View 컴포넌트들
│   │   └── core/               # 비즈니스 로직 훅
│   │       ├── use-react-flow-wrapper.ts          # 🎯 메인 통합 훅
│   │       ├── use-react-flow-wrapper.ui.ts       # UI 상태 관리
│   │       └── use-react-flow-wrapper.business.ts # 비즈니스 로직
│   └── canvas-base.tsx          # 🎯 최상위 Provider 주입
│
├── config/                       # 설정 파일
├── contexts/                     # React Context들
│   ├── canvas-metadata-context.tsx
│   ├── canvas-readonly-context.tsx
│   └── block-interaction-context.tsx
│
├── hooks/                        # 도메인 훅들
│   ├── block/                   # 블록 생명주기 훅
│   ├── edge/                    # 엣지 생명주기 훅
│   ├── group/                   # 그룹 관리 훅
│   ├── control/                 # 제어 관련 훅
│   ├── mode/                    # 캔버스 모드 관리
│   ├── react-flow-sync/         # React Flow 동기화
│   ├── use-canvas-block-lifecycle.ts    # 블록 Facade
│   ├── use-canvas-edge-lifecycle.ts     # 엣지 Facade
│   ├── use-canvas-transform.ts          # 변형 Facade
│   ├── use-canvas-selection.ts          # 선택 관리
│   └── use-canvas-viewport.ts           # 뷰포트 관리
│
├── snapshot/                     # 🎯 Undo/Redo 도메인 (신규)
│   ├── canvas-snapshot-context.tsx      # Provider & Hook
│   ├── canvas-snapshot.reducer.ts       # 상태 관리 로직
│   ├── types.ts                         # 타입 정의
│   └── index.ts                         # Public API
│
├── types/                        # 타입 정의
└── utils/                        # 유틸리티 함수
```

---

## 🎯 Undo/Redo 아키텍처 개요

### 핵심 설계 원칙
1. **Context 기반 중앙 관리**: `CanvasSnapshotProvider`가 모든 스냅샷 상태를 관리
2. **React Flow를 SSOT로 사용**: 스냅샷은 React Flow의 nodes/edges를 직접 저장/복원
3. **삭제 전 스냅샷 저장**: 기본 동작을 비활성화하고 전역 리스너에서 제어
4. **Facade 패턴**: 각 도메인 훅이 복잡성을 숨기고 단순한 API 제공

---

## 🏗️ 현재 구현 방식

### 1. Snapshot 도메인 (`frontend/snapshot/`)

#### **canvas-snapshot-context.tsx**
```typescript
// Provider: ReactFlowProvider 내부에 배치 (useReactFlow 사용)
export function CanvasSnapshotProvider({ children }) {
  const [state, dispatch] = useReducer(canvasSnapshotReducer, initialState);
  const reactFlowInstance = useReactFlow();

  const takeSnapshot = useCallback(() => {
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();
    dispatch({ type: 'TAKE_SNAPSHOT', payload: { nodes, edges } });
  }, [reactFlowInstance]);

  const undo = useCallback(() => {
    // past에서 꺼내서 복원
    const previousSnapshot = state.past[state.past.length - 1];
    reactFlowInstance.setNodes(previousSnapshot.nodes);
    reactFlowInstance.setEdges(previousSnapshot.edges);
    dispatch({ type: 'UNDO', ... });
  }, [reactFlowInstance, state.past]);

  const redo = useCallback(() => {
    // future에서 꺼내서 복원
    const nextSnapshot = state.future[0];
    reactFlowInstance.setNodes(nextSnapshot.nodes);
    reactFlowInstance.setEdges(nextSnapshot.edges);
    dispatch({ type: 'REDO', ... });
  }, [reactFlowInstance, state.future]);

  return (
    <CanvasSnapshotContext.Provider value={{ takeSnapshot, undo, redo, canUndo, canRedo }}>
      {children}
    </CanvasSnapshotContext.Provider>
  );
}

// Hook: 어디서든 스냅샷 API 사용 가능
export function useCanvasSnapshot() {
  const context = useContext(CanvasSnapshotContext);
  if (!context) throw new Error('Provider 필요');
  return context;
}
```

#### **canvas-snapshot.reducer.ts**
```typescript
export function canvasSnapshotReducer(state, action) {
  switch (action.type) {
    case 'TAKE_SNAPSHOT':
      return {
        ...state,
        past: [...state.past, newSnapshot],
        future: [], // 새 액션 시 future 초기화
      };
    
    case 'UNDO':
      return {
        ...state,
        past: newPast,
        future: [currentSnapshot, ...state.future],
      };
    
    case 'REDO':
      return {
        ...state,
        past: [...state.past, currentSnapshot],
        future: newFuture,
      };
  }
}
```

#### **types.ts**
```typescript
export interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export interface CanvasSnapshotState {
  past: CanvasSnapshot[];
  future: CanvasSnapshot[];
  maxHistorySize: number;
}

export interface CanvasSnapshotContextType {
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

---

### 2. Provider 주입 (`components/canvas-base.tsx`)

```typescript
export function CanvasBase({ ... }) {
  return (
    <ReactFlowProvider>
      {/* ✅ ReactFlowProvider 바로 아래에 배치 (useReactFlow 사용 가능) */}
      <CanvasSnapshotProvider>
        <CanvasModeProvider>
          <BlockInteractionProvider>
            <CanvasMetadataProvider>
              <CanvasReadOnlyProvider>
                <CanvasReactFlowWrapper ... />
                <EditorPanelWrapper />
              </CanvasReadOnlyProvider>
            </CanvasMetadataProvider>
          </BlockInteractionProvider>
        </CanvasModeProvider>
      </CanvasSnapshotProvider>
    </ReactFlowProvider>
  );
}
```

**중요**: `CanvasSnapshotProvider`는 `ReactFlowProvider` 내부에 있어야 `useReactFlow()` 사용 가능

---

### 3. 스냅샷 호출 지점 (자동화 완료)

과거에는 `useReactFlowWrapper`에서 일일이 래핑하여 호출했으나, 현재는 **각 도메인 훅(Lifecycle Hooks) 내부**에서 자동으로 `snapshot.takeSnapshot()`을 호출하도록 아키텍처가 개선되었습니다.

#### **전역 키보드 리스너 (사용자 인터렉션)**
`use-react-flow-wrapper.ts`에서 삭제 키 및 단축키를 처리합니다.

```typescript
useEffect(() => {
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    // Input/Textarea에서는 무시
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    if (readonly) return;

    const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // ✅ Undo (Cmd+Z)
    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      snapshot.undo();
      return;
    }

    // ✅ Redo (Cmd+Shift+Z)
    if (isCtrlOrCmd && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      snapshot.redo();
      return;
    }

    // ✅ Delete/Backspace (핵심 해결책)
    // React Flow의 기본 삭제를 비활성화하고 여기서 직접 처리
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodes = reactFlowInstance.getNodes().filter(n => n.selected);
      const selectedEdges = reactFlowInstance.getEdges().filter(e => e.selected);
      
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        event.preventDefault();
        
        // 1️⃣ 삭제 전 스냅샷 저장 (Undo를 위해)
        snapshot.takeSnapshot();
        
        // 2️⃣ React Flow UI에서 삭제
        reactFlowInstance.deleteElements({
          nodes: selectedNodes,
          edges: selectedEdges,
        });
        
        // 3️⃣ 서버에도 삭제 요청
        if (selectedNodes.length > 0) {
          blockLifecycle.softDeleteBlockMounts(selectedNodes.map(n => n.id));
        }
        if (selectedEdges.length > 0) {
          selectedEdges.forEach(edge => {
            edgeLifecycle.deleteEdge({ edgeId: edge.id });
          });
        }
      }
      return;
    }

    // Cmd+V: 붙여넣기
    if (isCtrlOrCmd && event.key === 'v') {
      event.preventDefault();
      businessLogic.handlePaste();
    }

    // Cmd+D: 복제
    if (isCtrlOrCmd && event.key === 'd') {
      event.preventDefault();
      businessLogic.handleDuplicate();
    }
  };

  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [readonly, snapshot, reactFlowInstance, blockLifecycle, edgeLifecycle, ...]);
```

#### **각 도메인 훅 내부 자동 호출 (Decorator 패턴 적용)**

비즈니스 로직을 제공하는 Facade 훅 내부에서 변경 직전에 스냅샷을 찍습니다. 이를 통해 UI 컴포넌트나 Wrapper에서는 스냅샷에 신경 쓰지 않고 비즈니스 로직만 호출하면 됩니다.

```typescript
// hooks/use-canvas-block-lifecycle.ts
export function useCanvasBlockLifecycle(...) {
  const snapshot = useCanvasSnapshot();

  const createAndMountBlock = useCallback(async (...) => {
    snapshot.takeSnapshot(); // ✅ 호출부에서 신경 쓸 필요 없이 내부에서 수행
    return await createBlock(...);
  }, [snapshot, ...]);

  const softDeleteBlockMounts = useCallback(async (...) => {
    snapshot.takeSnapshot(); // ✅ 삭제 전 자동 저장
    await softDeleteBlock(...);
  }, [snapshot, ...]);
  
  // ... duplicate 등 다른 메서드들도 동일
}

// hooks/use-canvas-edge-lifecycle.ts
export function useCanvasEdgeLifecycle(...) {
  const snapshot = useCanvasSnapshot();

  return {
    createEdge: (input) => {
      snapshot.takeSnapshot(); // ✅ 연결 전 자동 저장
      return createEdge(input);
    },
    // ... updateEdgeShape, deleteEdge 등 동일
  };
}
```

---

### 4. React Flow 설정 변경 (`components/index.tsx`)

```typescript
<ReactFlow
  // ⚠️ 기본 삭제 키 비활성화 (전역 리스너에서 처리)
  deleteKeyCode={null}  // 이전: ['Delete', 'Backspace']
  
  // 나머지 설정...
  onNodesDelete={onNodesDelete}  // 사용되지 않음 (전역 리스너가 대신 처리)
  onEdgesDelete={onEdgesDelete}  // 사용되지 않음
/>
```

---

## 📊 스냅샷 호출 매트릭스

| 동작 | 스냅샷 시점 | 호출 위치 | 방식 |
|------|-------------|-----------|------|
| **블록 생성** | 생성 직전 | `useCanvasBlockLifecycle` | 훅 내부 자동 |
| **블록 이동** | 드래그 시작 시 | `useReactFlowWrapper` (`onNodeDragStart`) | 수동 호출 |
| **블록 삭제** | 삭제 직전 | 전역 키보드 리스너 | 수동 호출 |
| **선 연결** | 연결 직전 | `useCanvasEdgeLifecycle` | 훅 내부 자동 |
| **선 수정/삭제** | 수정 직전 | `useCanvasEdgeLifecycle` | 훅 내부 자동 |
| **붙여넣기** | 실행 직전 | `useCanvasBlockLifecycle` | 훅 내부 자동 |
| **복제** | 실행 직전 | `useCanvasBlockLifecycle` | 훅 내부 자동 |
| **리사이즈** | 실행 직전 | `useCanvasTransform` | 훅 내부 자동 |
| **정렬/배치** | 실행 직전 | `useCanvasTransform` | 훅 내부 자동 |
| **Undo/Redo** | - | 전역 키보드 리스너 | `snapshot.undo/redo()` |

---

## 🔥 핵심 해결 과제: 삭제 동작 재설계

### 문제점
React Flow의 기본 `deleteKeyCode` 동작은 **삭제가 완료된 후** `onNodesDelete` 이벤트를 발생시킴
→ "삭제 전" 상태를 저장하기 어려움
→ Undo 시 삭제된 상태로 되돌아감 ❌

### 해결책
1. **React Flow의 기본 삭제 키 비활성화**: `deleteKeyCode={null}`
2. **전역 키보드 리스너에서 가로채기**: `window.addEventListener('keydown', ...)`
3. **올바른 순서로 실행**:
   ```
   User 삭제 키 입력
   → takeSnapshot() (삭제 전 상태 저장)
   → reactFlow.deleteElements() (UI 삭제)
   → 서버 동기화 (softDeleteBlockMounts, deleteEdge)
   ```

### 결과
✅ Undo(Cmd+Z) 시 삭제 전 상태로 완벽하게 복원
✅ Redo(Cmd+Shift+Z) 시 삭제 후 상태로 다시 이동

---

## 🚀 더 나은 아키텍처 제안

### 현재 구조의 장단점

#### ✅ 장점
1. **중앙 집중식 관리**: `useReactFlowWrapper`가 모든 스냅샷 호출을 제어
2. **명확한 책임 분리**: Snapshot 도메인이 독립적으로 분리됨
3. **React Flow SSOT**: 상태 복원이 단순하고 신뢰성 높음
4. **전역 키보드 리스너**: 포커스 문제 없이 안정적으로 작동

#### ⚠️ 단점
1. **래퍼 함수 중복**: 각 동작마다 `...WithSnapshot` 래퍼 필요
2. **useReactFlowWrapper 비대화**: 800줄 가까운 거대한 훅
3. **도메인 훅의 독립성 부족**: 스냅샷 로직이 외부에 의존

---

### 개선 방향 1: **Partial Undo / Selective History**

현재는 캔버스 전체 상태를 스냅샷으로 찍지만, 협업 환경이나 대규모 작업에서는 특정 노드/변경 세트만 되돌리는 기능이 필요할 수 있습니다.

---

### 개선 방향 2: **Middleware 패턴**

스냅샷을 자동으로 주입하는 고차 함수(HOF) 사용

```typescript
// snapshot/with-snapshot.ts
export function withSnapshot<T extends (...args: any[]) => any>(
  fn: T,
  snapshot: CanvasSnapshotContextType
): T {
  return ((...args: Parameters<T>) => {
    snapshot.takeSnapshot();
    return fn(...args);
  }) as T;
}

// use-react-flow-wrapper.ts
const snapshot = useCanvasSnapshot();

// ✅ 래퍼 함수 대신 고차 함수 사용
const createAndMountBlock = withSnapshot(
  blockLifecycle.createAndMountBlock,
  snapshot
);

const duplicateBlock = withSnapshot(
  blockLifecycle.duplicateBlockAndMount,
  snapshot
);
```

**장점**:
- 도메인 훅 수정 불필요
- 선언적이고 간결함
- 스냅샷 로직이 한 곳에 집중

**단점**:
- 타입 추론이 복잡해질 수 있음
- 비동기 함수 처리 주의 필요

---

### 개선 방향 3: **Command 패턴 (고급)**

모든 mutation을 Command 객체로 캡슐화

```typescript
// snapshot/command.ts
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}

class CreateBlockCommand implements Command {
  constructor(
    private blockType: BlockType,
    private position: Position,
    private reactFlow: ReactFlowInstance,
    private pageId: string
  ) {}

  async execute() {
    // 실행 전 자동으로 스냅샷 저장
    const snapshot = this.captureSnapshot();
    
    // 블록 생성 로직
    const result = await createBlockAction({ ... });
    
    // 히스토리에 저장
    this.history.push({ snapshot, command: this });
  }

  async undo() {
    // 이전 스냅샷으로 복원
  }

  async redo() {
    // 다음 스냅샷으로 복원
  }
}

// 사용
const command = new CreateBlockCommand(blockType, position, reactFlow, pageId);
await commandExecutor.execute(command);
```

**장점**:
- 완벽한 Undo/Redo 구현
- 각 명령의 실행/취소 로직이 명확
- Macro Command (여러 명령 묶기) 가능

**단점**:
- 구현 복잡도 매우 높음
- 기존 코드 대규모 리팩토링 필요
- 오버엔지니어링 위험

---

## 🎯 최종 권장 사항

### 현재 상태 유지 (단기)
- 현재 구조는 **안정적이고 동작함**
- 추가 개선 없이도 모든 Undo/Redo 요구사항 충족
- 성능 문제나 유지보수 이슈가 없다면 **그대로 사용 권장**

### Decorator 패턴 적용 (중기)
- 코드베이스가 성숙하고 안정화되면 고려
- 각 도메인 훅에 `useCanvasSnapshot()` 주입
- `useReactFlowWrapper` 다이어트 (현재 790줄 → 500줄 목표)

### Command 패턴 (장기)
- 복잡한 Undo/Redo 요구사항이 추가될 때만 고려
  - 예: Partial Undo (특정 블록만 되돌리기)
  - 예: Undo History UI (변경 이력 시각화)
  - 예: Collaborative Undo (멀티플레이어 환경)

---

## 📝 체크리스트

### ✅ 구현 완료
- [x] Snapshot 도메인 분리 (`frontend/snapshot/`)
- [x] Context 기반 중앙 관리 (`CanvasSnapshotProvider`)
- [x] React Flow 기본 삭제 키 비활성화
- [x] 전역 키보드 리스너에서 삭제 처리
- [x] 모든 mutation에 스냅샷 연동
- [x] Undo/Redo 단축키 (Cmd+Z, Cmd+Shift+Z)

### 🔄 개선 고려 사항
- [x] 도메인 훅 내부에 스냅샷 자동화 (Decorator 패턴 적용 완료)
- [ ] 스냅샷 압축 (Diff 방식 도입으로 메모리 최적화)
- [ ] Undo/Redo 전용 툴바 버튼 및 히스토리 리스트 UI
- [ ] 특정 동작(단순 드래그 중인 미세 이동 등) 필터링 로직 추가

---

## 🐛 알려진 제한사항

1. **그룹 내부 노드 이동**: 그룹 collision 처리 후 Undo 시 상대 위치가 틀어질 수 있음
2. **비동기 mutation**: 서버 응답 전 Undo 시 race condition 가능
3. **메모리 사용량**: 대용량 캔버스(1000+ 노드)에서 스냅샷 크기 증가

---

## 📚 참고 자료

- [React Flow 공식 문서](https://reactflow.dev/)
- [Command Pattern (GoF)](https://refactoring.guru/design-patterns/command)
- [Undo/Redo in React](https://redux.js.org/usage/implementing-undo-history)
