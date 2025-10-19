# Software Design: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 시니어개발자 + 아키텍트  
**작성일**: 2025-01-17  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `technical-specification.md` (Backend), `user-flow.md` (Frontend)

---

## 📊 Software Design Overview

Canvas Management Domain은 **단일 Bounded Context**로 구성되어 있으며, 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구를 제공하는 핵심 도메인입니다.

### 주요 설계 결정사항

1. **단일 Bounded Context**: 모든 캔버스 관련 기능의 강한 응집성 유지
2. **React Flow ACL**: 외부 라이브러리와의 안전한 통합
3. **State of Truth 전략**: React Flow State (단기) + Database (장기)
4. **4개 핵심 Aggregate**: Canvas, Block Mount, Edge, Viewport

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
1. **Canvas Aggregate** - 캔버스 전체 상태 관리
2. **Block Mount Aggregate** - 블럭-페이지 마운팅 관계 관리
3. **Edge Aggregate** - 엣지 연결 관계 관리
4. **Viewport Aggregate** - 뷰포트 상태 관리

**외부 연동**:
- **Workspace Management Context**: 페이지 생명주기 이벤트 수신 (Customer-Supplier)
- **Block Domain Context**: 블럭 생성/검증 협력 (Customer-Supplier)
- **React Flow (External)**: ACL을 통한 렌더링 엔진 통합

---

## 📦 Aggregate 상세 정의

### Canvas Aggregate

**Root Entity**: Canvas (식별자: CanvasId = PageId와 1:1 매핑)

**Commands**:
- `InitializeCanvas(pageId: PageId)`: 캔버스 초기화 및 React Flow 인스턴스 생성
- `LoadCanvasData(pageId: PageId)`: 페이지의 블럭/엣지 데이터 로드

**Events**:
- `CanvasInitialized(canvasId: CanvasId, pageId: PageId)`: 캔버스가 초기화됨
- `ReactFlowInstanceCreated(canvasId: CanvasId)`: React Flow 인스턴스가 생성됨
- `CanvasDataLoaded(canvasId: CanvasId, blockCount: number, edgeCount: number)`: 페이지 데이터 로드 완료

**Invariants**:
- 캔버스는 정확히 하나의 페이지에만 연결됨
- 캔버스 초기화 시 React Flow 인스턴스가 반드시 생성됨
- 빈 페이지와 기존 페이지의 초기화 로직이 구분됨

### Block Mount Aggregate

**Root Entity**: BlockMount (식별자: BlockMountId = PageId + BlockId)

**Commands**:
- `MountBlock(pageId: PageId, blockId: BlockId, position: Position, size: Size)`: 블럭을 페이지에 마운트
- `TransformBlock(blockMountId: BlockMountId, newPosition?: Position, newSize?: Size, newZOrder?: ZOrder)`: 블럭 변형
- `MountDuplicatedBlock(originalBlockId: BlockId, newBlockId: BlockId, pageId: PageId)`: Block Domain에서 생성된 복제 블럭 마운팅
- `DeleteBlockMount(blockMountId: BlockMountId)`: 블럭 마운트 해제 (Soft Delete)
- `AlignBlocks(blockMountIds: BlockMountId[], alignment: AlignmentType)`: 다중 블럭 정렬
- `DistributeBlocks(blockMountIds: BlockMountId[], direction: DistributionDirection)`: 블럭들 균등 분포

**Events**:
- `BlockMounted(blockMountId: BlockMountId, pageId: PageId, blockId: BlockId)`: 블럭이 페이지에 마운트됨
- `BlockTransformed(blockMountId: BlockMountId, transformType: TransformType)`: 블럭 변형 완료
- `DuplicatedBlockMounted(originalBlockId: BlockId, newBlockMountId: BlockMountId)`: 복제된 블럭이 마운트됨
- `BlockMountDeleted(blockMountId: BlockMountId)`: 블럭 마운트 해제됨
- `BlocksAligned(blockMountIds: BlockMountId[], alignment: AlignmentType)`: 블럭들이 정렬됨
- `BlocksDistributed(blockMountIds: BlockMountId[], direction: DistributionDirection)`: 블럭들이 균등 분포됨

**Invariants**:
- 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
- 새로 생성된 블럭은 최상위 z-order에 배치됨
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
- 엣지 타입은 지원되는 형식만 허용 (직선, 곡선, 스텝, 스무스스텝)

**포함 엔티티**:
- `EdgeConnection` (Value Object): sourceBlockId, targetBlockId
- `EdgeType` (Value Object): 직선, 곡선, 스텝, 스무스스텝
- `EdgeStyle` (Value Object): 색상, 두께, 화살표 스타일

### Viewport Aggregate

**Root Entity**: Viewport (식별자: ViewportId = PageId와 1:1 매핑)

**Commands**:
- `UpdateViewport(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트 줌/패닝 상태 업데이트
- `FocusOnBlock(viewportId: ViewportId, targetBlockId: BlockId)`: 특정 블럭으로 뷰포트 포커스
- `SaveViewportState(viewportId: ViewportId)`: 뷰포트 상태 저장
- `RestoreViewportState(viewportId: ViewportId)`: 뷰포트 상태 복원

**Events**:
- `ViewportUpdated(viewportId: ViewportId, zoomLevel: ZoomLevel, center: ViewportCenter)`: 뷰포트가 업데이트됨
- `ViewportFocused(viewportId: ViewportId, targetBlockId: BlockId)`: 뷰포트가 특정 블럭에 포커스됨
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

### Block Domain ACL

**목적**: Block Domain과의 블럭 생성/복제 협력

**위치**: `src/domains/canvas-management/application/BlockDomainService.ts`

**통합 방식**: 동기적 서비스 주입을 통한 직접 호출
- 블럭 생성: `BlockDomain.createBlock(blockType, defaultProperties)`
- 블럭 복제: `BlockDomain.duplicateBlock(originalBlockId)` (사용자 피드백 반영)

---

## 🗺️ Context Map

### Context Relationships

```
Workspace Management Context (Upstream)
        ↓ [Customer-Supplier + Event]
Canvas Management Context (Core)
        ↓ [Customer-Supplier + Service Call]
Block Domain Context (Supporting)
```

### Integration Points

**Workspace Management → Canvas Management**:
- **패턴**: Customer-Supplier + Event
- **방향**: Workspace Management (Upstream) → Canvas Management (Downstream)
- **인터페이스**: 페이지 생명주기 이벤트 수신
- **통합 방식**: Server Action 이벤트 핸들러
- **이벤트**: `PageCreated` → `CanvasInitializationRequired`

**Canvas Management → Block Domain**:
- **패턴**: Customer-Supplier + Service Injection
- **방향**: Canvas Management (Customer) → Block Domain (Supplier)
- **인터페이스**: 
  - `BlockDomain.createBlock(blockType, properties)`
  - `BlockDomain.duplicateBlock(originalBlockId)` (피드백 반영)
- **통합 방식**: 동기적 서비스 주입 (Next.js Server Actions)
- **보호**: BlockDomainService가 ACL 역할

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
  canvasId: CanvasId;              // 캔버스 ID (= PageId)
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
  edgeType: EdgeType;               // 엣지 타입 (직선, 곡선, 스텝, 스무스스텝)
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
- **Scenario 0**: 외부 도메인과의 동기화 (페이지 생명주기)
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

#### Sequence 1: 페이지 생성 시 캔버스 초기화
- Workspace Management Domain에서 페이지 생성 완료:
  1. **Workspace Management**가 **Canvas Management Event Handler** 트리거: `PageCreated(pageId)`
  2. **Canvas Management Service**가 **Server Action** 호출:
     - Canvas Aggregate: 캔버스 초기화 요청 (`InitializeCanvas`)
     - 페이지 접근 권한 확인 (Workspace Management 협력)
     - React Flow 인스턴스 생성 (ACL을 통해)
     - 초기 뷰포트 설정 (기본 줌 레벨, 중심 좌표)
     - CanvasInitialized, ReactFlowInstanceCreated, EmptyCanvasStateLoaded 이벤트 발행
  3. **Frontend**가 빈 캔버스 렌더링

#### Sequence 2: 기존 페이지 로드 시 블럭/엣지 복원
- 사용자가 기존 페이지에 접근:
  1. **Server Component**가 **Server Action** 호출: `getCanvasViewAction(pageId, userId)`
  2. **Server Action**이 **Service** 호출:
     - Workspace Management Domain Repository 호출: 페이지 접근 권한 확인
     - 권한이 없으면 → 접근 거부 에러 반환
     - Canvas Aggregate에서 캔버스 상태 조회
     - Block Mount Aggregate에서 마운트된 블럭 목록 조회 (z-order 정렬)
     - Edge Aggregate에서 엣지 목록 조회
     - Viewport Aggregate에서 뷰포트 상태 조회
     - Block Domain Service 배치 호출: 블럭 타입 및 속성 정보 가져오기
     - Read Model Service가 모든 결과를 조합하여 `CanvasView` 생성
     - React Flow Adapter를 통해 React Flow 형식으로 변환
  3. **Server Action**이 `CanvasView` 반환
  4. **Server Component**가 캔버스 렌더링
  5. **Frontend**가 React Flow로 블럭/엣지 표시

**규칙 준수 확인** (Scenario 0):
- ✅ 페이지 접근 권한 확인 필수
- ✅ 캔버스 초기화 시 React Flow 인스턴스 생성
- ✅ 기존 페이지는 모든 블럭/엣지 복원
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

#### Sequence 1: 사용자가 새 블럭을 생성
- 사용자가 도구바에서 블럭 타입 선택 후 캔버스에 클릭:
  1. **Client Component**가 **Server Action** 호출: `createBlockAction(pageId, blockType, position, userId)`
  2. **Server Action**이 **Service** 호출:
     - Workspace Management Domain Repository 호출: 페이지 접근 권한 확인
     - 권한이 없으면 → 접근 거부 에러 반환
     - Block Domain Service 호출: 블럭 생성 요청
       - `BlockDomain.createBlock(blockType, defaultProperties)`
       - Block Domain이 블럭 타입 검증, 기본값 설정, 블럭 생성
       - BlockCreated 이벤트 수신
     - Block Mount Aggregate: 생성된 블럭을 페이지에 마운트
       - `MountBlock(pageId, blockId, position, size)`
       - Z-Order 최상위로 설정 (현재 최대값 + 1)
       - BlockMounted 이벤트 발행
     - React Flow Adapter: 새 블럭을 React Flow Node로 변환
     - React Flow State 업데이트
  3. **Frontend**가 새 블럭 표시 (낙관적 업데이트)

**규칙 준수 확인** (Scenario 1):
- ✅ Block Domain에서 타입 검증
- ✅ 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함
- ✅ 새 블럭은 Z-Order 최상위로 배치
- ✅ 초기 위치는 클릭한 좌표, 초기 크기는 블럭 타입별 기본값

---

### 업무 시나리오 연결 (Scenario 2: 블럭 변환)

#### Sequence 1~2: 블럭 드래그 이동 및 위치 확정
- 사용자가 블럭을 드래그:
  1. **Frontend**에서 드래그 시작:
     - React Flow가 실시간 위치 업데이트 (State만 변경, DB 저장 X)
     - Snap Guide Manager가 스냅 가이드라인 계산 (5px 임계값)
     - 가이드라인 표시 (중심선 > 가장자리 우선순위)
  2. **드래그 종료** 시 **Server Action** 호출: `updateBlockPositionAction(blockMountId, finalPosition, userId)`
  3. **Server Action**이 **Service** 호출:
     - Block Mount Aggregate: 위치 업데이트
       - `TransformBlock(blockMountId, newPosition)`
       - 스냅 임계값 검사 (5px)
       - 스냅 적용 시 가이드라인 위치로 조정
       - BlockTransformed, BlockSnappedToGuideline 이벤트 발행
     - DB 저장 (마운트 정보 업데이트)
     - React Flow State 동기화
  4. **Frontend**가 최종 위치 표시

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
     - Block Domain Service 호출: 블럭 복제 요청
       - `BlockDomain.duplicateBlock(originalBlockId)`
       - Block Domain이 새 블럭 생성 (속성 복사)
       - BlockDuplicated 이벤트 수신
     - Block Mount Aggregate: 복제된 블럭을 페이지에 마운트
       - `MountDuplicatedBlock(originalBlockId, newBlockId, pageId)`
       - 원본 근처 위치로 오프셋 적용 (x+20, y+20)
       - Z-Order 최상위로 설정
       - DuplicatedBlockMounted 이벤트 발행
  3. **Frontend**가 복제된 블럭 표시

**규칙 준수 확인** (Scenario 3):
- ✅ Block Domain에서 블럭 복제 처리
- ✅ 복제된 블럭은 원본 근처 위치에 마운트
- ✅ Z-Order 최상위로 배치

---

### 업무 시나리오 연결 (Scenario 5: 블럭 정렬 도구)

#### Sequence 1~2: 다중 선택된 블럭들 정렬 및 균등 분포
- 사용자가 정렬 도구 버튼 클릭:
  1. **Client Component**가 **Server Action** 호출: `alignBlocksAction(blockMountIds[], alignmentType, userId)`
  2. **Server Action**이 **Service** 호출:
     - 다중 선택 상태 확인
     - Block Mount Aggregate: 블럭 정렬 처리
       - `AlignBlocks(blockMountIds, alignmentType)`
       - 선택된 블럭들의 위치 계산
       - 정렬 기준점 결정 (그룹 전체 기준)
       - 새 위치 계산 및 마운트 정보 일괄 업데이트
       - BlocksAligned 이벤트 발행
     - React Flow State 동기화
  3. **Frontend**가 정렬된 블럭들 표시

**규칙 준수 확인** (Scenario 5):
- ✅ 다중 선택된 블럭들만 정렬 가능
- ✅ 블럭들의 상대적 위치 유지

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

#### Sequence 1: 블럭 삭제 (Soft Delete)
- 사용자가 블럭 삭제 버튼 클릭:
  1. **Client Component**가 **Server Action** 호출: `deleteBlockMountAction(blockMountId, userId)`
  2. **Server Action**이 **Service** 호출:
     - Block Mount Aggregate: 블럭 마운트 해제
       - `DeleteBlockMount(blockMountId)`
       - Soft Delete 처리 (deleted_at 설정)
       - BlockMountDeleted 이벤트 발행
     - **Policy 적용**: "Whenever 블럭 마운트 삭제됨, then always 연결된 엣지 정리하기"
     - Edge Aggregate: 연결된 엣지 일괄 삭제
       - `DeleteConnectedEdges(pageId, blockId)`
       - 트랜잭션으로 처리 (원자성 보장)
       - ConnectedEdgesDeleted 이벤트 발행
     - React Flow State에서 블럭/엣지 제거
  3. **Frontend**가 삭제 반영

**규칙 준수 확인** (Scenario 8):
- ✅ 블럭 삭제는 Soft Delete
- ✅ 블럭 삭제 시 연결된 모든 엣지 자동 삭제 (트랜잭션)
- ✅ 하나 이상의 페이지에 마운트된 블럭만 삭제 가능

---

### 업무 시나리오 연결 (Scenario 9: 캔버스 뷰포트 관리)

#### Sequence 1~3: 캔버스 줌/패닝 및 뷰포트 상태 저장/복원
- 사용자가 마우스 휠로 줌 조작:
  1. **Frontend**에서 줌/패닝 처리:
     - React Flow가 실시간 뷰포트 업데이트 (State만 변경)
     - 줌 레벨 제한 적용 (최소/최대)
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
     - React Flow 애니메이션을 통한 부드러운 전환
  6. **Frontend**가 복원된 뷰포트 표시

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

**Block Domain**: 동기 호출로 블럭 생성/복제 및 속성 정보 조회
- Service 주입: 블럭 생성, 복제, 속성 조회
- 통합 방식: Service Layer 직접 호출
- 실패 전략: Graceful Degradation (블럭 생성/복제 실패 시 에러 표시, 속성 조회 실패 시 기본값 사용)

**React Flow (외부 라이브러리)**: ACL을 통한 데이터 변환
- 통합 방식: ReactFlowAdapter를 통한 ACL 패턴
- State 전략: React Flow State (단기 SoT) + Database (장기 SoT)
- 실패 전략: React Flow 초기화 실패 시 재시도 안내

---

### 실패 대응 전략 (종합)

**권한 검증 실패 시**:
- 사용자에게 "페이지 접근 권한이 없습니다" 안내
- 접근 거부 처리 (보안 우선)

**Block Domain 장애 시**:
- 블럭 생성/복제 실패: "블럭을 생성할 수 없습니다. 다시 시도해주세요" 안내
- 블럭 속성 조회 실패: 기본값 사용 또는 "로딩 실패" 표시

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
