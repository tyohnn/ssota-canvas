# Frontend Specification: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-19  
**버전**: v1.1

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: 프론트엔드 구현

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Canvas Management Domain의 프론트엔드는 **React Flow 기반의 무한 캔버스**를 중심으로 블럭 조작, 엣지 관리, 뷰포트 제어를 제공합니다. 핵심은 **React Flow State (단기 SoT)**와 **Database (장기 SoT)**의 이중 상태 관리 전략을 통한 실시간 UX와 데이터 일관성을 보장하는 것입니다.

**주요 구현 전략**:
- **React Flow + shadcn/ui Integration**: [React Flow Components](https://reactflow.dev/learn/tutorials/getting-started-with-react-flow-components) 기반 캔버스 구현
- **Building Blocks**: `BaseNode`, `LabeledHandle`, `DataEdge` 등 shadcn/ui React Flow Components 활용
- **Optimistic Updates**: `useOptimistic`으로 즉시 UI 반응성 제공
- **Context-based State**: 캔버스 상태, 선택된 블럭, 뷰포트 정보 중앙 관리
- **React Flow Hooks**: `useReactFlow()`, `useStore()`, `useNodesData()` 등 공식 Hooks 활용
- **ACL Pattern**: React Flow와 도메인 로직 간의 안전한 분리

### User Flow 연결점

- **입력**: `03-user-flow.md` - 9개 주요 시나리오, 20+ 화면 정의
- **입력**: `03-software-design.md` - 4개 핵심 Aggregate (Canvas, BlockMount, Edge, Viewport)
- **출력**: React Context, Hooks, Components, React Flow 통합

### 핵심 설계 원칙

- **타입 재사용**: Software Design의 Aggregate를 DTO로 직렬화하여 React에서 활용
- **도메인 분리**: Canvas Management 전용 Context/Hook 구조로 독립성 보장
- **Result 패턴**: 함수형 에러 처리로 Server Actions 안정성 확보
- **낙관적 업데이트**: 블럭 조작 시 즉시 UI 반응성 제공, 실패 시 롤백
- **의존성 주입**: Server Actions에서 Service Layer 활용하여 비즈니스 로직 분리
- **React Flow ACL**: 외부 라이브러리와 도메인 로직 간 안전한 경계 유지

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. DTO 인터페이스

#### CanvasView DTO

- **파일 위치**: `src/domains/canvas-management/shared/dtos/index.ts`
- **역할**: Canvas Aggregate의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - canvasId: string (CanvasId → string 직렬화)
  - pageId: string (PageId → string 직렬화)
  - reactFlowInstanceId: string | null
  - isInitialized: boolean
  - blockCount: number
  - edgeCount: number
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
- **직렬화 규칙**:
  - Value Object (CanvasId, PageId) → string 변환
  - Date → ISO 8601 string 변환
  - Plain Object만 사용 (클래스, 함수 금지)
- **특징**: Next.js Server Actions의 직렬화 제약을 준수

**사용 위치**:
- 캔버스 초기화 화면: 캔버스 상태 표시
- 로딩 화면: 로딩된 블럭/엣지 수 표시

---

#### BlockMountView DTO

- **파일 위치**: `src/domains/canvas-management/shared/dtos/index.ts`
- **역할**: BlockMount Aggregate의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - blockMountId: string (BlockMountId → string 직렬화)
  - pageId: string (PageId → string 직렬화)
  - blockId: string (BlockId → string 직렬화)
  - position: { x: number, y: number } (Position VO → plain object)
  - size: { width: number, height: number } (Size VO → plain object)
  - zOrder: number (ZOrder VO → number 직렬화)
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
- **직렬화 규칙**:
  - Value Object들을 plain object나 primitive로 변환
  - React Flow에서 사용할 수 있는 형태로 구조화
- **특징**: React Flow Node 데이터 구조와 호환

**사용 위치**:
- 캔버스 렌더링: 블럭 위치와 크기 정보
- 블럭 선택: 선택된 블럭 정보 표시
- 드래그/리사이즈: 실시간 위치 업데이트

---

#### EdgeView DTO

- **파일 위치**: `src/domains/canvas-management/shared/dtos/index.ts`
- **역할**: Edge Aggregate의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - edgeId: string (EdgeId → string 직렬화)
  - pageId: string (PageId → string 직렬화)
  - sourceBlockId: string (BlockId → string 직렬화)
  - targetBlockId: string (BlockId → string 직렬화)
  - edgeType: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier' (React Flow 기본 타입)
  - label?: string
  - style?: {
    color: string
    width: number
    arrowHeadType?: string
  }
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
- **직렬화 규칙**:
  - React Flow 기본 엣지 타입을 string literal로 사용
  - React Flow Edge 데이터 구조와 직접 호환
- **특징**: React Flow Edge 설정과 직접 매핑, type 속성 미지정 시 'default' 사용

**React Flow 기본 엣지 타입**:
- `'default'`: 베지어 곡선 엣지 (기본값)
- `'straight'`: 직선 엣지
- `'step'`: 스텝 엣지
- `'smoothstep'`: 부드러운 스텝 엣지
- `'simplebezier'`: 단순 베지어 곡선 엣지

**사용 위치**:
- 캔버스 렌더링: 엣지 연결선 표시
- 엣지 편집 다이얼로그: 엣지 속성 표시

---

#### ViewportView DTO

- **파일 위치**: `src/domains/canvas-management/shared/dtos/index.ts`
- **역할**: Viewport Aggregate의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - viewportId: string (ViewportId → string 직렬화)
  - pageId: string (PageId → string 직렬화)
  - userId: string (UserId → string 직렬화)
  - zoomLevel: number (ZoomLevel → number 직렬화)
  - center: { x: number, y: number } (ViewportCenter → plain object)
  - minZoom: number
  - maxZoom: number
  - lastSavedAt: string (Date → ISO 8601 string)
- **직렬화 규칙**:
  - 사용자별 뷰포트 설정을 직렬화
  - React Flow Viewport 설정과 호환
- **특징**: 사용자별 캔버스 뷰 상태 복원

**사용 위치**:
- 캔버스 초기화: 사용자별 뷰포트 복원
- 뷰포트 제어: 줌/패닝 상태 저장

---

#### Request DTOs

- **파일 위치**: `src/domains/canvas-management/shared/dtos/index.ts`
- **역할**: Server Actions에 전달되는 입력 데이터 구조 정의
- **InitializeCanvasRequest**:
  - pageId: string (필수)
- **MountBlockRequest**:
  - pageId: string (필수)
  - blockId: string (필수)
  - position: { x: number, y: number } (필수)
  - size: { width: number, height: number } (필수)
- **TransformBlockRequest**:
  - blockMountId: string (필수)
  - newPosition?: { x: number, y: number }
  - newSize?: { width: number, height: number }
  - newZOrder?: number
- **CreateEdgeRequest**:
  - pageId: string (필수)
  - sourceBlockId: string (필수)
  - targetBlockId: string (필수)
  - edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier' (기본값: 'default')
- **UpdateViewportRequest**:
  - pageId: string (필수)
  - zoomLevel: number
  - center: { x: number, y: number }
- **특징**: 폼 입력 데이터를 Server Actions에 전달하기 위한 타입

**사용 위치**:
- 블럭 생성 폼: MountBlockRequest
- 블럭 편집: TransformBlockRequest
- 엣지 생성: CreateEdgeRequest
- 뷰포트 업데이트: UpdateViewportRequest

---

### 2. Result 패턴

- **파일 위치**: `src/domains/canvas-management/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴
- **주요 속성**:
  - success: boolean (성공 여부)
  - data?: T (성공 시 데이터)
  - error?: E (실패 시 에러)
- **주요 메서드**:
  - isSuccess(): 성공 여부 확인
  - isError(): 실패 여부 확인
- **특징**: try-catch 대신 함수형 에러 처리 패턴 사용

**Canvas Management 전용 타입들**:
```typescript
import type { Node, Edge, NodeTypes, EdgeTypes } from '@xyflow/react'

// Canvas Management 전용 Result 타입들
type CanvasResult<T> = Result<T, CanvasManagementError>
type MountBlockResult = CanvasResult<BlockMountView>
type TransformBlockResult = CanvasResult<BlockMountView>
type CreateEdgeResult = CanvasResult<EdgeView>
type ViewportResult = CanvasResult<ViewportView>

// React Flow Node 타입 정의 (Custom Node Types)
type BlockMountNode = Node<BlockMountView, 'blockMount'>

// AppNode: 모든 커스텀 노드와 Built-in 노드의 Union Type
type AppNode = BlockMountNode

// React Flow Edge 타입 정의 (Custom Edge Types)
type BlockEdge = Edge<EdgeView, 'blockEdge'>

// AppEdge: 모든 커스텀 엣지와 Built-in 엣지의 Union Type
type AppEdge = BlockEdge

// React Flow에 전달할 NodeTypes 및 EdgeTypes
const nodeTypes: NodeTypes = {
  blockMount: BlockMountNode,
}

const edgeTypes: EdgeTypes = {
  blockEdge: BlockEdgeComponent,
}
```

**React Flow 타입 가이드**:
- `Node<Data, Type>`: 커스텀 노드 타입 정의 시 사용
- `Edge<Data, Type>`: 커스텀 엣지 타입 정의 시 사용
- `AppNode` / `AppEdge`: 모든 노드/엣지 타입의 Union Type으로 Hook과 Callback에 전달
- Built-in 타입: `'default'`, `'input'`, `'output'` 노드, `'default'`, `'straight'`, `'step'`, `'smoothstep'`, `'simplebezier'` 엣지

**사용 예시**:
- Server Actions의 반환값으로 사용: `CanvasResult<BlockMountView>`
- 에러를 명시적으로 처리하여 타입 안전성 확보
- 성공/실패 시나리오를 명확히 분리하여 UI에서 적절한 피드백 제공
- React Flow Node/Edge 타입과 DTO 간 매핑 지원

---

### 3. shadcn/ui React Flow Components

> **참고**: [React Flow Components Tutorial](https://reactflow.dev/learn/tutorials/getting-started-with-react-flow-components)

Canvas Management Domain은 shadcn/ui의 React Flow Components를 기반으로 구축됩니다. 이를 통해 일관된 디자인 시스템과 빠른 개발이 가능합니다.

#### 설치 및 설정

**React Flow Components 설치**:
```bash
# shadcn/ui 초기 설정 (이미 완료되었다면 스킵)
npx shadcn@latest init

# React Flow Components 설치
npx shadcn@latest add https://ui.reactflow.dev/base-node
npx shadcn@latest add https://ui.reactflow.dev/labeled-handle
npx shadcn@latest add https://ui.reactflow.dev/data-edge
```

**tailwind.config.js 설정**:
```javascript
module.exports = {
  // shadcn/ui와 React Flow 스타일링을 위한 설정
  theme: {
    extend: {
      // React Flow 노드 스타일을 위한 커스텀 색상
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
}
```

#### Building Blocks

**BaseNode 컴포넌트**:
- **역할**: 모든 커스텀 노드의 기본 구조 제공
- **주요 기능**: 헤더, 본문, 푸터 레이아웃, shadcn/ui 스타일 적용
- **사용법**: `<BaseNode>`, `<BaseNodeHeader>`, `<BaseNodeHeaderTitle>`, `<BaseNodeResizer>`
- **특징**: tailwind.config.js 수정으로 일괄 스타일 변경 가능

**LabeledHandle 컴포넌트**:
- **역할**: 레이블이 있는 연결 핸들 제공
- **주요 기능**: 핸들 위치 (top, right, bottom, left), 타입 (source, target), 레이블 표시
- **사용법**: `<LabeledHandle title="input" type="target" position={Position.Left} />`
- **특징**: 시각적으로 명확한 연결점 제공

**DataEdge 컴포넌트**:
- **역할**: 소스 노드의 데이터를 엣지 레이블로 표시
- **주요 기능**: 동적 레이블 업데이트, 데이터 필드 매핑
- **사용법**: `edge.data = { key: 'value' }` 로 표시할 필드 지정
- **특징**: 실시간 데이터 흐름 시각화

#### NodeTypes 및 EdgeTypes 등록

**nodeTypes 설정**:
```typescript
import { BlockMountNode } from '@/components/nodes/block-mount-node'

const nodeTypes = {
  blockMount: BlockMountNode,
  // 다른 커스텀 노드 타입들...
}
```

**edgeTypes 설정**:
```typescript
import { DataEdge } from '@/components/data-edge'

const edgeTypes = {
  data: DataEdge,
  // 다른 커스텀 엣지 타입들...
}
```

**ReactFlow 컴포넌트에 전달**:
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  // ... 다른 props
/>
```

#### React Flow Hooks 활용

**useReactFlow Hook**:
- **역할**: React Flow 인스턴스에 접근하여 노드/엣지 조작
- **주요 메서드**:
  - `getNodes()`: 모든 노드 조회
  - `getEdges()`: 모든 엣지 조회
  - `updateNodeData(nodeId, data)`: 노드 데이터 업데이트
  - `getHandleConnections({ nodeId, id, type })`: 핸들 연결 정보 조회
- **사용 시나리오**: 블럭 데이터 업데이트, 엣지 연결 확인

**useStore Hook**:
- **역할**: React Flow 내부 상태에 직접 접근
- **주요 용도**: 노드 조회 최적화 (`state.nodeLookup`)
- **사용 시나리오**: 대량의 노드 데이터 조회 시 성능 최적화

**useNodesData Hook**:
- **역할**: 특정 노드들의 데이터를 구독
- **주요 용도**: 연결된 노드의 데이터 변경 감지
- **사용 시나리오**: 엣지로 연결된 노드의 데이터 기반 계산

#### 컴포넌트 구현 예시

**BlockMountNode 구현**:
```typescript
import { BaseNode, BaseNodeHeader, BaseNodeHeaderTitle } from '@/components/base-node'
import { LabeledHandle } from '@/components/labeled-handle'
import type { Node, NodeProps } from '@xyflow/react'

type BlockMountNode = Node<BlockMountView, 'blockMount'>

export function BlockMountNode({ data }: NodeProps<BlockMountNode>) {
  return (
    <BaseNode className="w-64">
      <BaseNodeHeader>
        <BaseNodeHeaderTitle>{data.blockType}</BaseNodeHeaderTitle>
      </BaseNodeHeader>
      
      <div className="p-4">
        {/* 블럭 콘텐츠 렌더링 */}
      </div>
      
      <footer className="bg-gray-100">
        <LabeledHandle title="input" type="target" position={Position.Left} />
        <LabeledHandle title="output" type="source" position={Position.Right} />
      </footer>
    </BaseNode>
  )
}
```

**onConnect Handler 구현**:
```typescript
const onConnect: OnConnect = useCallback(
  (params) => {
    setEdges((edges) =>
      addEdge({ 
        type: 'data', 
        data: { key: 'value' }, // DataEdge에서 표시할 필드
        ...params 
      }, edges)
    )
  },
  [setEdges]
)
```

#### 스타일 커스터마이징

**BaseNode 스타일 수정**:
- `src/components/base-node.tsx` 파일 수정
- 모든 노드에 일괄 적용됨
- tailwind 클래스로 간편한 스타일링

**테마 설정**:
- `tailwind.config.js`의 CSS 변수 수정
- 다크 모드 지원
- 브랜드 컬러 적용

---

## 🎯 React Context 설계

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계

### 1. Context 타입 정의

#### CanvasManagementContext

- **파일 위치**: `src/domains/canvas-management/frontend/contexts/canvas-management-context.tsx`
- **역할**: Canvas Management 도메인의 전역 상태를 관리하는 React Context
- **State 속성**:
  - canvas: CanvasView | null (현재 캔버스 정보)
  - blockMounts: BlockMountView[] (블럭 마운트 목록)
  - edges: EdgeView[] (엣지 목록)
  - viewport: ViewportView | null (뷰포트 상태)
  - selectedBlockIds: string[] (선택된 블럭 ID들)
  - reactFlowNodes: ReactFlowNode[] (React Flow 노드 데이터)
  - reactFlowEdges: ReactFlowEdge[] (React Flow 엣지 데이터)
  - isLoading: boolean (로딩 상태)
  - error: string | null (에러 상태)
  - isDragging: boolean (드래그 상태)
  - snapGuidelines: SnapGuideline[] (스냅 가이드라인)
- **Actions 메서드**:
  - initializeCanvas(pageId: string): 캔버스 초기화
  - mountBlock(request: MountBlockRequest): 블럭 마운트
  - transformBlock(request: TransformBlockRequest): 블럭 변형
  - createEdge(request: CreateEdgeRequest): 엣지 생성
  - deleteBlockMount(blockMountId: string): 블럭 마운트 삭제
  - updateViewport(request: UpdateViewportRequest): 뷰포트 업데이트
  - selectBlocks(blockIds: string[]): 블럭 선택
  - clearSelection(): 선택 해제
  - updateSnapGuidelines(guidelines: SnapGuideline[]): 스냅 가이드라인 업데이트
- **Context 타입**: State + Actions 결합
- **특징**: 
  - React Flow와 도메인 상태의 동기화
  - 실시간 드래그/스냅 상태 관리
  - 다중 블럭 선택 지원

**데이터 흐름**:
1. Server Components에서 초기 캔버스 데이터 로드
2. Provider를 통해 React Flow와 도메인 상태 동기화
3. Hook을 통해 컴포넌트에서 캔버스 상태 접근
4. Actions를 통해 블럭/엣지 조작 및 React Flow 업데이트

---

### 2. Provider 구현 패턴

- **파일 위치**: `src/domains/canvas-management/frontend/contexts/canvas-management-context.tsx`
- **역할**: CanvasManagementContext를 실제로 구현하는 Provider 컴포넌트
- **주요 기능**:
  - useState를 통한 캔버스 상태 관리 (canvas, blockMounts, edges, viewport)
  - useOptimistic을 통한 낙관적 업데이트 (드래그/리사이즈 시 즉시 UI 반응)
  - useEffect를 통한 초기 캔버스 데이터 로드 및 뷰포트 복원
  - React Flow 상태와 도메인 상태 동기화
  - 드래그/스냅 상태 실시간 추적
  - Server Actions 호출 및 에러 처리
- **Props**:
  - children: React.ReactNode (하위 컴포넌트)
  - initialCanvas: CanvasView | null (서버에서 전달된 초기 캔버스 데이터)
  - initialBlockMounts: BlockMountView[] (서버에서 전달된 초기 블럭 목록)
  - initialEdges: EdgeView[] (서버에서 전달된 초기 엣지 목록)
  - initialViewport: ViewportView | null (서버에서 전달된 초기 뷰포트 상태)
- **특징**:
  - Server Components에서 초기 데이터를 받아 클라이언트에서 React Flow와 동기화
  - 사용자별 뷰포트 상태 로컬 스토리지 기반 영속성
  - React Flow 이벤트와 도메인 액션 간 브릿지 역할

**구현 플로우**:
1. Server Components에서 초기 캔버스/블럭/엣지/뷰포트 데이터 전달
2. useState로 각 상태 초기화 및 React Flow 노드/엣지 데이터 생성
3. useEffect에서 뷰포트 상태 복원 및 캔버스 초기화 확인
4. React Flow 이벤트 핸들러를 통한 실시간 상태 동기화
5. Context Provider로 하위 컴포넌트에 상태 및 액션 전달

---

## 🪝 Custom Hooks 설계

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계

### 1. 메인 Hook

#### useCanvasManagement Hook

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-management.ts`
- **역할**: CanvasManagementContext를 사용하기 쉽게 추상화한 메인 Hook
- **주요 기능**:
  - Context 상태 및 Actions 접근
  - 선택된 블럭들 추출 (useMemo)
  - 뷰포트 상태 추출 (useMemo)
  - 캔버스 관련 비즈니스 로직 메서드 제공
- **제공 메서드**:
  - selectedBlocks: 현재 선택된 블럭들 (useMemo로 최적화)
  - selectedBlockIds: 선택된 블럭 ID 목록
  - canvas: 현재 캔버스 정보
  - blockMounts: 블럭 마운트 목록
  - edges: 엣지 목록
  - viewport: 뷰포트 상태
  - isLoading, error: 로딩 및 에러 상태
  - findBlockMountById(id): ID로 블럭 마운트 검색
  - findEdgeById(id): ID로 엣지 검색
  - canSelectBlocks(blockIds): 블럭 선택 가능 여부 검증
  - getBlockMountsByPage(pageId): 페이지별 블럭 마운트 조회
- **반환값**: Context 상태 + 추가 유틸리티 메서드
- **특징**:
  - Context를 직접 사용하지 않고 Hook을 통해 접근
  - 캔버스 관련 비즈니스 로직을 Hook에 캡슐화
  - useMemo로 불필요한 재계산 방지
  - React Flow 데이터와 도메인 데이터 간 매핑 제공

**사용 시나리오**:
- 캔버스 컴포넌트에서 선택된 블럭 정보 표시
- 블럭 목록에서 선택 가능한 블럭 필터링
- ID로 블럭/엣지 검색 및 표시

---

#### useBlockSelection Hook

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-block-selection.ts`
- **역할**: 블럭 선택 상태를 관리하는 전용 Hook
- **주요 기능**:
  - 다중 블럭 선택 관리
  - Ctrl/Shift 키와 함께 사용한 선택 확장
  - 영역 선택 (박스 드래그) 지원
- **제공 메서드**:
  - selectedBlockIds: 선택된 블럭 ID 목록
  - selectBlock(blockId): 단일 블럭 선택
  - selectBlocks(blockIds): 다중 블럭 선택
  - toggleBlock(blockId): 블럭 선택 토글
  - clearSelection(): 모든 선택 해제
  - isSelected(blockId): 블럭 선택 여부 확인

---

#### useSnapGuidelines Hook

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-snap-guidelines.ts`
- **역할**: 스냅 가이드라인을 계산하고 관리하는 Hook
- **주요 기능**:
  - 드래그 중 실시간 스냅 가이드라인 계산
  - 블럭 간 정렬 라인 및 중심선 계산
  - 스냅 임계값 (5px) 적용
- **제공 메서드**:
  - guidelines: 현재 표시할 가이드라인 목록
  - calculateGuidelines(draggingBlock, otherBlocks): 가이드라인 계산
  - clearGuidelines(): 가이드라인 클리어

---

### 2. Context Hook

- **파일 위치**: `src/domains/canvas-management/frontend/contexts/canvas-management-context.tsx`
- **역할**: CanvasManagementContext 접근을 위한 내부 Hook
- **주요 기능**:
  - useContext를 통해 Context 접근
  - Provider 외부 사용 시 에러 발생
- **특징**:
  - 타입 안전성 보장
  - Provider 누락 시 명확한 에러 메시지
  - 메인 Hook에서 내부적으로 사용

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. 캔버스 컴포넌트

#### CanvasProvider

- **파일 위치**: `src/domains/canvas-management/frontend/components/canvas-provider.tsx`
- **역할**: React Flow 캔버스를 래핑하고 Context와 연동하는 컴포넌트
- **주요 기능**:
  - React Flow 인스턴스 초기화 및 관리
  - 노드/엣지 데이터를 React Flow로 동기화
  - 드래그, 선택, 엣지 생성 이벤트 처리
  - 뷰포트 상태 관리 (줌/패닝)
  - 스냅 가이드라인 렌더링
- **사용 Hook**: 
  - `useCanvasManagement()`: 캔버스 상태 관리
  - `useBlockSelection()`: 블럭 선택 관리
  - `useReactFlow()`: React Flow 인스턴스 접근
  - `useNodesState()`: 노드 상태 관리
  - `useEdgesState()`: 엣지 상태 관리
  - `useOnSelectionChange()`: 선택 변경 감지
- **UI 라이브러리**: 
  - `ReactFlow`: 메인 캔버스 컴포넌트
  - `ReactFlowProvider`: React Flow Context Provider
  - `Background`: 그리드 배경
  - `Controls`: 줌/패닝 컨트롤
  - `MiniMap`: 미니맵
  - `Panel`: 커스텀 패널 (툴바, 컨트롤 등)
- **nodeTypes 등록**:
  ```typescript
  const nodeTypes = {
    blockMount: BlockMountNode,
    // 블럭 타입별 커스텀 노드들...
  }
  ```
- **edgeTypes 등록**:
  ```typescript
  const edgeTypes = {
    data: DataEdge,
    // 커스텀 엣지들...
  }
  ```
- **특징**:
  - React Flow와 도메인 Context 간 브릿지 역할
  - 실시간 이벤트 처리 및 상태 동기화
  - shadcn/ui React Flow Components 활용
  - `onConnect` Handler로 엣지 생성 처리
  - `onNodesChange` / `onEdgesChange` Handler로 상태 동기화

**구현 예시**:
```typescript
export function CanvasProvider() {
  const { blockMounts, edges, updateBlockMount, createEdge } = useCanvasManagement()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  
  const onConnect: OnConnect = useCallback((params) => {
    setEdges((edges) => addEdge({ 
      type: 'data', 
      data: { key: 'value' },
      ...params 
    }, edges))
  }, [setEdges])
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

**사용 위치**:
- 캔버스 페이지: 메인 캔버스 영역
- 페이지 레이아웃: 전체 캔버스 관리

---

#### BlockToolbar

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-toolbar.tsx`
- **역할**: 블럭 생성 및 캔버스 도구를 제공하는 툴바 컴포넌트
- **주요 기능**:
  - 플러스(+) 버튼으로 블럭 타입 선택 다이얼로그 표시
  - 블럭 타입별 아이콘과 이름 표시
  - 검색 기능으로 블럭 타입 필터링
  - 선택된 블럭에 대한 정렬/분포 도구 제공
- **사용 Hook**: useCanvasManagement()
- **UI 라이브러리**: Button, Dialog, Input, Badge, DropdownMenu
- **특징**:
  - 블럭 생성 모드 활성화/비활성화
  - 권한별 블럭 타입 표시/숨김
  - 반응형 디자인 적용

**사용 위치**:
- 캔버스 헤더: 상단 도구바 영역
- 캔버스 페이지: 블럭 생성 인터페이스

---

#### BlockAddDialog

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-add-dialog.tsx`
- **역할**: 블럭 타입 선택을 위한 다이얼로그 컴포넌트
- **주요 기능**:
  - 카테고리별 블럭 타입 목록 표시 (도형, 유튜브, 이미지, 영상, 지도 등)
  - 각 타입에 아이콘과 이름 표시
  - 검색 기능으로 타입 필터링
  - 선택 시 블럭 생성 모드 활성화
- **사용 Hook**: useCanvasManagement()
- **UI 라이브러리**: Dialog, DialogContent, Input, Grid, Card
- **특징**:
  - 모달 형태로 표시
  - 키보드 네비게이션 지원
  - ESC 키로 취소 가능

**사용 위치**:
- BlockToolbar에서 호출: 블럭 타입 선택
- 단축키 (Cmd+K): 빠른 블럭 추가

---

### 2. 블럭 관리 컴포넌트

#### BlockMountToolbar

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-mount-toolbar.tsx`
- **역할**: 선택된 블럭에 대한 편집 도구를 제공하는 툴바 컴포넌트
- **주요 기능**:
  - 선택된 블럭 위에 표시되는 컨텍스트 툴바
  - Details 버튼 (>>): 에디터 패널 열기/닫기
  - 더보기 메뉴 (...): Edit, Duplicate, Create Component, Delete
  - 블럭 타입별 추가 옵션들
- **사용 Hook**: useCanvasManagement(), useBlockSelection()
- **UI 라이브러리**: DropdownMenu, Button, Tooltip, Separator
- **특징**:
  - 선택된 블럭에만 표시
  - 블럭 타입에 따라 다른 옵션 제공
  - 접근성 지원 (키보드 단축키)

**사용 위치**:
- 캔버스 내 블럭 선택 시: 블럭 상단 오버레이
- 선택된 블럭 편집: 컨텍스트 메뉴

---

#### SnapGuidelines

- **파일 위치**: `src/domains/canvas-management/frontend/components/snap-guidelines.tsx`
- **역할**: 드래그 중 스냅 가이드라인을 렌더링하는 컴포넌트
- **주요 기능**:
  - 실시간 스냅 가이드라인 표시
  - 블럭 간 정렬 라인 (수직/수평)
  - 중심선 가이드라인
  - 5px 임계값 기반 스냅 적용
- **사용 Hook**: useSnapGuidelines()
- **특징**:
  - 드래그 중에만 표시
  - 임시 렌더링 (React Flow 오버레이)
  - 성능 최적화를 위한 메모이제이션

**사용 위치**:
- CanvasProvider 내부: React Flow 오버레이로 렌더링
- 드래그 앤 드롭 시: 실시간 가이드라인 표시

---

### 3. 뷰포트 제어 컴포넌트

#### ViewportControls

- **파일 위치**: `src/domains/canvas-management/frontend/components/viewport-controls.tsx`
- **역할**: 캔버스 뷰포트 조작을 위한 컨트롤 컴포넌트
- **주요 기능**:
  - 줌 인/아웃 버튼
  - 미니맵 토글 버튼
  - 현재 줌 레벨 표시
  - 뷰포트 상태 저장/복원
  - 블럭 포커스 기능
- **사용 Hook**: useCanvasManagement()
- **UI 라이브러리**: Button, Slider, Badge, Tooltip
- **특징**:
  - 우측 하단 고정 위치
  - 마우스 휠/트랙패드와 연동
  - 사용자별 뷰포트 상태 영속성

**사용 위치**:
- 캔버스 페이지: 뷰포트 제어 영역
- 모든 캔버스 화면: 일관된 컨트롤 제공

---

## 🔗 앱 레벨 통합

> **가이드 참조**: Phase 3.2 - 앱 레벨 통합 설계

### 1. Provider 중첩 순서

**Root Layout 통합**:
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WorkspaceManagementProvider>
            <CanvasManagementProvider 
              initialCanvas={initialCanvas}
              initialBlockMounts={initialBlockMounts}
              initialEdges={initialEdges}
              initialViewport={initialViewport}
            >
              {children}
            </CanvasManagementProvider>
          </WorkspaceManagementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Provider 순서 원칙**:
- AuthProvider: 인증 상태 관리 (가장 상위)
- WorkspaceManagementProvider: 페이지 접근 권한 및 워크스페이스 상태
- CanvasManagementProvider: 캔버스 관리 상태 (페이지별 독립)

---

### 2. 초기 데이터 전달

**Server Components에서 데이터 로드**:
```typescript
// src/app/pages/[pageId]/layout.tsx
export default async function PageLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode
  params: { pageId: string }
}) {
  // 페이지별 초기 캔버스 데이터 로드
  const [canvas, blockMounts, edges, viewport] = await Promise.all([
    getCanvasViewAction(params.pageId),
    getBlockMountsAction(params.pageId),
    getEdgesAction(params.pageId),
    getViewportAction(params.pageId)
  ]);
  
  return (
    <CanvasManagementProvider 
      initialCanvas={canvas}
      initialBlockMounts={blockMounts}
      initialEdges={edges}
      initialViewport={viewport}
    >
      {children}
    </CanvasManagementProvider>
  );
}
```

---

### 3. 페이지에서 Hook 사용

**캔버스 페이지 컴포넌트**:
```typescript
// src/app/pages/[pageId]/page.tsx
export default function CanvasPage({ params }: { params: { pageId: string } }) {
  const { 
    canvas, 
    blockMounts, 
    selectedBlocks, 
    isLoading,
    mountBlock,
    transformBlock 
  } = useCanvasManagement();
  
  if (isLoading) {
    return <CanvasLoadingSkeleton />;
  }
  
  return (
    <div className="h-screen flex flex-col">
      <BlockToolbar />
      <div className="flex-1 relative">
        <CanvasProvider />
        <ViewportControls />
      </div>
    </div>
  );
}
```

---

## 🔐 로컬 스토리지 기반 영속성

### Canvas Storage Helpers

**뷰포트 상태 저장 유틸리티**:
```typescript
// src/domains/canvas-management/frontend/utils/canvas-storage.ts

export const CANVAS_STORAGE_KEYS = {
  VIEWPORT_STATE: 'canvas-viewport-state',
  SELECTED_BLOCKS: 'canvas-selected-blocks',
  SNAP_SETTINGS: 'canvas-snap-settings',
};

export interface ViewportState {
  pageId: string
  zoomLevel: number
  center: { x: number, y: number }
  lastUpdated: string
}

export function getViewportStateFromStorage(pageId: string): ViewportState | null {
  // localStorage에서 페이지별 뷰포트 상태 읽기
}

export function setViewportStateToStorage(viewportState: ViewportState): void {
  // localStorage에 뷰포트 상태 저장
}

export function getSelectedBlocksFromStorage(): string[] {
  // localStorage에서 선택된 블럭 ID 목록 읽기
}

export function setSelectedBlocksToStorage(blockIds: string[]): void {
  // localStorage에 선택된 블럭 ID 목록 저장
}
```

---

## ✅ 검증 체크리스트

### DTO 타입 정의
- [ ] DTO 인터페이스가 Plain Object로 정의되었는가?
- [ ] Date 객체가 ISO 문자열로 직렬화되었는가?
- [ ] Value Object가 string으로 직렬화되었는가?
- [ ] Next.js Server Actions 직렬화 제약을 준수하는가?
- [ ] React Flow 타입 (`Node<T>`, `Edge<T>`)이 올바르게 정의되었는가?
- [ ] AppNode, AppEdge Union 타입이 정의되었는가?

### shadcn/ui React Flow Components
- [ ] BaseNode, LabeledHandle, DataEdge 컴포넌트가 설치되었는가?
- [ ] tailwind.config.js에 React Flow 스타일 설정이 추가되었는가?
- [ ] BaseNode를 활용한 커스텀 노드가 구현되었는가?
- [ ] LabeledHandle로 명확한 연결점이 제공되는가?
- [ ] DataEdge로 실시간 데이터 흐름이 시각화되는가?
- [ ] nodeTypes와 edgeTypes가 올바르게 등록되었는가?

### Context 설계
- [ ] Canvas Management 전용 Context가 독립적으로 생성되었는가?
- [ ] 캔버스, 블럭마운트, 엣지, 뷰포트 상태가 관리되는가?
- [ ] React Flow 상태와 도메인 상태가 동기화되는가?
- [ ] 로컬 스토리지 기반 뷰포트 영속성이 구현되었는가?
- [ ] 초기 캔버스 데이터 로드 로직이 구현되었는가?

### Server Actions 연동
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] 의존성 주입 패턴으로 CanvasManagementService를 사용하는가?
- [ ] Command 객체를 활용하여 블럭/엣지 조작을 구조화했는가?
- [ ] DTO 직렬화가 올바르게 구현되었는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### Hook 구현
- [ ] useCanvasManagement Hook이 Context를 적절히 추상화했는가?
- [ ] useBlockSelection, useSnapGuidelines 전용 Hook이 구현되었는가?
- [ ] React Flow Hooks (useReactFlow, useStore, useNodesData)가 활용되는가?
- [ ] 블럭 선택, 스냅 계산 등 비즈니스 로직 메서드가 포함되었는가?
- [ ] React Flow 데이터와 도메인 데이터 간 매핑이 제공되는가?
- [ ] 에러 상태가 적절히 처리되는가?

### 컴포넌트 연동
- [ ] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [ ] CanvasProvider가 React Flow와 도메인 상태를 연결하는가?
- [ ] useNodesState, useEdgesState로 노드/엣지 상태가 관리되는가?
- [ ] onConnect Handler로 엣지 생성이 처리되는가?
- [ ] BlockToolbar, ViewportControls 등 캔버스 전용 컴포넌트가 구현되었는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 드래그/스냅 상태 처리가 포함되었는가?

### 앱 통합
- [ ] CanvasManagementProvider가 적절한 순서로 중첩 배치되었는가?
- [ ] 페이지별 초기 캔버스/블럭/엣지/뷰포트 데이터가 전달되는가?
- [ ] 로컬 스토리지 기반 뷰포트 영속성이 올바르게 작동하는가?
- [ ] React Flow와 도메인 Context 간 이벤트 처리가 구현되었는가?
- [ ] ReactFlowProvider가 올바른 위치에 배치되었는가?

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components)
- **내용**:
  - Context 구현 및 Provider 설정
  - Custom Hooks 구현
  - UI 컴포넌트 구현
  - React Testing Library로 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

```
src/
├── components/                         # shadcn/ui React Flow Components (공용)
│   ├── base-node.tsx                   # BaseNode 빌딩 블록
│   ├── labeled-handle.tsx              # LabeledHandle 빌딩 블록
│   ├── data-edge.tsx                   # DataEdge 컴포넌트
│   └── nodes/
│       └── block-mount-node.tsx        # BlockMount 커스텀 노드
│
└── domains/canvas-management/
    ├── shared/
    │   ├── dtos/
    │   │   └── index.ts                # CanvasView, BlockMountView, EdgeView, ViewportView DTO
    │   ├── types/
    │   │   └── index.ts                # Result 패턴, AppNode, AppEdge 타입
    │   ├── commands/                   # Canvas Management Command 객체들
    │   └── errors/                     # CanvasManagementError 타입들
    ├── frontend/
    │   ├── contexts/
    │   │   └── canvas-management-context.tsx  # CanvasManagementContext + Provider
    │   ├── hooks/
    │   │   ├── use-canvas-management.ts    # 메인 Hook (useReactFlow 활용)
    │   │   ├── use-block-selection.ts      # 블럭 선택 관리 Hook
    │   │   └── use-snap-guidelines.ts      # 스냅 가이드라인 Hook
    │   ├── components/
    │   │   ├── canvas-provider.tsx         # React Flow 캔버스 (nodeTypes/edgeTypes 등록)
    │   │   ├── block-toolbar.tsx           # 블럭 생성 툴바
    │   │   ├── block-add-dialog.tsx        # 블럭 타입 선택 다이얼로그
    │   │   ├── block-mount-toolbar.tsx     # 블럭 편집 툴바
    │   │   ├── snap-guidelines.tsx         # 스냅 가이드라인 렌더링
    │   │   └── viewport-controls.tsx       # 뷰포트 제어 컴포넌트
    │   └── utils/
    │       └── canvas-storage.ts           # 로컬 스토리지 유틸리티
    └── actions/
        └── canvas-management.actions.ts    # Server Actions
```

**주요 특징**:
- **shadcn/ui React Flow Components**: BaseNode, LabeledHandle, DataEdge 등 빌딩 블록 활용
- **React Flow 통합**: React Flow와 도메인 상태 간 브릿지 역할, nodeTypes/edgeTypes 등록
- **React Flow Hooks**: useReactFlow(), useStore(), useNodesData() 등 공식 Hooks 활용
- **전용 Hooks**: 블럭 선택, 스냅 가이드라인 등 캔버스 특화 Hook
- **컴포넌트 분리**: 캔버스, 툴바, 컨트롤 등 역할별 컴포넌트 분리
- **로컬 스토리지**: 뷰포트 상태 등 클라이언트 전용 상태 영속성
- **TypeScript 타입 안전성**: Node<T>, Edge<T> 제네릭 타입 활용

---

이 Frontend Specification을 따라 **User Flow 기반의 Canvas Management 프론트엔드**를 구현할 수 있습니다! 🎨
