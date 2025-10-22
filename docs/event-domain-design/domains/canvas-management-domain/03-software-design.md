# Software Design: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 시니어개발자 + 아키텍트  
**작성일**: 2025-10-19  
**버전**: v1.1
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `technical-specification.md` (Backend), `user-flow.md` (Frontend)

---

## 📊 Software Design Overview

Canvas Management Domain은 **단일 Bounded Context**로 구성되어 있으며, 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구를 제공하는 핵심 도메인입니다.

### 주요 설계 결정사항

1. **단일 Bounded Context**: 모든 캔버스 관련 기능의 강한 응집성 유지
2. **React Flow ACL**: 외부 라이브러리와의 안전한 통합
3. **State of Truth 전략**: React Flow State (단기) + Database (장기)
4. **3개 핵심 Aggregate**: Block Mount, Edge, Viewport
5. **Read Model Service**: 페이지별 캔버스 데이터 조회 (블럭 마운트 + 엣지 + 뷰포트)

---

## 🔷 Bounded Context 정의

### Canvas Management Context (Core Domain)

**책임**: 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구 제공

**핵심 유비쿼터스 언어**:
- **Canvas**: 페이지별 무한 캔버스 공간
- **Block Mount**: 블럭이 특정 페이지에 배치되는 관계 (위치, 크기, z-order)
- **Edge**: 블럭 간 연결선 (페이지별 존재)
- **Transform**: 블럭의 위치/크기/z-order 변경
- **Snap**: 자동 정렬 기능 (가이드라인 기반)
- **Viewport**: 사용자가 보는 캔버스 영역 (줌, 패닝)

**포함 Aggregate**:
1. **Block Mount Aggregate** - 블럭-페이지 마운팅 관계 관리
2. **Edge Aggregate** - 엣지 연결 관계 관리
3. **Viewport Aggregate** - 뷰포트 상태 관리

**Read Model**:
- **CanvasView** - 페이지별 캔버스 전체 데이터 조회 (블럭 마운트 + 엣지 + 뷰포트)

**외부 연동**:
- **Workspace Management Context**: 페이지 생명주기 이벤트 수신 (Customer-Supplier)
- **Block Management Domain**: 블럭 생성/복제/삭제 협력 + DB JOIN (Partnership)
- **React Flow (External)**: ACL을 통한 렌더링 엔진 통합

---

## 📦 Aggregate 상세 정의

### Block Mount Aggregate

**Root Entity**: BlockMount (식별자: BlockMountId)

**Commands**:
- `MountBlock(pageId: PageId, blockId: BlockId, position: Position, size: Size)`: 블럭을 페이지에 마운트
- `UpdateBlockPosition(blockMountId: BlockMountId, newPosition: Position)`: 블럭 위치 업데이트 (정렬/분포 후 최종 위치)
- `UpdateBlockSize(blockMountId: BlockMountId, newSize: Size)`: 블럭 크기 업데이트
- `UpdateBlockZOrder(blockMountId: BlockMountId, newZOrder: ZOrder)`: 블럭 Z-Order 업데이트
- `MountDuplicatedBlock(originalBlockId: BlockId, newBlockId: BlockId, pageId: PageId)`: Block Domain에서 생성된 복제 블럭 마운팅
- `DeleteBlockMount(blockMountId: BlockMountId)`: 블럭 마운트 해제 (Soft Delete)

**Events**:
- `BlockMounted(blockMountId: BlockMountId, pageId: PageId, blockId: BlockId)`: 블럭이 페이지에 마운트됨
- `BlockPositionUpdated(blockMountId: BlockMountId, newPosition: Position)`: 블럭 위치가 업데이트됨
- `BlockSizeUpdated(blockMountId: BlockMountId, newSize: Size)`: 블럭 크기가 업데이트됨
- `BlockZOrderUpdated(blockMountId: BlockMountId, newZOrder: ZOrder)`: 블럭 Z-Order가 업데이트됨
- `DuplicatedBlockMounted(originalBlockId: BlockId, newBlockMountId: BlockMountId)`: 복제된 블럭이 마운트됨
- `BlockMountDeleted(blockMountId: BlockMountId)`: 블럭 마운트 해제됨

**Invariants**:
- 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
- 하나의 블럭은 여러 페이지에 마운트 가능하지만, 같은 페이지에는 한 번만 마운트 가능
- 새로 생성된 블럭은 최상위 z-order에 배치됨
- 블럭 복제 시 완전히 새로운 블럭 생성 + 새로운 마운트 관계 생성
- 드래그/리사이즈 중에는 React Flow State, 종료 시에만 DB 저장
- 스냅 임계값 5px 이내에서만 자동 정렬 적용
- 중심선 스냅이 가장자리 스냅보다 우선순위 높음
- 다중 선택 시 상대적 순서 유지

**포함 엔티티**:
- `Position` (Value Object): x, y 좌표
- `Size` (Value Object): width, height 크기
- `ZOrder` (Value Object): z-order 값

### Edge Aggregate

**Root Entity**: Edge (식별자: EdgeId)

**Commands**:
- `CreateEdge(pageId: PageId, sourceBlockId: BlockId, targetBlockId: BlockId, edgeType?: EdgeType)`: 블럭 간 연결 엣지 생성
- `UpdateEdgeType(edgeId: EdgeId, newType: EdgeType)`: 엣지 타입 변경
- `UpdateEdgeLabel(edgeId: EdgeId, newLabel: string)`: 엣지 레이블 변경
- `UpdateEdgeStyle(edgeId: EdgeId, newStyle: EdgeStyle)`: 엣지 스타일 변경
- `DeleteEdge(edgeId: EdgeId)`: 엣지 삭제
- `DeleteConnectedEdges(pageId: PageId, blockId: BlockId)`: 블럭 삭제 시 연결된 엣지들 일괄 삭제

**Events**:
- `EdgeCreated(edgeId: EdgeId, pageId: PageId, sourceBlockId: BlockId, targetBlockId: BlockId)`: 엣지가 생성됨
- `EdgeTypeChanged(edgeId: EdgeId, newType: EdgeType)`: 엣지 타입이 변경됨
- `EdgeLabelChanged(edgeId: EdgeId, newLabel: string)`: 엣지 레이블이 변경됨
- `EdgeStyleChanged(edgeId: EdgeId, newStyle: EdgeStyle)`: 엣지 스타일이 변경됨
- `EdgeDeleted(edgeId: EdgeId)`: 엣지가 삭제됨
- `ConnectedEdgesDeleted(pageId: PageId, blockId: BlockId, deletedEdgeIds: EdgeId[])`: 연결된 엣지들이 삭제됨

**Invariants**:
- 엣지는 특정 페이지에서만 존재함
- 같은 블럭 쌍이라도 페이지마다 다른 엣지 설정 가능
- 자기 자신으로의 엣지(self-loop) 허용
- 블럭 삭제 시 연결된 모든 엣지 자동 삭제 (트랜잭션 단위)
- 엣지 타입은 React Flow 기본 타입만 허용 (default, straight, step, smoothstep, simplebezier)

**포함 엔티티**:
- `EdgeConnection` (Value Object): sourceBlockId, targetBlockId
- `EdgeType` (Value Object): React Flow 기본 타입 (default, straight, step, smoothstep, simplebezier)
- `EdgeStyle` (Value Object): 색상, 두께, 화살표 스타일

### Viewport Aggregate

**Root Entity**: Viewport (식별자: ViewportId = PageId와 1:1 매핑)

**Commands**:
- `UpdateViewport(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트 줌/패닝 상태 업데이트
- `SaveViewportState(viewportId: ViewportId)`: 뷰포트 상태 저장
- `RestoreViewportState(viewportId: ViewportId)`: 뷰포트 상태 복원

**Events**:
- `ViewportUpdated(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트가 업데이트됨
- `ViewportStateSaved(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트 상태가 저장됨
- `ViewportStateRestored(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트 상태가 복원됨

**Invariants**:
- 줌 레벨은 최소/최대 제한 범위 내에서만 가능
- 페이지 이탈 시에만 뷰포트 상태 자동 저장
- 페이지 재진입 시 이전 뷰포트 상태 자동 복원
- React Flow 애니메이션을 통한 부드러운 전환 보장

**포함 엔티티**:
- `ZoomLevel` (Value Object): 줌 레벨 값 (최소/최대 제한)
- `ViewportCenter` (Value Object): 중심 좌표 (x, y)

---

## 🎨 Frontend Events (React Flow 연동)

### React Flow 자동 처리 이벤트
**처리 방식**: React Flow Store가 자동으로 관리, 서버 연동 불필요

- `BlockSelected(blockId: BlockId)`: 블럭 선택 (React Flow Store)
- `MultipleBlocksSelected(blockIds: BlockId[])`: 다중 선택 (React Flow Store)
- `ViewportZoomed(zoomLevel: number)`: 줌 변경 (React Flow Store)
- `ViewportPanned(center: ViewportCenter)`: 패닝 (React Flow Store)
- `SnapGuidelinesShown(guidelines: Guideline[])`: 스냅 가이드 표시
- `MinimapToggled(isVisible: boolean)`: 미니맵 표시/숨김

### React Flow 콜백 이벤트
**처리 방식**: React Flow 자동 처리 + 콜백으로 서버 연동

- `BlockDragStarted(blockId: BlockId)`: 드래그 시작 → React Flow 자동 처리 (`onNodeDrag`)
- `BlockDragEnded(blockId: BlockId, finalPosition: Position)`: 드래그 종료 → 서버 연동 (`onNodeDragStop`)
- `BlockResizeStarted(blockId: BlockId)`: 리사이즈 시작 → React Flow 자동 처리 (`onNodeResize`)
- `BlockResizeEnded(blockId: BlockId, finalSize: Size)`: 리사이즈 종료 → 서버 연동 (`onNodeResizeEnd`)
- `EdgeCreationStarted(sourceBlockId: BlockId)`: 엣지 생성 시작 → React Flow 자동 처리 (`onConnect` 시작)
- `EdgeCreationEnded(sourceBlockId: BlockId, targetBlockId: BlockId)`: 엣지 생성 완료 → 서버 연동 (`onConnect` 완료)
- `BlockDeletionStarted(blockIds: BlockId[])`: 삭제 키 입력 → React Flow 자동 처리 (`onNodesDelete` 콜백)

### Optimistic UI 이벤트
**처리 방식**: 즉시 React Flow에 추가 + 서버 연동 + 실패 시 롤백

- `BlockCreationStarted(blockType: string, position: Position)`: 블럭 생성 시작 → 즉시 React Flow에 추가
- `BlockCreationCompleted(blockId: BlockId)`: 서버 연동 완료
- `BlockCreationFailed(error: Error)`: 서버 실패 → React Flow에서 제거
- `BlockDuplicationStarted(originalBlockId: BlockId, position: Position)`: 블럭 복제 시작 → 즉시 React Flow에 추가
- `BlockDuplicationCompleted(newBlockId: BlockId)`: 서버 연동 완료
- `BlockDuplicationFailed(error: Error)`: 서버 실패 → React Flow에서 제거
- `BlockDeletionStarted(blockId: BlockId)`: 툴바 버튼 삭제 시작 → 즉시 React Flow에서 제거
- `BlockDeletionCompleted(blockId: BlockId)`: 서버 연동 완료
- `BlockDeletionFailed(error: Error, blockId: BlockId)`: 서버 실패 → React Flow에 블럭 복원


---

## 🪝 Frontend Hooks (React Flow 연동)

### useCanvasBlockLifecycle() - Layer 1 (블럭 생명주기 관리)
**역할**: 블럭 생성, 복제, 삭제의 Optimistic UI 처리
**의존성**: React Flow Store (UI 즉시 반영용), 서버 액션 (영구 저장용)
**테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

**Optimistic UI 제어** (사용자 액션, AI Tool Call):
- `createBlock(blockType: string, position: Position)`: 즉시 React Flow에 노드 추가 → 서버 액션 호출 → 실패 시 롤백
- `duplicateBlock(originalBlockId: BlockId, position: Position)`: 즉시 React Flow에 노드 추가 → 서버 액션 호출 → 실패 시 롤백
- `deleteBlock(blockId: BlockId)`: 툴바 버튼 삭제 → 즉시 React Flow에서 제거 → 서버 액션 호출 → 실패 시 복원
- `handleBlockDeletion(blockIds: BlockId[])`: React Flow 콜백 삭제 → 즉시 React Flow에서 제거 → 서버 액션 호출 → 실패 시 복원

**프로그램적 제어** (UI만 변경, 서버 호출 X):
- `addBlockToCanvas(blockId: BlockId, blockData: BlockData)`: React Flow Store에만 노드 추가 (서버 저장 X)
- `removeBlockFromCanvas(blockId: BlockId)`: React Flow Store에서만 노드 제거 (서버 저장 X)

**상태 읽기**:
- `getAllBlocks()`: 모든 블럭 정보 반환
- `getBlockById(blockId: BlockId)`: 특정 블럭 정보 반환
- `getBlockCount()`: 현재 블럭 개수 반환

### useCanvasBlockTransform() - Layer 2 (블럭 변형 관리)
**역할**: 블럭 위치, 크기, Z-Order 변경 처리
**의존성**: React Flow Store (프로그램적 제어용), 서버 액션 (영구 저장용)
**테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

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
  - `alignBlocks()`, `distributeBlocks()`에서 내부적으로 사용

**통합 메소드** (프로그램적 제어 + 서버 저장):
- `updateBlockPosition(blockId: BlockId, position: Position, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장
- `updateBlockSize(blockId: BlockId, size: Size, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장
- `updateBlockZOrder(blockId: BlockId, zOrder: ZOrder, saveToServer: boolean = true)`: UI 업데이트 + 옵션으로 서버 저장

### useCanvasViewport()
**역할**: 뷰포트 상태 관리 (React Flow Store 활용)
**React Flow 연동**:
**수동 제어** (AI Tool Call, 프로그램적 제어용):
- `zoomIn()`, `zoomOut()`: React Flow Store 직접 조작
- `panTo(center: Position)`: React Flow Store 직접 조작
- `fitToScreen()`: React Flow Store 직접 조작
- `resetZoom()`: React Flow Store 직접 조작

**상태 읽기**:
- `getZoomLevel()`: 현재 줌 레벨 반환
- `getViewportCenter()`: 현재 뷰포트 중심 좌표 반환
- `getViewportBounds()`: 현재 뷰포트 경계 반환

### useCanvasSelection()
**역할**: 블럭 선택 상태 관리 (React Flow Store 활용)
**React Flow 연동**:
**수동 제어** (AI Tool Call, 프로그램적 제어용):
- `selectBlock(blockId: BlockId)`: React Flow Store의 선택 상태 조작
- `selectMultiple(blockIds: BlockId[])`: 다중 선택 상태 관리
- `clearSelection()`: 선택 해제
- `selectAll()`: 모든 블럭 선택

**상태 읽기**:
- `getSelectedBlocks()`: 현재 선택된 블럭 ID 목록 반환
- `isSelected(blockId: BlockId)`: 특정 블럭 선택 여부 확인
- `getSelectionCount()`: 선택된 블럭 개수 반환

### useCanvasSnapGuides()
**역할**: 스냅 가이드라인 계산 및 표시
**React Flow 연동**:
- `calculateSnapGuides(draggedBlockId: BlockId, position: Position)`: 드래그 중 실시간 계산
- `applySnap(blockId: BlockId, snapPosition: Position)`: 스냅 적용 시 위치 조정
- `showGuidelines(guidelines: Guideline[])`: 가이드라인 표시
- `hideGuidelines()`: 가이드라인 숨김

### useCanvasMode()
**역할**: 캔버스 인터랙션 모드 관리 (비즈니스 로직)
**의존성**: React State (독립적인 모드 상태 관리)
**테스트 환경**: React 상태 Mock만 필요

**모드 타입**:
```typescript
type CanvasMode = 
  | { type: 'default' }                                    // 초기 모드 (노드 선택/이동 가능)
  | { type: 'block-creation', blockType: string }          // 블럭 추가 모드 (스켈레톤 그림자 표시)
  | { type: 'single-selection', blockId: BlockId }         // 단일 선택 모드 (노드 툴바 표시)
  | { type: 'multi-selection', blockIds: BlockId[] }       // 복수 선택 모드 (복수 선택 툴바 표시)
  | { type: 'block-editing', blockId: BlockId }            // 단일 블럭 편집 모드 (에디터 패널 표시)
  | { type: 'dragging', blockIds: BlockId[] }              // 드래그 중 (스냅 가이드 활성화)
  | { type: 'edge-creation', sourceBlockId: BlockId }      // 엣지 생성 중
```

**모드 전환**:
- `enterBlockCreationMode(blockType: string)`: 블럭 추가 모드 진입 → 도구바에서 블럭 타입 선택 시
- `enterSingleSelectionMode(blockId: BlockId)`: 단일 선택 모드 진입 → 블럭 클릭 시
- `enterMultiSelectionMode(blockIds: BlockId[])`: 복수 선택 모드 진입 → 다중 선택 시
- `enterBlockEditingMode(blockId: BlockId)`: 블럭 편집 모드 진입 → 블럭 더블 클릭 시
- `enterDraggingMode(blockIds: BlockId[])`: 드래그 모드 진입 → 드래그 시작 시
- `enterEdgeCreationMode(sourceBlockId: BlockId)`: 엣지 생성 모드 진입 → 엣지 핸들 클릭 시
- `exitToDefaultMode()`: 기본 모드로 복귀 → ESC 키, 캔버스 빈 곳 클릭 시

**상태 읽기**:
- `getCurrentMode()`: 현재 모드 반환
- `isBlockCreationMode()`: 블럭 추가 모드 여부
- `isSingleSelectionMode()`: 단일 선택 모드 여부
- `isMultiSelectionMode()`: 복수 선택 모드 여부
- `isBlockEditingMode()`: 블럭 편집 모드 여부
- `isDraggingMode()`: 드래그 중 여부
- `isEdgeCreationMode()`: 엣지 생성 중 여부

**모드별 UI 렌더링 조건**:
- `block-creation`: 스켈레톤 그림자 블럭 표시, 캔버스 클릭 시 블럭 생성
- `single-selection`: 노드 툴바 표시, 노드 내용 편집 가능 (텍스트 영역 활성화 등)
- `multi-selection`: 복수 선택 툴바 표시 (정렬, 그룹화 등)
- `block-editing`: 에디터 패널 표시 (상세 편집)
- `dragging`: 스냅 가이드라인 표시 (5px 임계값)
- `edge-creation`: 엣지 프리뷰 표시

### useCanvasEdgeManagement()
**역할**: 엣지 생성 및 관리 (React Flow 연동)
**의존성**: React Flow Store (UI 즉시 반영용), 서버 액션 (영구 저장용)
**테스트 환경**: React Flow 훅 Mock + 서버 액션 Mock

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

---

## 🛡️ Anti-Corruption Layer

### React Flow ACL

**목적**: React Flow 라이브러리의 데이터 구조와 도메인 모델 간 변환

**위치**: `src/domains/canvas-management/infrastructure/ReactFlowAdapter.ts`

**변환 규칙**:
```typescript
// React Flow Node ↔ Block Mount 변환
interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface BlockMountDomainModel {
  blockMountId: BlockMountId;
  blockId: BlockId;
  position: Position;
  size: Size;
  zOrder: ZOrder;
}

// React Flow Edge ↔ Edge 변환
interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  style?: any;
}

interface EdgeDomainModel {
  edgeId: EdgeId;
  sourceBlockId: BlockId;
  targetBlockId: BlockId;
  edgeType: EdgeType;
  edgeStyle: EdgeStyle;
}
```

**주요 변환 로직**:
- React Flow Node → Block Mount: `toDomainBlockMount(node: ReactFlowNode)`
- Block Mount → React Flow Node: `toReactFlowNode(mount: BlockMount)`
- React Flow Edge → Edge: `toDomainEdge(edge: ReactFlowEdge)`
- Edge → React Flow Edge: `toReactFlowEdge(edge: Edge)`

**에러 처리**: React Flow 렌더링 오류를 도메인 예외로 변환, 상태 동기화 실패 시 재시도 로직

### Workspace Management ACL

**목적**: Workspace Management Domain의 페이지 이벤트를 캔버스 도메인 이벤트로 변환

**위치**: `src/domains/canvas-management/infrastructure/WorkspaceManagementAdapter.ts`

**변환 규칙**:
- `PageCreated(pageId: PageId)` → `CanvasInitializationRequired(pageId: PageId)`
- `PageDeleted(pageId: PageId)` → `CanvasCleanupRequired(pageId: PageId)`

### Block Management Domain ACL

**목적**: Block Management Domain과의 블럭 생성/복제/삭제 협력

**위치**: `src/domains/canvas-management/application/BlockManagementService.ts`

**통합 방식**: Server Actions 호출 + DB JOIN 조회
- 블럭 생성: `createBlockAction(workspaceId, blockType, initialMetadata)`
- 블럭 복제: `duplicateBlockAction(blockId)` → 완전히 새로운 블럭 생성
- 블럭 삭제: `deleteBlockAction(blockId)` → Soft Delete 처리
- 블럭 조회: `block_mounts JOIN blocks` 쿼리로 직접 조회

---

## 🗺️ Context Map

### Context Relationships

```
Workspace Management Context (Upstream)
        ↓ [Customer-Supplier + Event]
Canvas Management Context (Core)
        ↓ [Partnership + Server Actions + DB JOIN]
Block Management Context (Supporting)
```

### Integration Points



**Canvas Management → Block Management**:
- **패턴**: Partnership (동반자 관계)
- **방향**: 양방향 협력
- **인터페이스**: 
  - Canvas → Block: `createBlockAction`, `duplicateBlockAction`, `deleteBlockAction` 호출
  - Block → Canvas: DB JOIN (`block_mounts JOIN blocks`) 직접 조회
- **통합 방식**: Server Actions (CRUD) + DB JOIN (조회)
- **공유 인프라**: 동일한 Database, RLS 정책, 워크스페이스 격리

**Canvas Management → React Flow**:
- **패턴**: Anti-Corruption Layer
- **방향**: Canvas Management → React Flow (외부 라이브러리)
- **인터페이스**: ReactFlowAdapter를 통한 데이터 변환
- **통합 방식**: ACL 패턴으로 도메인 모델 보호
- **State Strategy**: React Flow State (단기) + Database (장기)

---

## 📖 Read Models (Query Side)

### CanvasView (Scenario 0)

**목적**: 페이지 접근 시 캔버스 전체 상태 조회 (블럭, 엣지, 뷰포트 정보)

```typescript
interface CanvasView {
  pageId: PageId;                   // 페이지 ID
  blocks: BlockMountView[];         // 페이지에 마운트된 블럭 목록
  edges: EdgeView[];                // 페이지 내 엣지 목록
  viewport: ViewportView;           // 뷰포트 상태
  totalBlockCount: number;          // 전체 블럭 개수
  totalEdgeCount: number;           // 전체 엣지 개수
}

interface BlockMountView {
  blockMountId: BlockMountId;       // 블럭 마운트 ID
  blockId: BlockId;                 // 블럭 ID
  position: Position;               // 블럭 위치 (x, y)
  size: Size;                       // 블럭 크기 (width, height)
  zOrder: ZOrder;                   // Z-Order 값
  blockType: string;                // 블럭 타입 (Block Domain에서 제공)
  blockData: any;                   // 블럭 속성 (Block Domain에서 제공)
  createdAt: Date;                  // 마운트 생성 시간
  updatedAt: Date;                  // 마운트 수정 시간
}

interface EdgeView {
  edgeId: EdgeId;                   // 엣지 ID
  sourceBlockId: BlockId;           // 소스 블럭 ID
  targetBlockId: BlockId;           // 타겟 블럭 ID
  edgeType: EdgeType;               // 엣지 타입 (React Flow 기본 타입: default, straight, step, smoothstep, simplebezier)
  edgeLabel?: string;               // 엣지 레이블
  edgeStyle: EdgeStyle;             // 엣지 스타일 (색상, 두께, 화살표)
  createdAt: Date;                  // 엣지 생성 시간
  updatedAt: Date;                  // 엣지 수정 시간
}

interface ViewportView {
  viewportId: ViewportId;           // 뷰포트 ID (= PageId)
  zoomLevel: ZoomLevel;             // 줌 레벨
  center: ViewportCenter;           // 뷰포트 중심 좌표 (x, y)
  lastSaved: Date;                  // 마지막 저장 시간
  isRestored: boolean;              // 복원 여부
}
```

**Query Handler 책임** (Read Model Service):
- Canvas Aggregate에서 페이지별 캔버스 상태 조회
- Block Mount Aggregate에서 페이지에 마운트된 블럭 목록 조회 (z-order 정렬)
- Edge Aggregate에서 페이지 내 엣지 목록 조회
- Viewport Aggregate에서 뷰포트 상태 조회
- Block Domain Service 호출하여 블럭 타입 및 속성 정보 결합
- React Flow Adapter를 통한 데이터 변환
- 캔버스 접근 권한 검증 (Workspace Management 협력)

**최적화 포인트**:
- 페이지별 캐싱 (Redis, TTL: 5분)
- 블럭/엣지 변경 시 캐시 무효화 (Invalidation)
- 블럭 개수가 많은 경우 (100개 이상): 가상화 또는 청크 로딩 (미래)
- z-order 정렬은 DB에서 처리 (ORDER BY z_order DESC)
- Block Domain 조회는 배치로 처리 (N+1 방지)

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 도메인을 조율하는 **업무 진행 책임자**입니다.

### CanvasManagementService (Service Layer)

**역할**: Canvas, Block Mount, Edge, Viewport Aggregate를 조율하고, Workspace Management, Block Domain, React Flow와 통합

**주요 책임** (Scenario 0~9):
- **Scenario 1**: 블럭 생성 및 마운팅
- **Scenario 2**: 블럭 변환 (이동, 리사이즈, Z-Order)
- **Scenario 3**: 블럭 복제
- **Scenario 4**: 블럭 선택 및 다중 선택
- **Scenario 5**: 블럭 정렬 도구
- **Scenario 6**: 스마트 가이드 & 스냅
- **Scenario 7**: 엣지 생성 및 관리
- **Scenario 8**: 블럭 삭제 및 엣지 정리
- **Scenario 9**: 캔버스 뷰포트 관리

---

### 업무 시나리오 연결 (Scenario 0: 외부 도메인과의 동기화)

#### Sequence 1: 페이지 접근 시 캔버스 로드 (Read Model)
- 사용자가 페이지에 접근 (새 페이지 또는 기존 페이지):
  1. **Server Component**가 **Server Action** 호출: `getCanvasViewAction(pageId, userId)`
  2. **Server Action**이 **Read Model Service** 호출:
     - Workspace Management Domain Repository 호출: 페이지 접근 권한 확인
     - 권한이 없으면 → 접근 거부 에러 반환
     - BlockMountRepository에서 마운트된 블럭 목록 조회 (z-order 정렬)
     - EdgeRepository에서 엣지 목록 조회
     - ViewportRepository에서 뷰포트 상태 조회
     - Block Domain Service 배치 호출: 블럭 타입 및 속성 정보 가져오기 (DB JOIN)
     - Read Model Service가 모든 결과를 조합하여 `CanvasView` 생성
     - React Flow Adapter를 통해 React Flow 형식으로 변환
  3. **Server Action**이 `CanvasView` 반환
  4. **Server Component**가 캔버스 렌더링
  5. **Frontend**가 React Flow로 블럭/엣지 표시 (React Flow Store에 데이터 로드)

**규칙 준수 확인** (Scenario 0):
- ✅ 페이지 접근 권한 확인 필수
- ✅ React Flow 인스턴스는 Frontend에서 자체 생성
- ✅ 기존 페이지는 모든 블럭/엣지 복원 (React Flow Store에 로드), 새 페이지는 빈 캔버스 표시
- ✅ 뷰포트 상태 자동 복원

**외부 파트너 연동** (Scenario 0):
- **Workspace Management Domain**: 동기 호출로 페이지 접근 권한 확인
  - Repository 호출: `pageRepository.verifyPageAccess(pageId, userId)`
  - 성공: 페이지 정보 반환
  - 실패: 네트워크 오류 → 접근 거부 (Fail-safe)
- **Block Domain**: 동기 호출로 블럭 타입 및 속성 정보 조회
  - Service 주입: `BlockDomainService.getBlocksByIds(blockIds[])`
  - 배치 처리로 N+1 방지
- **React Flow**: ACL을 통한 데이터 변환
  - ReactFlowAdapter: Domain Model ↔ React Flow 형식 변환
  - State 동기화: React Flow State (단기) + Database (장기)

**실패 대응 전략** (Scenario 0):
- Workspace Management API 장애 시:
  - 사용자에게 "페이지를 불러올 수 없습니다" 안내
  - 접근 거부 처리 (보안 우선)
- Block Domain API 장애 시:
  - 블럭 마운트 정보는 표시, 블럭 속성은 "로딩 실패" 표시
  - Graceful Degradation (전체 페이지는 로드됨)
- React Flow 초기화 실패 시:
  - "캔버스를 초기화할 수 없습니다. 새로고침 해주세요" 안내
  - 재시도 버튼 제공

---

### 업무 시나리오 연결 (Scenario 1: 블럭 생성 및 마운팅)

#### Sequence 1: 사용자가 새 블럭을 생성 (Optimistic UI 패턴)
- 사용자가 도구바에서 블럭 타입 선택:
  1. **Frontend Hook** (`useCanvasMode`)이 **모드 전환**:
     - `enterBlockCreationMode(blockType)` 호출
     - 캔버스 모드: `default` → `block-creation`
  2. **UI 반응**:
     - 마우스 커서를 따라다니는 스켈레톤 그림자 블럭 표시
     - 캔버스 빈 곳 클릭 대기
- 사용자가 캔버스 빈 곳 클릭:
  3. **Frontend Hook** (`useCanvasBlockLifecycle`)이 **Optimistic UI** 처리:
     - 즉시 React Flow Store에 임시 노드 추가 (임시 ID 사용)
     - 사용자에게 즉시 시각적 피드백 제공
     - `useCanvasMode`가 모드 전환: `block-creation` → `single-selection`
  4. **동시에 Server Action** 호출: `createBlockAction(pageId, blockType, position, userId)`
  5. **Server Action**이 **Service** 호출:
     - Workspace Management Domain Repository 호출: 페이지 접근 권한 확인
     - 권한이 없으면 → 접근 거부 에러 반환
     - Block Management Domain 호출: 블럭 생성 요청
       - `createBlockAction(workspaceId, blockType, initialMetadata)`
       - Block Management Domain이 blocks 테이블에 블럭 생성
       - 생성된 블럭 ID 반환
     - Block Mount Aggregate: 생성된 블럭을 페이지에 마운트
       - `MountBlock(pageId, blockId, position, size)`
       - Z-Order 최상위로 설정 (현재 최대값 + 1)
       - BlockMounted 이벤트 발행
  6. **서버 성공 시**: Frontend가 임시 노드를 실제 블럭으로 교체
  7. **서버 실패 시**: Frontend가 임시 노드를 제거하고 에러 표시, 모드 `default`로 복귀

**규칙 준수 확인** (Scenario 1):
- ✅ Block Domain에서 타입 검증
- ✅ 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
- ✅ 새 블럭은 Z-Order 최상위로 배치
- ✅ 초기 위치는 클릭한 좌표, 초기 크기는 블럭 타입별 기본값

---

### 업무 시나리오 연결 (Scenario 2: 블럭 변환)

#### Sequence 1~2: 블럭 드래그 이동 및 위치 확정 (React Flow 콜백 패턴)
- 사용자가 블럭을 드래그 시작:
  1. **Frontend Hook** (`useCanvasMode`)이 **모드 전환**:
     - `onNodeDragStart` 콜백 트리거
     - `enterDraggingMode(blockIds)` 호출
     - 캔버스 모드: `single-selection` or `multi-selection` → `dragging`
- 사용자가 블럭을 드래그 중:
  2. **Frontend Hook** (`useCanvasBlockTransform`)이 **React Flow 콜백** 처리:
     - React Flow가 실시간 위치 업데이트 (State만 자동 변경, DB 저장 X)
  3. **Frontend Hook** (`useCanvasSnapGuides`)이 **스냅 가이드** 처리:
     - `isDraggingMode()` 확인 → 드래그 모드일 때만 활성화
     - 스냅 가이드라인 계산 (5px 임계값)
     - 가이드라인 표시 (중심선 > 가장자리 우선순위)
- 사용자가 드래그 종료:
  4. **Frontend Hook** (`useCanvasBlockTransform`)이 **React Flow 콜백** 트리거:
     - `onNodeDragStop` 콜백으로 `saveBlockPosition(blockId, finalPosition)` 호출 (서버 저장)
  5. **Frontend Hook** (`useCanvasMode`)이 **모드 복귀**:
     - 캔버스 모드: `dragging` → `single-selection` or `multi-selection`
  6. **Server Action** 호출: `updateBlockPositionAction(blockMountId, finalPosition, userId)`
  7. **Server Action**이 **Service** 호출:
     - Block Mount Aggregate: 위치 업데이트
       - `UpdateBlockPosition(blockMountId, newPosition)`
       - BlockPositionUpdated 이벤트 발행
     - DB 저장 (마운트 정보 업데이트)
  8. **Frontend**가 최종 위치 표시 (React Flow State는 이미 업데이트됨)

**규칙 준수 확인** (Scenario 2):
- ✅ 드래그 중에는 React Flow State만 변경
- ✅ 드래그 종료 시에만 DB 저장
- ✅ 스냅 임계값 5px 이내 자동 정렬
- ✅ 중심선 스냅 우선순위 높음

---

### 업무 시나리오 연결 (Scenario 3: 블럭 복제)

#### Sequence 1: 블럭 복제 요청
- 사용자가 블럭 복제 버튼 클릭:
  1. **Client Component**가 **Server Action** 호출: `duplicateBlockAction(originalBlockId, pageId, userId)`
  2. **Server Action**이 **Service** 호출:
     - Workspace Management Domain Repository 호출: 페이지 접근 권한 확인
     - Block Management Domain 호출: 블럭 복제 요청
       - `duplicateBlockAction(originalBlockId)`
       - Block Management Domain이 blocks 테이블에 완전히 새로운 블럭 생성 (새로운 블럭 ID)
       - 복제된 블럭 ID 반환
     - Block Mount Aggregate: 복제된 블럭을 페이지에 마운트
       - `MountDuplicatedBlock(originalBlockId, newBlockId, pageId)`
       - 원본 근처 위치로 오프셋 적용 (x+20, y+20)
       - Z-Order 최상위로 설정
       - DuplicatedBlockMounted 이벤트 발행
  3. **Frontend**가 복제된 블럭 표시

**규칙 준수 확인** (Scenario 3):
- ✅ Block Management Domain에서 완전히 새로운 블럭 생성
- ✅ 복제된 블럭은 원본 근처 위치에 새로운 마운트로 배치
- ✅ Z-Order 최상위로 배치

---

### 업무 시나리오 연결 (Scenario 5: 블럭 정렬 도구)

#### Sequence 1~2: 다중 선택된 블럭들 정렬 및 균등 분포
- 사용자가 정렬 도구 버튼 클릭:
  1. **Frontend Hook** (`useCanvasMode`)이 **상태 확인**:
     - `isMultiSelectionMode()` 확인 → 복수 선택 상태 검증
     - 정렬 가능 여부 확인 (2개 이상 블럭 선택)
  2. **Frontend Hook** (`useCanvasBlockTransform`)이 **정렬 실행**:
     - `alignBlocks(selectedBlockIds, alignmentType)` 호출
     - 선택된 블럭들의 현재 위치 조회
     - 정렬 알고리즘 실행 (좌정렬, 우정렬, 상단정렬 등)
     - 새로운 위치 좌표 계산 및 UI 즉시 반영
     - 사용자에게 정렬된 결과 즉시 표시
  3. **동시에 Server Action 호출**: `updateBlockPositionsAction(blockPositions[], userId)`
  4. **Server Action**이 **Service** 호출:
     - 각 블럭의 새로운 위치값만 검증 후 일괄 업데이트
     - Block Mount Aggregate: 위치 업데이트 (계산 로직 없음)
       - `UpdateBlockPosition(blockMountId, newPosition)` 반복 호출
       - BlockPositionUpdated 이벤트들 발행
     - DB 저장 (마운트 정보 일괄 업데이트)

**규칙 준수 확인** (Scenario 5):
- ✅ 다중 선택된 블럭들만 정렬 가능
- ✅ 프론트엔드에서 위치 계산 완료 후 서버에 최종 위치값만 전달
- ✅ UI 즉시 반영 (Optimistic Update 패턴)
- ✅ 서버는 위치값 검증 및 저장만 담당

---

### 업무 시나리오 연결 (Scenario 7: 엣지 생성 및 관리)

#### Sequence 1~2: 엣지 생성 및 연결 확정
- 사용자가 블럭 연결 핸들을 드래그:
  1. **Frontend**에서 엣지 생성 시작:
     - React Flow가 연결 가능한 블럭 표시
     - 드래그 중 엣지 프리뷰 표시
  2. **드롭 완료** 시 **Server Action** 호출: `createEdgeAction(pageId, sourceBlockId, targetBlockId, edgeType, userId)`
  3. **Server Action**이 **Service** 호출:
     - Edge Aggregate: 엣지 생성
       - `CreateEdge(pageId, sourceBlockId, targetBlockId, edgeType)`
       - 블럭 존재 확인
       - 페이지별 엣지 저장
       - EdgeCreated 이벤트 발행
     - React Flow State에 엣지 추가
  4. **Frontend**가 엣지 표시

**규칙 준수 확인** (Scenario 7):
- ✅ 엣지는 특정 페이지에서만 존재
- ✅ 자기 자신으로의 엣지(self-loop) 허용
- ✅ 블럭 삭제 시 연결된 모든 엣지 자동 삭제

---

### 업무 시나리오 연결 (Scenario 8: 블럭 삭제 및 엣지 정리)

#### Sequence 1: 툴바 버튼 삭제 (Soft Delete)
- 사용자가 블럭 툴바에서 삭제 버튼 클릭:
  1. **Frontend Hook** (`useCanvasBlockLifecycle`)이 **Optimistic UI** 처리:
     - `deleteBlock(blockId)` 호출
     - 즉시 React Flow에서 블럭 제거 (시각적 피드백)
  2. **동시에 Server Action** 호출: `deleteBlockAction(blockId, userId)`
  3. **Server Action**이 **Service** 호출:
     - Canvas Management: 해당 블럭의 모든 마운트 관계 해제
       - `DeleteAllBlockMounts(blockId)` - 모든 페이지에서 마운트 해제
       - BlockMountDeleted 이벤트 발행 (모든 페이지)
     - Canvas Management: 연결된 모든 엣지 일괄 삭제
       - `DeleteConnectedEdges(blockId)` - 모든 페이지에서 연결된 엣지 삭제
       - ConnectedEdgesDeleted 이벤트 발행
     - Block Management Domain 호출: 블럭 Soft Delete
       - `deleteBlockAction(blockId)` → blocks 테이블에 deleted_at 설정
  4. **서버 성공 시**: 삭제 완료, **서버 실패 시**: React Flow에 블럭 복원

#### Sequence 2: 키보드 단축키 삭제 (React Flow 콜백)
- 사용자가 블럭 선택 후 Delete/Backspace 키 입력:
  1. **React Flow**가 **자동 처리**:
     - `deleteKeyCode={['Delete', 'Backspace']}` 설정으로 삭제 키 감지
     - 선택된 블럭들을 React Flow에서 자동 제거
  2. **React Flow 콜백** 트리거: `onNodesDelete` 호출
  3. **Frontend Hook** (`useCanvasBlockLifecycle`)이 **콜백 처리**:
     - `handleBlockDeletion(blockIds[])` 호출
     - 서버 액션으로 영구 삭제 처리 (이미 UI에서 제거됨)
  4. **Server Action** 호출: `deleteBlockAction(blockId, userId)` (각 블럭별)
  5. **Server Action**이 **Service** 호출 (Sequence 1과 동일한 처리)

**규칙 준수 확인** (Scenario 8):
- ✅ **툴바 삭제**: Optimistic UI 패턴으로 즉시 시각적 피드백 + 서버 연동 + 실패 시 롤백
- ✅ **키보드 삭제**: React Flow 콜백 패턴으로 UI 자동 처리 + 서버 연동으로 영구 저장
- ✅ 블럭 삭제 시 모든 페이지에서 마운트 관계 해제
- ✅ 블럭 삭제 시 모든 페이지에서 연결된 엣지 자동 삭제 (트랜잭션)
- ✅ Block Management Domain에서 Soft Delete 처리

---

### 업무 시나리오 연결 (Scenario 9: 캔버스 뷰포트 관리)

#### Sequence 1~3: 캔버스 줌/패닝 및 뷰포트 상태 저장/복원 (React Flow Store 중심)
- 사용자가 마우스 휠로 줌 조작:
  1. **Frontend Hook** (`useCanvasViewport`)이 **React Flow Store** 직접 조작:
     - React Flow Store가 실시간 뷰포트 업데이트 (State만 변경)
     - 줌 레벨 제한 적용 (최소/최대)
     - 서버 연동 없이 즉시 UI 반영
  2. **페이지 이탈 시** **Server Action** 호출: `saveViewportStateAction(pageId, zoomLevel, center, userId)`
  3. **Server Action**이 **Service** 호출:
     - Viewport Aggregate: 뷰포트 상태 저장
       - `SaveViewportState(viewportId)`
       - ViewportStateSaved 이벤트 발행
  4. **페이지 재진입 시** **Server Action** 호출: `restoreViewportStateAction(pageId, userId)`
  5. **Server Action**이 **Service** 호출:
     - Viewport Aggregate: 뷰포트 상태 복원
       - `RestoreViewportState(viewportId)`
       - ViewportStateRestored 이벤트 발행
  6. **Frontend**가 복원된 뷰포트 상태를 React Flow Store에 적용
     - React Flow 애니메이션을 통한 부드러운 전환

**규칙 준수 확인** (Scenario 9):
- ✅ 페이지 이탈 시에만 뷰포트 상태 자동 저장
- ✅ 페이지 재진입 시 이전 뷰포트 상태 복원
- ✅ 줌 레벨 최소/최대 제한

---

### 외부 파트너 연동 (종합)

**Workspace Management Domain**: 동기 호출로 페이지 접근 권한 확인
- Repository 주입: 페이지 접근 권한 조회
- 통합 방식: Service Layer 직접 호출
- 실패 전략: Fail-safe (접근 거부)

**Block Management Domain**: Server Actions 호출 및 DB JOIN 조회
- Server Actions: 블럭 생성(`createBlockAction`), 복제(`duplicateBlockAction`), 삭제(`deleteBlockAction`)
- DB JOIN: `block_mounts JOIN blocks` 쿼리로 블럭 정보 직접 조회
- 통합 방식: Server Actions (CRUD) + DB JOIN (조회)
- 실패 전략: Graceful Degradation (블럭 생성/복제 실패 시 에러 표시, 조회 실패 시 기본값 사용)

**React Flow (외부 라이브러리)**: ACL을 통한 데이터 변환
- 통합 방식: ReactFlowAdapter를 통한 ACL 패턴
- State 전략: React Flow State (단기 SoT) + Database (장기 SoT)
- 실패 전략: React Flow 초기화 실패 시 재시도 안내

---

### 실패 대응 전략 (종합)

**권한 검증 실패 시**:
- 사용자에게 "페이지 접근 권한이 없습니다" 안내
- 접근 거부 처리 (보안 우선)

**Block Management Domain 장애 시**:
- 블럭 생성/복제/삭제 실패: "블럭을 처리할 수 없습니다. 다시 시도해주세요" 안내
- 블럭 정보 조회 실패: 기본값 사용 또는 "로딩 실패" 표시
- DB JOIN 실패: 캐시된 정보 사용 또는 재시도

**React Flow 초기화 실패 시**:
- "캔버스를 초기화할 수 없습니다. 새로고침 해주세요" 안내
- 재시도 버튼 제공

**네트워크 오류 시**:
- "일시적 오류입니다. 잠시 후 다시 시도해주세요" 안내
- 재시도 버튼 제공

---

### 즐거운 사용자 경험

**빠른 응답**:
- 드래그/리사이즈 중 실시간 React Flow State 업데이트
- 드래그 종료 시에만 DB 저장 (지연 최소화)

**자연스러운 피드백**:
- 스냅 가이드라인 실시간 표시
- 블럭 선택 시 시각적 강조
- 엣지 생성 중 연결 가능한 블럭 하이라이트

**일관된 경험**:
- 뷰포트 상태 자동 저장/복원 (이전 작업 위치로 자동 이동)
- Z-Order 자동 관리 (새 블럭은 항상 최상위)

**효율적인 작업**:
- 다중 선택 및 정렬 도구 지원
- 블럭 복제로 빠른 작업
- 블럭 삭제 시 연결된 엣지 자동 정리

---

## ✅ 검증 체크리스트

### 일관성 검증
- [x] Process Model의 모든 System이 Aggregate로 매핑됨
- [x] Event Storm의 Context 경계와 Bounded Context 일치 (단일 Context)
- [x] Process Model의 External System이 모두 ACL로 보호됨
- [x] Read Model이 실제 사용자 시나리오 커버

### 완전성 검증
- [x] 모든 Bounded Context 정의됨 (단일 Context)
- [x] 각 Aggregate의 Invariant가 명확히 정의됨
- [x] Context 간 통합 방식이 명확함
- [x] ACL의 변환 규칙이 구체적으로 정의됨

### 실용성 검증
- [x] Technical Specification 작성 가능한 수준의 구체성
- [x] 구현팀이 이해할 수 있는 Aggregate 경계
- [x] 순환 의존성 없음 (단방향 관계)

---

## 🚀 Next Steps

이제 Canvas Management Domain의 Software Design이 완성되었습니다.

다음 단계:
1. **Technical Specification**: Aggregate를 실제 구현 모듈로 전환
2. **Directory Structure**: 실제 파일 및 폴더 구조 설계
3. **Database Schema**: BlockMount, Edge, Viewport 테이블 설계
4. **API Endpoints**: REST/GraphQL 엔드포인트 정의

---

## 📝 Software Design 워크샵 정보 (참고용)

**일시**: 2025년 1월 17일 (온라인)
**참가자**: 
- **시니어 개발자**: AI Assistant
- **아키텍트**: AI Assistant

**워크샵 결과물**:
- [x] 단일 Bounded Context 정의 (강한 응집성 확보)
- [x] 4개 핵심 Aggregate 정의 (Canvas, BlockMount, Edge, Viewport)
- [x] 모든 Invariant 정의 (비즈니스 규칙 명확화)
- [x] 3개 ACL 설계 (React Flow, Workspace Management, Block Domain)
- [x] Context Map 작성 및 통합 패턴 정의
- [x] Read Model 설계 완료

---

*이 Software Design 문서는 Canvas Management Domain의 Technical Specification 작성을 위한 기반 자료입니다.*
