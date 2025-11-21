# Frontend Specification: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-19  
**최종 수정**: 2025-10-19  
**버전**: v1.3

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
  - pageId: string (PageId → string 직렬화)
  - blockCount: number
  - edgeCount: number
- **직렬화 규칙**:
  - Value Object (PageId) → string 변환
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
- **역할**: Server Actions에 전달되는 입력 데이터 구조 정의 (Software Design 시나리오 기반)

- **GetCanvasViewRequest** (Scenario 0):
  - pageId: string (필수)
  - userId: string (필수)

- **CreateBlockRequest** (Scenario 1 - 블럭 생성 및 마운팅):
  - pageId: string (필수)
  - blockType: string (필수)
  - position: { x: number, y: number } (필수)
  - userId: string (필수)

- **UpdateBlockPositionRequest** (Scenario 2 - 블럭 드래그):
  - blockMountId: string (필수)
  - newPosition: { x: number, y: number } (필수)
  - userId: string (필수)

- **UpdateBlockSizeRequest** (Scenario 2 - 블럭 리사이즈):
  - blockMountId: string (필수)
  - newSize: { width: number, height: number } (필수)
  - userId: string (필수)

- **UpdateBlockZOrderRequest** (Scenario 2 - Z-Order 변경):
  - blockMountId: string (필수)
  - newZOrder: number (필수)
  - userId: string (필수)

- **DuplicateBlockRequest** (Scenario 3 - 블럭 복제):
  - originalBlockId: string (필수)
  - pageId: string (필수)
  - userId: string (필수)

- **UpdateMultipleBlockPositionsRequest** (Scenario 5 - 다중 정렬):
  - blockPositions: Array<{
    blockMountId: string;
    position: { x: number, y: number };
  }> (필수)
  - userId: string (필수)

- **CreateEdgeRequest** (Scenario 7 - 엣지 생성):
  - pageId: string (필수)
  - sourceBlockId: string (필수)
  - targetBlockId: string (필수)
  - edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier' (기본값: 'default')
  - userId: string (필수)

- **DeleteBlockRequest** (Scenario 8 - 블럭 삭제):
  - blockId: string (필수)
  - userId: string (필수)

- **SaveViewportStateRequest** (Scenario 9 - 뷰포트 저장):
  - pageId: string (필수)
  - zoomLevel: number (필수)
  - center: { x: number, y: number } (필수)
  - userId: string (필수)

- **RestoreViewportStateRequest** (Scenario 9 - 뷰포트 복원):
  - pageId: string (필수)
  - userId: string (필수)

- **특징**: 
  - 모든 Request에 `userId: string` 필드 포함 (권한 검증용)
  - Software Design의 각 시나리오별 Server Action과 1:1 매칭
  - 폼 입력 데이터를 Server Actions에 전달하기 위한 타입

**사용 위치**:
- 캔버스 로드: `GetCanvasViewRequest` → `getCanvasViewAction()`
- 블럭 생성: `CreateBlockRequest` → `createBlockAction()`
- 블럭 위치 변경: `UpdateBlockPositionRequest` → `updateBlockPositionAction()`
- 블럭 크기 변경: `UpdateBlockSizeRequest` → `updateBlockSizeAction()`
- 블럭 Z-Order 변경: `UpdateBlockZOrderRequest` → `updateBlockZOrderAction()`
- 블럭 복제: `DuplicateBlockRequest` → `duplicateBlockAction()`
- 다중 정렬: `UpdateMultipleBlockPositionsRequest` → `updateBlockPositionsAction()`
- 엣지 생성: `CreateEdgeRequest` → `createEdgeAction()`
- 블럭 삭제: `DeleteBlockRequest` → `deleteBlockAction()`
- 뷰포트 저장: `SaveViewportStateRequest` → `saveViewportStateAction()`
- 뷰포트 복원: `RestoreViewportStateRequest` → `restoreViewportStateAction()`

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

### 3. ACL (Anti-Corruption Layer)

> **파일 위치**: `src/domains/canvas-management/frontend/acl/react-flow.acl.ts`

React Flow SSOT 설계에서 핵심적인 역할을 하는 ACL 레이어입니다. DB 데이터와 React Flow 데이터 간의 양방향 변환을 담당합니다.

#### React Flow ACL

**BlockNodeData 인터페이스**:
- blockMountId: string (블럭 마운트 ID)
- blockId: string (블럭 ID)  
- blockType: string (블럭 타입)
- metadata: Record<string, any> (블럭 메타데이터)
- size: { width: number, height: number } (블럭 크기)
- zOrder: number (Z-Order 레이어 순서)

**DB → React Flow 변환 함수**:
- `toReactFlowNode(block, blockMount)`: BlockDTO와 BlockMountView를 React Flow Node로 변환
  - id를 blockMount.blockMountId로 설정
  - type을 block.blockType으로 설정하여 커스텀 노드 컴포넌트 연결
  - position을 blockMount.position으로 설정
  - data에 blockMountId, blockId, blockType, metadata, size, zOrder 포함

- `toReactFlowEdge(edge)`: EdgeView를 React Flow Edge로 변환
  - id를 edge.edgeId로 설정
  - source/target을 edge.sourceBlockId/targetBlockId로 매핑
  - type을 edge.edgeType 또는 기본값 'default'로 설정

**React Flow → DB 변환 함수**:
- `fromReactFlowNode(node)`: React Flow Node를 TransformBlockRequest로 변환
  - blockMountId를 node.data.blockMountId로 추출
  - newPosition을 node.position으로 설정
  - newSize, newZOrder를 node.data에서 추출

- `fromReactFlowConnection(pageId, connection)`: React Flow 연결을 CreateEdgeRequest로 변환
  - pageId와 connection.source/target을 사용하여 요청 객체 생성
  - edgeType을 기본값 'default'로 설정

**ACL 역할**:
- ✅ **DB ↔ React Flow 변환**: 도메인 모델과 React Flow 데이터 간 매핑
- ✅ **타입 안전성**: TypeScript로 변환 과정의 타입 검증
- ✅ **변경 격리**: React Flow API 변경이 도메인에 영향 주지 않도록 격리

---

### 4. shadcn/ui React Flow Components

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
- BlockMountNode 컴포넌트를 import하여 nodeTypes 객체에 등록
- 'blockMount' 키로 BlockMountNode 컴포넌트를 매핑
- 필요에 따라 다른 커스텀 노드 타입들 추가

**edgeTypes 설정**:
- DataEdge 컴포넌트를 import하여 edgeTypes 객체에 등록  
- 'data' 키로 DataEdge 컴포넌트를 매핑
- 필요에 따라 다른 커스텀 엣지 타입들 추가

**ReactFlow 컴포넌트에 전달**:
- nodes와 edges 배열을 props로 전달
- nodeTypes와 edgeTypes 객체를 props로 전달하여 커스텀 컴포넌트 연결
- 기타 React Flow 설정 props 추가

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
- BaseNode, BaseNodeHeader, BaseNodeHeaderTitle 컴포넌트를 import
- LabeledHandle 컴포넌트를 import하여 연결점 제공
- NodeProps 타입을 사용하여 props 타입 정의
- BaseNode 내부에 Header, 본문 콘텐츠, footer 구조로 구성
- Header에 블럭 타입명 표시
- 본문에 블럭별 콘텐츠 렌더링
- Footer에 input(왼쪽), output(오른쪽) LabeledHandle 배치

**onConnect Handler 구현**:
- useCallback으로 메모이제이션하여 성능 최적화
- params를 받아서 기존 엣지 배열에 새 엣지 추가
- type을 'data'로 설정하고 data 객체에 표시할 필드 정보 포함
- addEdge 함수를 사용하여 엣지 배열 업데이트

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

## 🎯 컴포넌트 설계 (Props 전달 방식)

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계

### 핵심 원칙

1. **React Flow State = SSOT**: position, size, selection 등은 React Flow가 직접 관리
2. **Props 전달**: Context 없이 Props를 통한 데이터 전달로 단순화
3. **콜백 → Hook 메서드 → 서버 액션**: 단방향 흐름으로 DB 동기화
4. **선택은 로컬 전용**: React Flow 내부 상태만 사용, DB 저장 안 함

### Context 사용 분석 결과

**CanvasManagementContext 불필요**:
- ❌ `pageId`: Props로 전달 가능 (이미 서버에서 받아옴)
- ❌ `canvasId`: 사용되지 않음 (항상 null)
- ❌ `error`: localStorage에서 처리 가능
- ❌ `isInitializing`: Suspense로 처리됨

**최종 구조**:
- ✅ `ReactFlowProvider`만 사용
- ✅ Props를 통한 `pageId` 전달
- ✅ Hook에서 직접 서버 액션 호출

## 🪝 Custom Hooks 설계 (React Flow 기반)

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계  
> **Software Design 참조**: `03-software-design.md` - Frontend Hooks 섹션

Canvas Management Domain의 Hook 구조는 **Software Design에서 정의한 계층 구조**를 따릅니다.

### Hook 계층 구조 개요

```
Layer 1: 블럭 생명주기
├── useCanvasBlockLifecycle()      # 생성, 복제, 삭제 (Optimistic UI)

Layer 2: 블럭 변형
├── useCanvasBlockTransform()      # 위치, 크기, Z-Order, 정렬

독립 Hooks:
├── useCanvasViewport()            # 뷰포트 제어
├── useCanvasSelection()           # 선택 상태
├── useCanvasSnapGuides()          # 스냅 가이드
├── useCanvasEdgeManagement()      # 엣지 관리
└── useCanvasMode()                # 캔버스 모드 관리 ⭐ NEW
```

---

### 1. useCanvasBlockLifecycle() - Layer 1

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle.ts`
- **역할**: 블럭 생명주기 관리 (생성, 복제, 삭제)
- **의존성**: React Flow Store (UI 즉시 반영용), 서버 액션 (영구 저장용)
- **테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

**Optimistic UI 제어** (사용자 액션, AI Tool Call):
- `createBlock(blockType: string, position: Position)`: 즉시 React Flow에 노드 추가 → 서버 액션 호출 → 실패 시 롤백
- `duplicateBlock(originalBlockId: BlockId, position: Position)`: 즉시 React Flow에 노드 추가 → 서버 액션 호출 → 실패 시 롤백
- `deleteBlock(blockId: BlockId)`: 즉시 React Flow에서 제거 → 서버 액션 호출 → 실패 시 복원

**프로그램적 제어** (UI만 변경, 서버 호출 X):
- `addBlockToCanvas(blockId: BlockId, blockData: BlockData)`: React Flow Store에만 노드 추가 (서버 저장 X)
- `removeBlockFromCanvas(blockId: BlockId)`: React Flow Store에서만 노드 제거 (서버 저장 X)

**상태 읽기**:
- `getAllBlocks()`: 모든 블럭 정보 반환
- `getBlockById(blockId: BlockId)`: 특정 블럭 정보 반환
- `getBlockCount()`: 현재 블럭 개수 반환

**사용 시나리오**:
- 블럭 생성 모드 (`block-creation` 모드에서 캔버스 클릭)
- 블럭 복제 (Ctrl+D)
- 블럭 삭제 (DEL 키)

---

### 2. useCanvasBlockTransform() - Layer 2

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-block-transform.ts`
- **역할**: 블럭 변형 관리 (위치, 크기, Z-Order, 정렬)
- **의존성**: React Flow Store (프로그램적 제어용), 서버 액션 (영구 저장용)
- **테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

**프로그램적 제어** (AI Tool Call, 즉시 UI 반영):
- `setBlockPosition(blockId: BlockId, position: Position)`: React Flow Store 직접 업데이트
- `setBlockSize(blockId: BlockId, size: Size)`: React Flow Store 직접 업데이트
- `setBlockZOrder(blockId: BlockId, zOrder: ZOrder)`: React Flow Store 직접 업데이트

**서버 연동** (React Flow 콜백용, 영구 저장):
- `saveBlockPosition(blockId: BlockId, position: Position)`: 드래그 종료 시 서버 저장
- `saveBlockSize(blockId: BlockId, size: Size)`: 리사이즈 종료 시 서버 저장
- `saveBlockZOrder(blockId: BlockId, zOrder: ZOrder)`: Z-Order 변경 시 서버 저장

**블럭 정렬 및 배치** (프론트엔드 계산 + 서버 저장):
- `alignBlocks(blockIds: BlockId[], alignmentType: AlignmentType)`: 블럭 정렬 계산 → UI 즉시 반영 → 서버 저장
- `distributeBlocks(blockIds: BlockId[], direction: DistributionDirection)`: 블럭 균등 분포 계산 → UI 즉시 반영 → 서버 저장

**다중 블럭 위치 업데이트** (내부 구현용):
- `updateMultipleBlockPositions(blockPositions: {blockId: BlockId, position: Position}[])`: 여러 블럭 위치 일괄 업데이트 → 서버 저장

**통합 메소드** (프로그램적 제어 + 서버 저장):
- `updateBlockPosition(blockId: BlockId, position: Position, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장
- `updateBlockSize(blockId: BlockId, size: Size, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장
- `updateBlockZOrder(blockId: BlockId, zOrder: ZOrder, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장

**사용 시나리오**:
- 드래그 종료 시 (`onNodeDragStop` 콜백에서 `saveBlockPosition` 호출)
- 리사이즈 종료 시 (`onNodeResizeEnd` 콜백에서 `saveBlockSize` 호출)
- 정렬 도구 사용 시 (`multi-selection` 모드에서 정렬 버튼 클릭)

---

### 3. useCanvasViewport()

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-viewport.ts`
- **역할**: 뷰포트 상태 관리 (React Flow Store 활용)

**수동 제어** (AI Tool Call, 프로그램적 제어용):
- `zoomIn()`, `zoomOut()`: React Flow Store 직접 조작
- `panTo(center: Position)`: React Flow Store 직접 조작
- `fitToScreen()`: React Flow Store 직접 조작
- `resetZoom()`: React Flow Store 직접 조작

**상태 읽기**:
- `getZoomLevel()`: 현재 줌 레벨 반환
- `getViewportCenter()`: 현재 뷰포트 중심 좌표 반환
- `getViewportBounds()`: 현재 뷰포트 경계 반환

**사용 시나리오**:
- 뷰포트 컨트롤 버튼 (우측 하단)
- 블럭 포커스 기능
- 페이지 이탈 시 뷰포트 상태 저장

---

### 4. useCanvasSelection()

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-selection.ts`
- **역할**: 블럭 선택 상태 관리 (React Flow Store 활용)

**수동 제어** (AI Tool Call, 프로그램적 제어용):
- `selectBlock(blockId: BlockId)`: React Flow Store의 선택 상태 조작
- `selectMultiple(blockIds: BlockId[])`: 다중 선택 상태 관리
- `clearSelection()`: 선택 해제
- `selectAll()`: 모든 블럭 선택

**상태 읽기**:
- `getSelectedBlocks()`: 현재 선택된 블럭 ID 목록 반환
- `isSelected(blockId: BlockId)`: 특정 블럭 선택 여부 확인
- `getSelectionCount()`: 선택된 블럭 개수 반환

**특징**:
- ✅ **읽기 전용**: React Flow 상태만 읽고, 직접 변경하지 않음
- ✅ **DB 저장 안 함**: 선택 상태는 로컬에서만 사용
- ✅ **SSOT**: React Flow 내부 상태가 선택의 단일 진실 공급원

**사용 시나리오**:
- AI Tool Call로 특정 블럭 선택
- 모든 블럭 선택 (Ctrl+A)
- 선택 해제 (ESC)

---

### 5. useCanvasSnapGuides()

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-snap-guidelines.ts`
- **역할**: 스냅 가이드라인 계산 및 표시

**주요 기능**:
- 드래그 중 실시간 스냅 가이드라인 계산
- 블럭 간 정렬 라인 및 중심선 계산
- 스냅 임계값 (5px) 적용

**제공 메서드**:
- `calculateSnapGuides(draggedBlockId: BlockId, position: Position)`: 드래그 중 실시간 계산
- `applySnap(blockId: BlockId, snapPosition: Position)`: 스냅 적용 시 위치 조정
- `showGuidelines(guidelines: Guideline[])`: 가이드라인 표시
- `hideGuidelines()`: 가이드라인 숨김

**사용 시나리오**:
- 드래그 중 (`dragging` 모드일 때만 활성화)
- 5px 임계값 내 진입 시 자동 스냅

---

### 6. useCanvasEdgeManagement()

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-edge-management.ts`
- **역할**: 엣지 생성 및 관리 (React Flow 연동)
- **의존성**: React Flow Store (UI 즉시 반영용), 서버 액션 (영구 저장용)
- **테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

**Optimistic UI 제어** (사용자 액션, AI Tool Call):
- `createEdge(sourceBlockId: BlockId, targetBlockId: BlockId, edgeType?: EdgeType)`: 즉시 React Flow에 엣지 추가 → 서버 액션 호출 → 실패 시 롤백
- `deleteEdge(edgeId: EdgeId)`: 즉시 React Flow에서 엣지 제거 → 서버 액션 호출 → 실패 시 복원
- `updateEdgeType(edgeId: EdgeId, edgeType: EdgeType)`: 즉시 타입 변경 → 서버 액션 호출 → 실패 시 롤백

**프로그램적 제어** (UI만 변경, 서버 호출 X):
- `addEdgeToCanvas(edgeId: EdgeId, edgeData: EdgeData)`: React Flow Store에만 엣지 추가 (서버 저장 X)
- `removeEdgeFromCanvas(edgeId: EdgeId)`: React Flow Store에서만 엣지 제거 (서버 저장 X)
- `setEdgeType(edgeId: EdgeId, edgeType: EdgeType)`: React Flow Store에서만 타입 변경 (서버 저장 X)

**상태 읽기**:
- `getAllEdges()`: 모든 엣지 정보 반환
- `getEdgeById(edgeId: EdgeId)`: 특정 엣지 정보 반환
- `getEdgesByBlock(blockId: BlockId)`: 특정 블럭과 연결된 엣지들 반환
- `getEdgeCount()`: 현재 엣지 개수 반환

**사용 시나리오**:
- 엣지 연결 (`onConnect` 콜백에서 `createEdge` 호출)
- 엣지 삭제 (DEL 키)
- 엣지 타입 변경 (엣지 탑 툴바)

---

### 7. useCanvasMode() ⭐ NEW

- **파일 위치**: `src/domains/canvas-management/frontend/hooks/use-canvas-mode.ts`
- **역할**: 캔버스 인터랙션 모드 관리 (비즈니스 로직)
- **의존성**: React State (독립적인 모드 상태 관리)
- **테스트 환경**: React 상태 Mock만 필요

**모드 타입**:
```typescript
type CanvasMode = 
  | { type: 'default' }                                    // 초기 모드
  | { type: 'block-creation', blockType: string }          // 블럭 추가 모드
  | { type: 'single-selection', blockId: BlockId }         // 단일 선택 모드
  | { type: 'multi-selection', blockIds: BlockId[] }       // 복수 선택 모드
  | { type: 'block-editing', blockId: BlockId }            // 블럭 편집 모드
  | { type: 'dragging', blockIds: BlockId[] }              // 드래그 중
  | { type: 'edge-creation', sourceBlockId: BlockId }      // 엣지 생성 중
```

**모드 전환**:
- `enterBlockCreationMode(blockType: string)`: 블럭 추가 모드 진입
- `enterSingleSelectionMode(blockId: BlockId)`: 단일 선택 모드 진입
- `enterMultiSelectionMode(blockIds: BlockId[])`: 복수 선택 모드 진입
- `enterBlockEditingMode(blockId: BlockId)`: 블럭 편집 모드 진입
- `enterDraggingMode(blockIds: BlockId[])`: 드래그 모드 진입
- `enterEdgeCreationMode(sourceBlockId: BlockId)`: 엣지 생성 모드 진입
- `exitToDefaultMode()`: 기본 모드로 복귀

**상태 읽기**:
- `getCurrentMode()`: 현재 모드 반환
- `isBlockCreationMode()`: 블럭 추가 모드 여부
- `isSingleSelectionMode()`: 단일 선택 모드 여부
- `isMultiSelectionMode()`: 복수 선택 모드 여부
- `isBlockEditingMode()`: 블럭 편집 모드 여부
- `isDraggingMode()`: 드래그 중 여부
- `isEdgeCreationMode()`: 엣지 생성 중 여부

**모드별 UI 렌더링 조건**:
- `block-creation`: 스켈레톤 그림자 블럭 표시
- `single-selection`: 블럭 탑 툴바 표시
- `multi-selection`: 정렬 도구 툴바 표시
- `block-editing`: 에디터 패널 표시
- `dragging`: 스냅 가이드라인 표시
- `edge-creation`: 엣지 프리뷰 표시

**사용 시나리오**:
- 블럭 타입 선택 시 → `enterBlockCreationMode(blockType)`
- 블럭 클릭 시 → `enterSingleSelectionMode(blockId)`
- 드래그 시작 시 → `enterDraggingMode(blockIds)`
- ESC 키 → `exitToDefaultMode()`

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. 캔버스 컴포넌트

#### CanvasClient

- **파일 위치**: `src/domains/canvas-management/frontend/components/canvas-client.tsx`
- **역할**: 클라이언트 사이드 캔버스 래퍼 및 Provider 설정
- **주요 기능**:
  - `ReactFlowProvider`로 React Flow Context 제공
  - `CanvasReactFlowWrapper`에 초기 노드/엣지 전달
  - 캔버스 레이아웃 구조 제공
- **Props**:
  - `pageId: string` (필수): 현재 페이지 ID
  - `initialNodes: Node[]`: 초기 React Flow 노드
  - `initialEdges: Edge[]`: 초기 React Flow 엣지
- **특징**:
  - Server Component(`page.tsx`)에서 받은 초기 데이터를 Client Component로 전달
  - ReactFlowProvider로 React Flow Context 초기화
  - 단순한 래퍼 역할, 실제 로직은 `CanvasReactFlowWrapper`에 위임

**사용 위치**:
- `page.tsx`의 `PageContent` 컴포넌트에서 렌더링
- 서버 컴포넌트와 클라이언트 컴포넌트 간 경계

---

#### CanvasReactFlowWrapper

- **파일 위치**: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
- **역할**: React Flow 인스턴스 및 실제 캔버스 렌더링
- **주요 기능**:
  - `useNodesState`, `useEdgesState`로 React Flow 상태 관리 (SSOT)
  - `onNodeDragStop`, `onConnect` 등 이벤트 핸들러로 DB 동기화
  - 모든 Custom Hooks을 통합하여 캔버스 기능 제공
  - React Flow UI 컴포넌트 렌더링
- **Props**:
  - `pageId: string` (필수): 현재 페이지 ID
  - `initialNodes: Node[]`: 초기 React Flow 노드
  - `initialEdges: Edge[]`: 초기 React Flow 엣지
- **사용 Hook**: 
  - `useCanvasMode()`: 캔버스 모드 상태 관리 ⭐
  - `useCanvasBlockLifecycle()`: 블럭 생명주기 관리
  - `useCanvasBlockTransform()`: 블럭 변형 관리
  - `useCanvasEdgeManagement()`: 엣지 관리
  - `useCanvasSelection()`: 선택 상태
  - `useCanvasViewport()`: 뷰포트 제어
  - `useCanvasSnapGuides()`: 스냅 가이드
  - `useNodesState()`: React Flow 노드 상태
  - `useEdgesState()`: React Flow 엣지 상태
- **UI 라이브러리**: 
  - `ReactFlow`: 메인 캔버스 컴포넌트
  - `Background`: 그리드 배경
  - `Controls`: 줌/패닝 컨트롤
  - `MiniMap`: 미니맵
- **특징**:
  - React Flow State가 SSOT (Single Source of Truth)
  - 드래그 종료, 엣지 연결 시점에만 DB 동기화
  - 실시간 UI 업데이트는 React Flow가 자동 처리
  - 캔버스 모드에 따라 다른 UI 컴포넌트 렌더링
  - 에러 상태 처리

**사용 위치**:
- `CanvasClient` 내부에서 렌더링
- 실제 React Flow 인스턴스가 생성되는 곳

---

#### BlockToolbar

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-toolbar.tsx`
- **역할**: 블럭 생성 및 캔버스 도구를 제공하는 툴바 컴포넌트
- **렌더링 조건**: `canEdit === true` (편집 권한이 있는 경우)
- **주요 기능**:
  - 플러스(+) 버튼으로 블럭 타입 선택 다이얼로그 표시
  - 블럭 타입별 아이콘과 이름 표시
  - 검색 기능으로 블럭 타입 필터링
  - 선택된 블럭에 대한 정렬/분포 도구 제공
- **사용 Hook**: 
  - `useCanvasMode()`: 현재 모드 확인
  - `useCanvasBlockLifecycle()`: 블럭 생성
- **UI 라이브러리**: Button, Dialog, Input, Badge, DropdownMenu
- **모드별 렌더링**:
  - `default`: 플러스 버튼 활성화
  - `block-creation`: 플러스 버튼 비활성화 (모드 중)
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
- **렌더링 조건**: 블럭 추가 버튼 클릭 시 (다이얼로그 열기)
- **주요 기능**:
  - 카테고리별 블럭 타입 목록 표시 (도형, 유튜브, 이미지, 영상, 지도 등)
  - 각 타입에 아이콘과 이름 표시
  - 검색 기능으로 타입 필터링
  - 선택 시 블럭 생성 모드 활성화 (`enterBlockCreationMode(blockType)`)
- **사용 Hook**: 
  - `useCanvasMode()`: 블럭 생성 모드 진입
- **UI 라이브러리**: Dialog, DialogContent, Input, Grid, Card
- **특징**:
  - 모달 형태로 표시
  - 키보드 네비게이션 지원
  - ESC 키로 취소 가능
  - 선택 시 다이얼로그 닫히고 블럭 생성 모드로 전환

**사용 위치**:
- BlockToolbar에서 호출: 블럭 타입 선택
- 단축키 (Cmd+K): 빠른 블럭 추가

---

### 2. 블럭 관리 컴포넌트

#### BlockMountToolbar (Node Top Toolbar)

- **파일 위치**: `src/domains/canvas-management/frontend/components/block-mount-toolbar.tsx`
- **역할**: 선택된 블럭에 대한 편집 도구를 제공하는 툴바 컴포넌트
- **렌더링 조건**: `isSingleSelectionMode() === true && isSelected(blockId)`
- **주요 기능**:
  - 선택된 블럭 위에 표시되는 컨텍스트 툴바
  - Details 버튼 (>>): 에디터 패널 열기/닫기 (`enterBlockEditingMode(blockId)`)
  - 더보기 메뉴 (...): Edit, Duplicate, Create Component, Delete
  - 블럭 타입별 추가 옵션들
- **사용 Hook**: 
  - `useCanvasMode()`: 현재 모드 확인 및 편집 모드 전환
  - `useCanvasSelection()`: 선택 상태 확인
  - `useCanvasBlockLifecycle()`: 블럭 복제, 삭제
- **UI 라이브러리**: DropdownMenu, Button, Tooltip, Separator
- **특징**:
  - 단일 선택 모드에서만 표시 (복수 선택 시 정렬 툴바로 대체)
  - 블럭 타입에 따라 다른 옵션 제공
  - 접근성 지원 (키보드 단축키)
  - 블럭 상단 부유 위치

**사용 위치**:
- 캔버스 내 블럭 선택 시: 블럭 상단 오버레이
- 선택된 블럭 편집: 컨텍스트 메뉴

---

#### SnapGuidelines

- **파일 위치**: `src/domains/canvas-management/frontend/components/snap-guidelines.tsx`
- **역할**: 드래그 중 스냅 가이드라인을 렌더링하는 컴포넌트
- **렌더링 조건**: `isDraggingMode() === true` (드래그 중일 때만 표시)
- **주요 기능**:
  - 실시간 스냅 가이드라인 표시
  - 블럭 간 정렬 라인 (수직/수평)
  - 중심선 가이드라인
  - 5px 임계값 기반 스냅 적용
- **사용 Hook**: 
  - `useCanvasMode()`: 드래그 모드 여부 확인
  - `useCanvasSnapGuides()`: 스냅 가이드 계산
- **특징**:
  - 드래그 중에만 표시
  - 임시 렌더링 (React Flow 오버레이)
  - 성능 최적화를 위한 메모이제이션
  - 5px 임계값 내 진입 시 자동 활성화

**사용 위치**:
- CanvasProvider 내부: React Flow 오버레이로 렌더링
- 드래그 앤 드롭 시: 실시간 가이드라인 표시

---

#### MultiSelectionToolbar ⭐ NEW

- **파일 위치**: `src/domains/canvas-management/frontend/components/multi-selection-toolbar.tsx`
- **역할**: 다중 선택된 블럭들에 대한 정렬 및 편집 도구 제공
- **렌더링 조건**: `isMultiSelectionMode() === true && getSelectionCount() >= 2`
- **주요 기능**:
  - 정렬 도구 버튼들 (상단, 하단, 좌측, 우측, 중앙 정렬)
  - 분포 도구 버튼들 (수평 균등 분포, 수직 균등 분포)
  - 복제, 삭제 버튼
  - 더보기 메뉴 (...): 추가 그룹 작업 옵션들
- **사용 Hook**: 
  - `useCanvasMode()`: 복수 선택 모드 확인
  - `useCanvasSelection()`: 선택된 블럭 목록
  - `useCanvasBlockTransform()`: 정렬/분포 실행
  - `useCanvasBlockLifecycle()`: 복제, 삭제
- **UI 라이브러리**: Button, DropdownMenu, Tooltip, Separator
- **특징**:
  - 복수 선택 모드에서만 표시 (단일 선택 시 블럭 탑 툴바로 대체)
  - 선택된 블럭들 영역 중앙 상단에 부유
  - 정렬 버튼 클릭 시 즉시 실행 (확인 다이얼로그 없음)
  - 프론트엔드에서 정렬 계산 → UI 즉시 반영 → 서버 저장

**사용 위치**:
- 캔버스 내 다중 블럭 선택 시: 선택 영역 상단 오버레이
- 정렬 도구 사용: 블럭들을 정렬하거나 균등 분포

---

#### SkeletonBlock ⭐ NEW

- **파일 위치**: `src/domains/canvas-management/frontend/components/skeleton-block.tsx`
- **역할**: 블럭 생성 모드에서 마우스를 따라다니는 스켈레톤 블럭
- **렌더링 조건**: `isBlockCreationMode() === true`
- **주요 기능**:
  - 선택된 블럭 타입의 스켈레톤 프리뷰
  - 마우스 커서를 따라 이동
  - 반투명 스타일로 표시
  - 캔버스 클릭 시 실제 블럭 생성
- **사용 Hook**: 
  - `useCanvasMode()`: 블럭 생성 모드 여부 확인, 선택된 블럭 타입 조회
  - `useCanvasBlockLifecycle()`: 캔버스 클릭 시 블럭 생성
- **UI 라이브러리**: 커스텀 렌더링 (React Flow Node 기반)
- **특징**:
  - 블럭 생성 모드에서만 표시
  - 마우스 위치에 실시간 렌더링
  - ESC 키로 취소 시 사라짐
  - 캔버스 클릭 시 해당 위치에 블럭 생성 후 사라짐

**사용 위치**:
- 블럭 타입 선택 후: 마우스 커서를 따라다니는 그림자 블럭
- 캔버스 클릭 대기 상태: 블럭 생성 위치 프리뷰

---

#### SelectionBoundingBox ⭐ NEW

- **파일 위치**: `src/domains/canvas-management/frontend/components/selection-bounding-box.tsx`
- **역할**: 다중 선택된 블럭들을 감싸는 커스텀 바운딩 박스 렌더링
- **렌더링 조건**: `isMultiSelectionMode() === true && getSelectionCount() >= 2`
- **주요 기능**:
  - 선택된 블럭들의 전체 영역을 감싸는 바운딩 박스 표시
  - 커스텀 스타일링 (테두리, 배경색, 투명도)
  - 선택 영역 시각적 강조
  - 바운딩 박스 내 패딩 적용
- **사용 Hook**: 
  - `useCanvasMode()`: 복수 선택 모드 확인
  - `useCanvasSelection()`: 선택된 블럭 목록
  - `useStore()`: React Flow Store에서 선택된 노드들의 위치와 크기 정보 조회
- **구현 방식**:
  ```typescript
  // 1. 선택된 노드들의 정보 가져오기
  const selectedNodes = useStore((state) =>
    state.nodes.filter((node) => node.selected)
  );
  
  // 2. 선택된 노드들의 경계 계산
  const bounds = {
    minX: Math.min(...selectedNodes.map(n => n.position.x)),
    minY: Math.min(...selectedNodes.map(n => n.position.y)),
    maxX: Math.max(...selectedNodes.map(n => n.position.x + (n.width || 0))),
    maxY: Math.max(...selectedNodes.map(n => n.position.y + (n.height || 0)))
  };
  
  // 3. 바운딩 박스 렌더링
  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.minX - padding,
        top: bounds.minY - padding,
        width: bounds.maxX - bounds.minX + padding * 2,
        height: bounds.maxY - bounds.minY + padding * 2,
        border: '2px solid var(--primary-color)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '8px',
        pointerEvents: 'none', // 클릭 이벤트 통과
        zIndex: 1 // 노드 아래 렌더링
      }}
    />
  );
  ```
- **스타일링 옵션**:
  - `border`: 테두리 스타일 (색상, 두께, 타입)
  - `backgroundColor`: 반투명 배경색
  - `borderRadius`: 모서리 둥글기
  - `padding`: 선택된 노드들과의 여백 (기본: 8px)
  - `boxShadow`: 그림자 효과 (선택사항)
- **기본 선택 박스 숨김 설정**:
  ```css
  /* React Flow 기본 선택 박스 숨김 */
  .react-flow__selection {
    display: none !important;
  }
  
  /* 또는 React Flow 컴포넌트에 클래스 추가 */
  .react-flow.hide-default-selection .react-flow__selection {
    display: none !important;
  }
  ```
  
  ```typescript
  // ReactFlow 컴포넌트에 className 추가
  <ReactFlow
    nodes={nodes}
    edges={edges}
    className="hide-default-selection"
    // ... 다른 props
  >
  ```

- **특징**:
  - React Flow 기본 선택 박스를 CSS로 숨김 처리
  - 커스텀 바운딩 박스로 대체하여 브랜드 디자인 적용 가능
  - React Flow 오버레이로 렌더링 (노드들 뒤에 표시)
  - `pointerEvents: none`으로 클릭 이벤트가 노드로 전달됨
  - 선택 상태 변경 시 자동 업데이트
  - 성능 최적화를 위한 메모이제이션
- **UI 라이브러리**: 커스텀 렌더링 (React Flow 오버레이 기반)

**사용 위치**:
- 캔버스 내 다중 블럭 선택 시: 선택 영역을 시각적으로 강조
- MultiSelectionToolbar와 함께 렌더링

**React Flow 통합**:
```typescript
// canvas-react-flow-wrapper.tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  className="hide-default-selection" // 기본 선택 박스 숨김
  // ... 다른 props
>
  <Background />
  <Controls />
  
  {/* 커스텀 오버레이로 추가 */}
  {isMultiSelectionMode() && <SelectionBoundingBox />}
  
  {/* 다른 컴포넌트들 */}
  <MiniMap />
</ReactFlow>
```

**CSS 설정** (전역 스타일 또는 컴포넌트 스타일에 추가):
```css
/* 기본 React Flow 선택 박스 숨김 */
.react-flow.hide-default-selection .react-flow__selection {
  display: none !important;
}

/* 또는 전역적으로 숨기기 */
.react-flow__selection {
  display: none !important;
}
```

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
- **사용 Hook**: 
  - `useCanvasViewport()`: 뷰포트 제어 (zoomIn, zoomOut, panTo, fitToScreen, resetZoom)
  - `useCanvasMode()`: 현재 모드 확인
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

### 1. Provider 중첩 순서 (최신 아키텍처)

**현재 구조**:

현재 아키텍처에서는 Provider가 각 레벨에서 필요한 시점에 제공됩니다:

1. **Root Layout** (`src/app/layout.tsx`):
   - `AuthProvider`: 인증 상태 관리 (전역)
   - `WorkspaceManagementProvider`: 워크스페이스 상태 관리 (전역)

2. **Page Layout** (`src/app/(dashboard)/r/[orgId]/workspace/[workspaceId]/page/[pageId]/layout.tsx`):
   - `PageSyncClient`: URL과 Context 동기화
   - `WorkspacePageHeader`: Breadcrumb 헤더

3. **Page** (`page.tsx`):
   - 서버 컴포넌트로 데이터 로드
   - ACL 변환 수행

4. **CanvasClient** (`canvas-client.tsx`):
   - `ReactFlowProvider`: React Flow Context 제공

**Provider 순서 원칙**:
- ✅ **AuthProvider**: 인증 상태 관리 (Root Layout - 전역)
- ✅ **WorkspaceManagementProvider**: 워크스페이스 상태 (Root Layout - 전역)
- ✅ **ReactFlowProvider**: React Flow Context (CanvasClient - 페이지별)

---

### 2. 초기 데이터 전달 (React Flow SSOT)

**현재 아키텍처 (최신 버전)**:

현재 구현에서는 **layout.tsx → page.tsx → canvas-client.tsx → canvas-react-flow-wrapper.tsx** 순서로 데이터가 전달됩니다.

#### 2.1. layout.tsx (Client Component)

**구현 개요**:
```typescript
// layout.tsx - Client Component
export default function PageLayout({ children, params }) {
  const { orgId, workspaceId, pageId } = params;

  return (
    <>
      {/* URL과 Context 동기화 */}
      <PageSyncClient orgId={orgId} workspaceId={workspaceId} pageId={pageId} />
      
      <div className="flex flex-col h-full">
        {/* Breadcrumb 헤더 */}
        <WorkspacePageHeader workspaceId={workspaceId} pageId={pageId} />
        
        {/* 페이지 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
```

**역할**:
- `PageSyncClient`: URL 파라미터를 Workspace Context와 동기화
- `WorkspacePageHeader`: Breadcrumb 헤더 렌더링
- 레이아웃 구조 제공 (헤더 + 콘텐츠)

#### 2.2. page.tsx (Server Component)

**구현 개요**:
```typescript
// page.tsx - Server Component
async function PageContent({ pageId }) {
  // 1. 서버에서 캔버스 데이터 로드
  const pageDataResult = await getCanvasPageDataAction(pageId);
  
  // 2. 에러 처리
  if (!pageDataResult.success) {
    return <CanvasErrorFallback error={pageDataResult.error} />;
  }

  // 3. ACL 변환: DB 데이터 → React Flow 초기 데이터
  const initialNodes = pageData.blockMounts.map(blockMount => {
    const block = pageData.blocks.find(b => b.id === blockMount.blockId);
    return block ? toReactFlowNode(block, blockMount) : null;
  }).filter(Boolean);

  const initialEdges = pageData.edges.map(toReactFlowEdge);

  // 4. CanvasClient에 초기 데이터 전달
  return (
    <CanvasClient
      pageId={pageId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}

export default async function WorkspacePageRoute({ params }) {
  const { pageId } = await params;
  
  return (
    <Suspense fallback={<CanvasLoadingSkeleton />}>
      <PageContent pageId={pageId} />
    </Suspense>
  );
}
```

**역할**:
- 서버에서 `getCanvasPageDataAction` 호출하여 캔버스 데이터 로드
- ACL 변환: `toReactFlowNode`, `toReactFlowEdge`로 DB → React Flow 데이터 변환
- `Suspense`로 로딩 상태 처리
- `CanvasClient`에 초기 데이터 전달

#### 2.3. canvas-client.tsx (Client Component)

**구현 개요**:
```typescript
// canvas-client.tsx - Client Component
export function CanvasClient({ pageId, initialNodes, initialEdges }) {
  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col bg-gray-50">
        <main className="flex-1 relative overflow-hidden">
          <CanvasReactFlowWrapper
            pageId={pageId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
          />
        </main>
      </div>
    </ReactFlowProvider>
  );
}
```

**역할**:
- `ReactFlowProvider`로 React Flow Context 제공
- `CanvasReactFlowWrapper`에 초기 노드/엣지 전달
- 캔버스 레이아웃 구조 제공

#### 2.4. canvas-react-flow-wrapper.tsx (Client Component)

**구현 방식**:
- Props로 `pageId`, `initialNodes`, `initialEdges`를 받아서 React Flow 상태 관리
- **모든 Custom Hooks 통합**:
  - `useCanvasMode()`: 캔버스 모드 상태 관리 ⭐
  - `useCanvasBlockLifecycle()`: 블럭 생명주기 (생성, 복제, 삭제)
  - `useCanvasBlockTransform()`: 블럭 변형 (위치, 크기, 정렬)
  - `useCanvasEdgeManagement()`: 엣지 관리
  - `useCanvasSelection()`: 선택 상태
  - `useCanvasViewport()`: 뷰포트 제어
  - `useCanvasSnapGuides()`: 스냅 가이드
- `useNodesState`, `useEdgesState`로 React Flow 노드/엣지 상태 관리 (SSOT)
- **모드별 이벤트 핸들러**:
  - `onNodeClick`: 단일 선택 모드 진입 (`enterSingleSelectionMode`)
  - `onSelectionChange`: 복수 선택 모드 진입 (`enterMultiSelectionMode`)
  - `onNodeDragStart`: 드래그 모드 진입 (`enterDraggingMode`)
  - `onNodeDragStop`: 드래그 종료 → 위치 서버 저장 (`saveBlockPosition`)
  - `onNodeResizeEnd`: 리사이즈 종료 → 크기 서버 저장 (`saveBlockSize`)
  - `onConnect`: 엣지 연결 → 엣지 서버 저장 (`createEdge`)
  - `onPaneClick`: 빈 영역 클릭 → 기본 모드 복귀 (`exitToDefaultMode`)
- **모드별 UI 컴포넌트 렌더링**:
  - `isBlockCreationMode()` → `<SkeletonBlock />`
  - `isSingleSelectionMode()` → `<BlockMountToolbar />`
  - `isMultiSelectionMode()` → `<MultiSelectionToolbar />`, `<SelectionBoundingBox />` ⭐
  - `isBlockEditingMode()` → `<EditorPanel />`
  - `isDraggingMode()` → `<SnapGuidelines />`
- ReactFlow 컴포넌트에 nodes, edges, 이벤트 핸들러들을 props로 전달
- Background, Controls, MiniMap 등 React Flow 기본 UI 컴포넌트 포함

**역할**:
- `useNodesState`, `useEdgesState`로 React Flow 상태 관리 (SSOT)
- `onNodeDragStop`, `onConnect` 이벤트 핸들러로 DB 동기화
- `useCanvasMode`로 캔버스 모드 관리 및 모드별 UI 렌더링
- 모든 Custom Hooks을 통합하여 캔버스 기능 제공
- React Flow UI 컴포넌트 렌더링 (`Background`, `Controls`, `MiniMap`)

**데이터 흐름 요약**:
```
1. page.tsx (서버) → getCanvasPageDataAction → DB 조회
2. page.tsx (서버) → ACL 변환 → initialNodes, initialEdges
3. CanvasClient → ReactFlowProvider 설정
4. CanvasReactFlowWrapper → React Flow 상태 초기화
5. 사용자 인터랙션 → React Flow 이벤트 → Hook → Server Actions → DB 저장
```

**CanvasPageData 타입 구조**:
- canvas: CanvasView | null (캔버스 정보)
- blocks: BlockDTO[] (블럭 정보: 타입, 메타데이터)
- blockMounts: BlockMountView[] (블럭 마운트 정보: 위치, 크기)
- edges: EdgeView[] (엣지 정보)
- viewport: ViewportView | null (뷰포트 정보)

**아키텍처 핵심 원칙**:
- ✅ **layout.tsx**: 페이지 레이아웃 + 메타 동기화 (Client Component)
- ✅ **page.tsx**: 서버 데이터 로드 + ACL 변환 (Server Component)
- ✅ **canvas-client.tsx**: ReactFlowProvider 설정 (Client Component)
- ✅ **canvas-react-flow-wrapper.tsx**: React Flow 인스턴스 + 이벤트 핸들러 (Client Component)
- ✅ **Hook**: 서버 액션 래핑 메서드 제공
- ✅ **ACL**: DB ↔ React Flow 데이터 변환

---

### 3. 시나리오별 데이터 플로우 ⭐ NEW

> **User Flow 참조**: `03-user-flow.md` - 각 시나리오별 화면 전환 및 모드 변경

#### 3.1. 블럭 생성 플로우 (Scenario 1)

```
1. 사용자가 플러스 버튼 클릭
   → BlockAddDialog 렌더링
   → 사용자가 블럭 타입 선택

2. useCanvasMode().enterBlockCreationMode(blockType)
   → 캔버스 모드: default → block-creation
   → SkeletonBlock 렌더링 (마우스 커서 따라다님)

3. 사용자가 캔버스 빈 영역 클릭
   → useCanvasBlockLifecycle().createBlock(blockType, position)
   → Optimistic UI: React Flow Store에 임시 노드 추가
   → Server Action 호출: createBlockAction(pageId, blockType, position)
   → 서버 성공: 임시 노드를 실제 블럭으로 교체
   → 서버 실패: 임시 노드 제거, 에러 표시
   → 캔버스 모드: block-creation → single-selection

4. BlockMountToolbar 렌더링 (선택된 블럭 위에)
```

#### 3.2. 블럭 드래그 플로우 (Scenario 2)

```
1. 사용자가 블럭 드래그 시작
   → onNodeDragStart 콜백 트리거
   → useCanvasMode().enterDraggingMode(blockIds)
   → 캔버스 모드: single-selection (or multi-selection) → dragging
   → SnapGuidelines 렌더링 (isDraggingMode() === true)

2. 드래그 중
   → React Flow가 실시간 위치 업데이트 (자동)
   → useCanvasSnapGuides().calculateSnapGuides(blockId, position)
   → 5px 임계값 내 진입 시 스냅 가이드 하이라이트

3. 드래그 종료
   → onNodeDragStop 콜백 트리거
   → useCanvasBlockTransform().saveBlockPosition(blockId, finalPosition)
   → Server Action 호출: updateBlockPositionAction(blockMountId, finalPosition)
   → 서버 성공: 위치 확정
   → 서버 실패: 원래 위치로 복원, 에러 표시
   → useCanvasMode().exitToDefaultMode() (or 선택 모드로 복귀)
   → 캔버스 모드: dragging → single-selection (or multi-selection)
```

#### 3.3. 다중 블럭 정렬 플로우 (Scenario 5)

```
1. 사용자가 다중 블럭 선택 (Shift+Click 또는 드래그)
   → onSelectionChange 콜백 트리거
   → useCanvasMode().enterMultiSelectionMode(blockIds)
   → 캔버스 모드: default → multi-selection
   → MultiSelectionToolbar 렌더링 (선택 영역 상단)

2. 사용자가 정렬 버튼 클릭 (예: 좌측 정렬)
   → useCanvasBlockTransform().alignBlocks(blockIds, 'left')
   → 프론트엔드에서 정렬 계산 (좌표 계산)
   → React Flow Store에 새로운 위치 즉시 반영
   → 사용자에게 정렬 결과 즉시 표시
   → Server Action 호출: updateBlockPositionsAction(blockPositions[])
   → 서버 성공: 위치 영구 저장
   → 서버 실패: 원래 위치로 복원, 에러 표시

3. MultiSelectionToolbar 여전히 표시 (추가 정렬 가능)
   → 빈 영역 클릭 시 useCanvasMode().exitToDefaultMode()
   → 캔버스 모드: multi-selection → default
```

#### 3.4. 엣지 생성 플로우 (Scenario 7)

```
1. 사용자가 연결 핸들 드래그 시작
   → onConnectStart 콜백 트리거
   → useCanvasMode().enterEdgeCreationMode(sourceBlockId)
   → 캔버스 모드: default → edge-creation
   → 연결선 프리뷰 렌더링 (React Flow 기본)

2. 연결 확정 (다른 블럭 핸들에 드롭)
   → onConnect 콜백 트리거
   → useCanvasEdgeManagement().createEdge(sourceBlockId, targetBlockId)
   → Optimistic UI: React Flow Store에 임시 엣지 추가
   → Server Action 호출: createEdgeAction(pageId, sourceBlockId, targetBlockId)
   → 서버 성공: 임시 엣지를 실제 엣지로 교체
   → 서버 실패: 임시 엣지 제거, 에러 표시
   → useCanvasMode().exitToDefaultMode()
   → 캔버스 모드: edge-creation → default

3. 엣지 선택 시 엣지 탑 툴바 렌더링 (React Flow 기본 선택 상태)
```

#### 3.5. 블럭 편집 모드 플로우 (Scenario 1 - Details)

```
1. 사용자가 블럭 더블클릭 (또는 Details 버튼 클릭)
   → useCanvasMode().enterBlockEditingMode(blockId)
   → 캔버스 모드: single-selection → block-editing
   → EditorPanel 렌더링 (사이드바)

2. 에디터 패널에서 블럭 속성 편집
   → 블럭 내용 실시간 업데이트 (React Flow Store)
   → 서버 저장은 별도 트리거 (저장 버튼 또는 자동 저장)

3. 에디터 패널 닫기 (또는 다른 블럭 클릭)
   → useCanvasMode().exitToDefaultMode() (or enterSingleSelectionMode)
   → 캔버스 모드: block-editing → default (or single-selection)
   → EditorPanel 숨김
```

**데이터 플로우 핵심 원칙**:
- ✅ **모드 중심 설계**: 모든 UI 인터랙션은 캔버스 모드 전환을 통해 이루어짐
- ✅ **Optimistic UI**: 사용자 액션은 즉시 UI에 반영되고, 서버 호출은 비동기로 처리
- ✅ **React Flow SSOT**: React Flow Store가 단일 진실 공급원, 서버는 영구 저장만 담당
- ✅ **Hook 기반 추상화**: 모든 비즈니스 로직은 Custom Hook으로 캡슐화
- ✅ **모드별 렌더링**: 캔버스 모드에 따라 다른 UI 컴포넌트 렌더링

---

## 🔐 로컬 스토리지 기반 영속성

### Canvas Storage Helpers

**뷰포트 상태 저장 유틸리티**:
- CANVAS_STORAGE_KEYS: localStorage 키 상수 정의 (VIEWPORT_STATE, SELECTED_BLOCKS, SNAP_SETTINGS)
- ViewportState 인터페이스: pageId, zoomLevel, center, lastUpdated 속성 포함
- getViewportStateFromStorage(pageId): localStorage에서 페이지별 뷰포트 상태 읽기 함수
- setViewportStateToStorage(viewportState): localStorage에 뷰포트 상태 저장 함수
- getSelectedBlocksFromStorage(): localStorage에서 선택된 블럭 ID 목록 읽기 함수
- setSelectedBlocksToStorage(blockIds): localStorage에 선택된 블럭 ID 목록 저장 함수

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

### 컴포넌트 설계 (Props 전달 방식)
- [ ] CanvasManagementContext 없이 Props 전달 방식이 구현되었는가?
- [ ] pageId가 Props를 통해 각 컴포넌트로 전달되는가?
- [ ] React Flow 상태가 SSOT로 관리되는가?
- [ ] 로컬 스토리지 기반 뷰포트 영속성이 구현되었는가?
- [ ] 초기 캔버스 데이터 로드 로직이 서버 컴포넌트에 구현되었는가?

### Server Actions 연동
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] 의존성 주입 패턴으로 CanvasManagementService를 사용하는가?
- [ ] Command 객체를 활용하여 블럭/엣지 조작을 구조화했는가?
- [ ] DTO 직렬화가 올바르게 구현되었는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### Hook 구현
- [ ] useCanvasMode Hook이 구현되었는가? ⭐
- [ ] 모든 모드 타입 (default, block-creation, single-selection, multi-selection, block-editing, dragging, edge-creation)이 정의되었는가? ⭐
- [ ] useCanvasBlockLifecycle Hook (생성, 복제, 삭제)이 구현되었는가? ⭐
- [ ] useCanvasBlockTransform Hook (위치, 크기, 정렬)이 구현되었는가? ⭐
- [ ] useCanvasEdgeManagement Hook이 구현되었는가? ⭐
- [ ] useCanvasSelection Hook이 구현되었는가?
- [ ] useCanvasViewport Hook이 구현되었는가?
- [ ] useCanvasSnapGuides Hook이 구현되었는가?
- [ ] React Flow Hooks (useReactFlow, useStore, useNodesData)가 활용되는가?
- [ ] Optimistic UI 패턴 (즉시 반영 + 서버 호출 + 실패 시 롤백)이 구현되었는가? ⭐
- [ ] 프로그램적 제어 메서드 (UI만 변경, 서버 호출 X)가 구현되었는가? ⭐
- [ ] 서버 연동 메서드 (React Flow 콜백용, 영구 저장)가 구현되었는가? ⭐
- [ ] 상태 읽기 메서드가 구현되었는가? ⭐
- [ ] React Flow 데이터와 도메인 데이터 간 매핑이 제공되는가?
- [ ] 에러 상태가 적절히 처리되는가?

### 컴포넌트 연동
- [ ] Props 전달을 통해 pageId가 컴포넌트 간 전달되는가?
- [ ] ReactFlowProvider가 올바른 위치에 배치되었는가?
- [ ] useNodesState, useEdgesState로 노드/엣지 상태가 관리되는가?
- [ ] 모드별 이벤트 핸들러 (onNodeClick, onNodeDragStart, onNodeDragStop, onSelectionChange, onPaneClick 등)가 구현되었는가? ⭐
- [ ] 모드별 UI 컴포넌트 렌더링 조건이 구현되었는가? ⭐
- [ ] SkeletonBlock 컴포넌트 (block-creation 모드)가 구현되었는가? ⭐
- [ ] BlockMountToolbar 컴포넌트 (single-selection 모드)가 구현되었는가? ⭐
- [ ] MultiSelectionToolbar 컴포넌트 (multi-selection 모드)가 구현되었는가? ⭐
- [ ] SnapGuidelines 컴포넌트 (dragging 모드)가 구현되었는가? ⭐
- [ ] SelectionBoundingBox 컴포넌트 (multi-selection 모드)가 구현되었는가? ⭐
- [ ] EditorPanel 컴포넌트 (block-editing 모드)가 구현되었는가? ⭐
- [ ] onConnect Handler로 엣지 생성이 처리되는가?
- [ ] BlockToolbar, ViewportControls 등 캔버스 전용 컴포넌트가 구현되었는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 드래그/스냅 상태 처리가 포함되었는가?

### 앱 통합
- [ ] Provider 중첩 순서가 최적화되었는가? (CanvasManagementProvider 제거)
- [ ] 페이지별 초기 캔버스/블럭/엣지/뷰포트 데이터가 전달되는가?
- [ ] 로컬 스토리지 기반 뷰포트 영속성이 올바르게 작동하는가?
- [ ] React Flow 이벤트 처리가 Hook을 통해 구현되었는가?
- [ ] ReactFlowProvider가 CanvasClient에 올바르게 배치되었는가?

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

## 📁 폴더 구조 요약 (최신 버전)

```
src/
├── app/(dashboard)/r/[orgId]/workspace/[workspaceId]/page/[pageId]/
│   ├── layout.tsx                      # 페이지 레이아웃 (Client Component)
│   ├── page.tsx                        # 서버 컴포넌트 (데이터 로드 + ACL)
│   └── page-sync-client.tsx            # URL ↔ Context 동기화
│
├── domains/
│   ├── workspace-management/frontend/components/page-viewer/
│   │   └── workspace-page-header.tsx   # Breadcrumb 헤더
│   │
│   └── canvas-management/
│       ├── shared/
│       │   ├── dtos/
│       │   │   └── index.ts            # CanvasView, BlockMountView, EdgeView DTO
│       │   └── types/
│       │       └── index.ts            # Result 패턴, AppNode, AppEdge 타입
│       │
│       ├── frontend/
│       │   ├── acl/
│       │   │   └── react-flow.acl.ts   # DB ↔ React Flow 데이터 변환
│       │   │
│       │   ├── hooks/
│       │   │   ├── use-canvas-management.ts  # 서버 액션 래핑 Hook
│       │   │   └── use-block-selection.ts    # 블럭 선택 상태 Hook
│       │   │
│       │   └── components/
│       │       ├── canvas-client.tsx         # ReactFlowProvider 래퍼
│       │       ├── canvas-react-flow-wrapper.tsx  # React Flow 인스턴스
│       │       ├── block-transform-toolbar.tsx    # 블럭 변형 툴바
│       │       └── ...                       # 기타 캔버스 UI 컴포넌트
│       │
│       └── actions/
│           └── canvas.actions.ts       # Server Actions (getCanvasPageDataAction 등)
│
└── components/                         # shadcn/ui React Flow Components (공용)
    ├── base-node.tsx                   # BaseNode 빌딩 블록
    ├── labeled-handle.tsx              # LabeledHandle 빌딩 블록
    └── data-edge.tsx                   # DataEdge 컴포넌트
```

**주요 특징**:
- ✅ **layout.tsx**: 페이지 레이아웃 + 메타 동기화 (Client Component)
- ✅ **page.tsx**: 서버 데이터 로드 + ACL 변환 (Server Component)
- ✅ **canvas-client.tsx**: ReactFlowProvider 래퍼 (Client Component)
- ✅ **canvas-react-flow-wrapper.tsx**: React Flow 인스턴스 + 이벤트 핸들러
- ✅ **ACL 레이어**: DB 데이터 ↔ React Flow 데이터 변환
- ✅ **React Flow SSOT**: React Flow가 position, size, selection 직접 관리
- ✅ **Hook 기반 서버 액션**: Custom Hooks (useCanvasBlockLifecycle, useCanvasBlockTransform, useCanvasEdgeManagement)로 DB 동기화

---

## 📋 문서 변경 이력

### v1.3 (2025-10-19)
- **Context 제거 및 Props 전달 방식 도입**
- CanvasManagementContext 불필요성 분석 및 제거
- Props를 통한 pageId 전달로 단순화
- 실제 코드 구현을 수도 코드 위주로 문서화
- Hook 시그니처를 Props 기반으로 변경
- 검증 체크리스트를 Props 전달 방식에 맞게 업데이트

### v1.2 (2025-10-19)
- **프론트엔드 아키텍처 대폭 업데이트**
- 최신 컴포넌트 계층 구조 반영: `layout.tsx → page.tsx → canvas-client.tsx → canvas-react-flow-wrapper.tsx`
- 서버 컴포넌트/클라이언트 컴포넌트 명확한 분리
- `CanvasClient` 및 `CanvasReactFlowWrapper` 구조 상세 문서화
- Provider 중첩 순서 최신화 (CanvasManagementProvider 미사용 명시)
- 폴더 구조 최신 버전으로 업데이트
- 오래된 컴포넌트 설명 제거 (Canvas, CanvasProvider 등)

### v1.1 (2025-10-19)
- React Flow SSOT 설계 반영
- shadcn/ui React Flow Components 통합

### v1.0 (2025-01-17)
- 초안 작성
- DTO 및 타입 정의
- Context 및 Hooks 설계
- UI 컴포넌트 설계

---

이 Frontend Specification을 따라 **User Flow 기반의 Canvas Management 프론트엔드**를 구현할 수 있습니다! 🎨
