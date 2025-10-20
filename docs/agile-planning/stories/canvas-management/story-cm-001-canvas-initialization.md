# Story CM-001: 캔버스 데이터 로드 및 렌더링

## 🎯 Story 개요
**User Story**: As a 사용자, I want to 페이지에 접속했을 때 기존 블럭/엣지/뷰포트가 자동으로 로드되고 렌더링되어야 so that 즉시 작업을 계속할 수 있다

**Story Points**: 8pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

**핵심 범위**: 
- ✅ 페이지별 캔버스 데이터 조회 (Read Model)
- ✅ React Flow 초기 노드/엣지 렌더링
- ✅ 뷰포트 상태 복원
- ❌ 블럭 생성/편집 기능 (CM-002에서 처리)

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 빈 페이지 접근 시 캔버스 렌더링
```gherkin
Given 사용자가 새로 생성된 빈 페이지에 접속했다
When 페이지가 로드된다
Then 빈 캔버스가 렌더링된다
And React Flow 인스턴스가 정상 생성된다
And 기본 뷰포트 설정이 적용된다 (zoom: 1.0, center: {x: 0, y: 0})
And 블럭 추가 버튼이 활성화된다
```

### 시나리오 2: 기존 페이지 접근 시 데이터 복원
```gherkin
Given 사용자가 기존 블럭/엣지가 있는 페이지에 접속했다
When 페이지가 로드된다
Then 모든 블럭들이 저장된 위치/크기/z-order로 렌더링된다
And 모든 엣지들이 올바른 연결 상태로 렌더링된다
And 사용자별 뷰포트 설정이 복원된다 (zoom, center)
And 캔버스 모드가 'default'로 설정된다
```

### 시나리오 3: 권한별 UI 차이
```gherkin
Given 사용자가 읽기 전용 권한으로 페이지에 접속했다
When 페이지가 로드된다
Then 블럭/엣지는 모두 표시되지만
And 블럭 추가 버튼이 비활성화되거나 숨겨진다
And 뷰포트 제어(줌/패닝)만 가능하다
```

---

## 📋 개발 Task (Phase별)

### Phase 0: 기존 완료된 인프라 (재사용) ✅

**Database Schema** (이미 완료됨):
- [x] ✅ **block_mounts 테이블** (Drizzle migration 완료)
  - 컬럼: id, page_id, block_id, position (x, y), size (width, height), z_order
  - 인덱스: page_id, z_order, block_id
  
- [x] ✅ **edges 테이블** (Drizzle migration 완료)
  - 컬럼: id, page_id, source_block_id, target_block_id, edge_type, label, style
  
- [x] ✅ **viewports 테이블** (Drizzle migration 완료)
  - 컬럼: id, page_id, user_id, zoom_level, center (x, y), last_saved_at
  
- [x] ✅ **RLS 정책 적용** (페이지 접근 권한 기반)

**Value Objects** (이미 완료됨):
- [x] ✅ **Position VO** (`src/domains/canvas-management/shared/value-objects/position.vo.ts`)
  - 좌표 검증, equals, add, distanceTo 메서드
  - 단위 테스트 완료
  
- [x] ✅ **Size VO** (`src/domains/canvas-management/shared/value-objects/size.vo.ts`)
  - 크기 검증, equals, resize, getArea 메서드
  - 단위 테스트 완료
  
- [x] ✅ **ZOrder VO** (`src/domains/canvas-management/shared/value-objects/z-order.vo.ts`)
  - z-order 검증, equals, isAbove, getTopLayer 메서드
  - 단위 테스트 완료

**Entities** (이미 완료됨):
- [x] ✅ **BlockMount Entity** (`src/domains/canvas-management/shared/entities/block-mount.entity.ts`)
  - 속성: id, pageId, blockId, position, size, zOrder
  - 메서드: transform() (🔄 추후 개별 메서드로 분리 필요)
  - 단위 테스트 완료

- [x] ✅ **Edge Entity** (`src/domains/canvas-management/shared/entities/edge.entity.ts`)
  - 속성: id, pageId, sourceBlockId, targetBlockId, edgeType, label, style
  - 메서드: updateType, updateLabel, updateStyle
  - 단위 테스트 완료

- [x] ✅ **Viewport Entity** (`src/domains/canvas-management/shared/entities/viewport.entity.ts`)
  - 속성: id, pageId, zoomLevel, center
  - 메서드: updateViewport, saveState, restoreState
  - 단위 테스트 완료

**Repositories** (기본 구조 완료됨):
- [x] ✅ **BlockMountRepository 인터페이스 및 기본 구현**
  - 파일: `src/domains/canvas-management/infrastructure/repositories/block-mount.repository.ts`
  - 메서드: save(), findById(), findByPageId() (🔄 검증 필요)
  
- [x] ✅ **EdgeRepository 인터페이스 및 기본 구현**
  - 파일: `src/domains/canvas-management/infrastructure/repositories/edge.repository.ts`
  - 메서드: save(), findById(), findByPageId() (🔄 검증 필요)
  
- [x] ✅ **ViewportRepository 인터페이스 및 기본 구현**
  - 파일: `src/domains/canvas-management/infrastructure/repositories/viewport.repository.ts`
  - 메서드: save(), findById(), findByPageId() (🔄 검증 필요)

**Service Layer** (기본 구조 완료됨):
- [x] ✅ **CanvasManagementService 클래스**
  - 파일: `src/domains/canvas-management/application/services/canvas-management.service.ts`
  - 의존성: Repositories 주입 완료
  - 🔄 **수정 필요**: `initializeCanvas()` 제거, `getCanvasView()` 추가

---

### Phase 1: Read Model & Query Layer (Backend) ⭐ NEW

**참조 문서**: 
- [Technical Specification - GetCanvasViewQuery](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md#canvasview-query)
- [Software Design - Read Model](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md#-read-models-query-side)

#### 1.1. Read Model 구현
- [x] ✅ **GetCanvasViewQuery 클래스 작성** ⭐ NEW
  - 파일: `src/domains/canvas-management/application/queries/get-canvas-view.query.ts`
  - 의존성: BlockMountRepository, EdgeRepository, ViewportRepository, BlockDomainService, WorkspaceRepository
  - 메서드: `execute(pageId: PageId, userId: UserId): Promise<Result<CanvasView, Error>>`
  
- [x] ✅ **CanvasViewData DTO 정의** ⭐ NEW
  - 파일: `src/domains/canvas-management/shared/dtos/index.ts`
  - 구조: `{ pageId, blocks[], edges[], viewport }`
  - 직렬화 규칙: Value Object → string, Date → ISO string

- [x] ✅ **Query 단위 테스트** ⭐ NEW
  - 파일: `src/domains/canvas-management/application/queries/__tests__/get-canvas-view.query.test.ts`
  - 테스트 케이스:
    - ✅ 빈 페이지 조회 시 빈 배열 반환
    - ✅ 기존 페이지 조회 시 모든 블럭/엣지 반환
    - ✅ 권한 없는 페이지 조회 시 에러 반환
    - 🔄 BlockDomainService DB JOIN 정상 동작 (구현 필요)

#### 1.2. Repository 메서드 검증 (이미 구현됨, 검증만 필요)
- [ ] **BlockMountRepository.findByPageId() 검증** ✅ 구현됨
  - z-order DESC 정렬 포함 여부 확인
  - 테스트: 정렬 순서 검증 추가 필요
  
- [ ] **EdgeRepository.findByPageId() 검증** ✅ 구현됨
  - 페이지별 엣지 조회 동작 확인
  - 테스트: 페이지 격리 검증 추가 필요
  
- [ ] **ViewportRepository.findByPageId() 검증** ✅ 구현됨
  - 사용자별 뷰포트 상태 조회 동작 확인
  - 테스트: 사용자 격리 검증 추가 필요

---

### Phase 2: Service & Server Actions (Backend) ⭐

#### 2.1. Service Layer 업데이트
- [x] ✅ **CanvasManagementService.getCanvasView() 메서드** (통합 완료)
  - 파일: `src/domains/canvas-management/backend/services/canvas-management.service.ts`
  - 로직: Repository들을 직접 호출하여 데이터 조합 → Result 반환
  - 변경: `initializeCanvas()`, `loadCanvasData()`, `transformBlock()` 제거
  - 개선: `findByPageIdWithBlocks()` JOIN 쿼리로 성능 최적화
  
- [x] ✅ **Service 통합 테스트**
  - 파일: `src/domains/canvas-management/backend/services/__tests__/canvas-management.service.test.ts`
  - 테스트 케이스:
    - ✅ 권한 확인 통합 (MockWorkspaceRepository.checkPageAccess)
    - ✅ BlockMountRepository JOIN 쿼리 통합 (findByPageIdWithBlocks)
    - ✅ 에러 처리 (권한 부족, DB 오류)
    - ✅ 데이터 매핑 검증 (CanvasViewData 형식)

#### 2.2. Server Action 구현
- [x] ✅ **getCanvasViewAction**
  - 파일: `src/domains/canvas-management/actions/canvas.actions.ts`
  - 인증: Supabase Auth 확인
  - 권한 검증: URL 파라미터 기반 (`orgId`, `workspaceId`) - DefaultWorkspaceNavigationService.verifyPageAccess() 사용
  - 로직: CanvasManagementService.getCanvasView() 직접 호출
  - DTO 직렬화: Value Object → Plain Object
  - 완료: 실제 구현체 사용 (DrizzleEdgeRepository, DrizzleViewportRepository 등)
  
- [x] ✅ **Server Action 테스트**
  - 파일: `src/domains/canvas-management/actions/__tests__/get-canvas-view.action.test.ts`
  - 테스트 케이스:
    - ✅ 인증되지 않은 요청 거부
    - ✅ 권한 없는 페이지 접근 거부
    - ✅ 정상 데이터 직렬화 검증

#### 2.3. 필수 의존성 구현 (완료) ✅
- [x] ✅ **EdgeRepository 구현체** (DrizzleEdgeRepository)
  - 파일: `src/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository.ts`
  - 인터페이스: EdgeRepository
  - 메서드: save(), findById(), findByPageId(), findByConnectedBlockId(), delete(), deleteAll()
  
- [x] ✅ **ViewportRepository 구현체** (DrizzleViewportRepository)
  - 파일: `src/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository.ts`
  - 인터페이스: ViewportRepository
  - 메서드: save(), findById(), findByPageId(), delete()

- [x] ✅ **BlockMountRepository 개선** (JOIN 쿼리 추가)
  - 파일: `src/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository.ts`
  - 메서드: `findByPageIdWithBlocks(pageId: PageId): Promise<Array<{ blockMount: BlockMountAggregate; block: Block; }>>`
  - DB JOIN 최적화: block_mounts와 blocks 테이블 INNER JOIN

- [x] ✅ **WorkspaceRepository.checkPageAccess() 구현**
  - 파일: `src/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository.ts`
  - 메서드: `checkPageAccess(pageId: PageId, userId: UserId): Promise<boolean>`
  - 권한 확인 로직: 페이지 생성자, 워크스페이스 소유자, 워크스페이스 멤버, 조직 멤버 (기본 워크스페이스)
  - RLS 정책 기반 권한 확인 구현 완료

---

### Phase 3: ACL & Data Transformation (Frontend/Backend 경계) ⭐

#### 3.1. React Flow ACL 구현
- [x] ✅ **toReactFlowNodeFromCanvasView() 함수**
  - 파일: `src/domains/canvas-management/frontend/acl/react-flow.acl.ts`
  - 입력: CanvasViewData['blocks'][0]
  - 출력: React Flow Node
  - 변환 로직: CanvasViewData 구조에 맞는 블록 데이터를 React Flow Node로 변환
  
- [x] ✅ **toReactFlowEdgeFromCanvasView() 함수**
  - 입력: CanvasViewData['edges'][0]
  - 출력: React Flow Edge
  - 변환 로직: CanvasViewData 구조에 맞는 엣지 데이터를 React Flow Edge로 변환

- [x] ✅ **ACL 단위 테스트**
  - 파일: `src/domains/canvas-management/frontend/acl/__tests__/react-flow.acl.test.ts`
  - 테스트 케이스:
    - ✅ CanvasViewData → React Flow 변환 검증 (5/5 테스트 통과)
    - ✅ 다양한 블록 타입 처리 검증
    - ✅ 기본 edgeType 처리 검증
    - ✅ null edgeType 기본값 처리 검증
    - ✅ 타입 안전성 검증

---

### Phase 4: Frontend Components (Client Side) ⭐⭐⭐

**참조 문서**: 
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)
- [User Flow](../../../event-domain-design/domains/canvas-management-domain/03-user-flow.md)

#### 4.1. Server Component (page.tsx)
- [x] ✅ **PageContent 컴포넌트 구현**
  - 파일: `src/app/(dashboard)/r/[orgId]/workspace/[workspaceId]/page/[pageId]/page.tsx`
  - 로직:
    1. `getCanvasViewAction(pageId, orgId, workspaceId)` 호출 (URL 파라미터 전달)
    2. 에러 처리: `<CanvasErrorFallback />`
    3. ACL 변환: `toReactFlowNodeFromCanvasView()`, `toReactFlowEdgeFromCanvasView()`
    4. `<CanvasClient>` 렌더링
  - 완료: Next.js params Promise 처리 및 URL 파라미터 기반 권한 검증 연동

- [ ] **CanvasErrorFallback 컴포넌트**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-error-fallback.tsx`
  - UI: 에러 메시지, 재시도 버튼
  - 에러 타입별 메시지:
    - 권한 부족: "이 페이지에 접근할 권한이 없습니다"
    - 로딩 실패: "캔버스를 불러올 수 없습니다"

- [ ] **CanvasLoadingSkeleton 컴포넌트**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-loading-skeleton.tsx`
  - UI: 스켈레톤 로딩 애니메이션

#### 4.2. Client Component (canvas-client.tsx)
- [ ] **CanvasClient 컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-client.tsx`
  - Props: `{ pageId, initialNodes, initialEdges }`
  - 구조:
    ```tsx
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
    ```
  - 🔄 **수정 필요**: 기존 `canvasId` prop 제거, `CanvasManagementContext` 제거

#### 4.3. React Flow Wrapper (canvas-react-flow-wrapper.tsx)
- [ ] **CanvasReactFlowWrapper 컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
  - Props: `{ pageId, initialNodes, initialEdges }`
  - Hooks 통합:
    - `useNodesState(initialNodes)` - React Flow SSOT
    - `useEdgesState(initialEdges)` - React Flow SSOT
    - `useCanvasMode()` - 캔버스 모드 관리 (초기값: `default`)
    - `useCanvasSelection()` - 선택 상태 (읽기 전용)
    - `useCanvasViewport()` - 뷰포트 상태 (읽기 전용)
    - 🔄 **추후 추가**: `useCanvasBlockLifecycle()`, `useCanvasBlockTransform()`, `useCanvasEdgeManagement()`, `useCanvasSnapGuides()` (CM-002, CM-003에서)
  - React Flow 설정:
    ```tsx
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      className="hide-default-selection"
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
    ```
  - 🔄 **수정 필요**: 이벤트 핸들러들은 CM-002, CM-003에서 추가

#### 4.4. 기본 UI 컴포넌트
- [ ] **BlockToolbar 컴포넌트 (기본 버전)**
  - 파일: `src/domains/canvas-management/frontend/components/block-toolbar.tsx`
  - UI: 플러스(+) 버튼만 표시 (비활성화 상태)
  - 렌더링 조건: `canEdit === true`
  - 🔄 **수정 필요**: 클릭 이벤트는 CM-002에서 추가

- [ ] **ViewportControls 컴포넌트**
  - 파일: `src/domains/canvas-management/frontend/components/viewport-controls.tsx`
  - UI: 줌 인/아웃 버튼, 줌 레벨 표시, 미니맵 토글
  - Hook: `useCanvasViewport()` (읽기 전용)
  - 기능: 뷰포트 상태 표시만 (제어는 CM-003에서 추가)

#### 4.5. Hooks 구현 (읽기 전용 버전)
- [ ] **useCanvasMode() Hook (기본 버전)**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-mode.ts`
  - 상태: `useState<CanvasMode>({ type: 'default' })`
  - 메서드: `getCurrentMode()`, `isBlockCreationMode()` 등 (읽기만)
  - 🔄 **추후 확장**: 모드 전환 메서드는 CM-002에서 추가

- [ ] **useCanvasSelection() Hook (읽기 전용)**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-selection.ts`
  - React Flow Hook: `useStore((state) => state.nodeLookup)`
  - 메서드: `getSelectedBlocks()`, `isSelected()`, `getSelectionCount()`
  - 특징: React Flow 상태만 읽고, 직접 변경하지 않음 (읽기 전용)

- [ ] **useCanvasViewport() Hook (읽기 전용)**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-viewport.ts`
  - React Flow Hook: `useStore((state) => state.viewport)`
  - 메서드: `getZoomLevel()`, `getViewportCenter()`, `getViewportBounds()`
  - 🔄 **추후 확장**: 뷰포트 제어 메서드는 CM-003에서 추가

---

### Phase 5: E2E Testing (Frontend + Backend 통합) ⭐⭐⭐

#### 5.1. E2E 테스트 시나리오
- [ ] **빈 페이지 렌더링 테스트**
  - 파일: `src/__tests__/e2e/canvas/canvas-initialization.spec.ts`
  - 시나리오:
    1. 새 페이지 생성
    2. 페이지 URL 접근
    3. 빈 캔버스 렌더링 확인
    4. React Flow 인스턴스 존재 확인
    5. 기본 뷰포트 확인 (zoom: 1.0)

- [ ] **기존 페이지 데이터 로드 테스트**
  - 시나리오:
    1. DB에 블럭/엣지/뷰포트 시드 데이터 생성
    2. 페이지 URL 접근
    3. 모든 블럭 렌더링 확인 (위치, 크기 검증)
    4. 모든 엣지 렌더링 확인 (연결 검증)
    5. 뷰포트 복원 확인

- [ ] **권한 확인 테스트**
  - 시나리오:
    1. 권한 없는 사용자로 페이지 접근
    2. 접근 거부 에러 확인
    3. 읽기 전용 권한으로 페이지 접근
    4. 블럭/엣지 표시되지만 편집 불가 확인

#### 5.2. 수동 테스트 체크리스트
- [ ] **빈 페이지 테스트**
  - 새 페이지 생성 → 페이지 접근 → 빈 캔버스 확인
  - React Flow 배경 그리드 표시 확인
  - 플러스 버튼 표시 확인 (비활성화 상태)

- [ ] **기존 페이지 테스트**
  - 기존 페이지 접근 → 모든 블럭/엣지 표시 확인
  - 블럭 위치/크기 정확성 확인
  - 엣지 연결 상태 확인
  - 뷰포트 복원 확인 (zoom, center)

- [ ] **로딩 상태 테스트**
  - 페이지 로딩 시 스켈레톤 표시 확인
  - 로딩 완료 후 캔버스 렌더링 확인
  - 로딩 실패 시 에러 메시지 확인

---

## 🔄 기존 구현 수정 사항

### 🗑️ 제거할 것들 (Canvas Aggregate 제거됨)
- [ ] ❌ **CanvasAggregate 클래스 삭제**
  - 파일: `src/domains/canvas-management/shared/aggregates/canvas.aggregate.ts`
  - 이유: Canvas는 DB 테이블이 아니므로 Aggregate 불필요

- [ ] ❌ **Canvas Entity 삭제**
  - 파일: `src/domains/canvas-management/shared/entities/canvas.entity.ts`
  - 이유: Canvas Entity 불필요

- [ ] ❌ **CanvasId VO 삭제**
  - 파일: `src/domains/canvas-management/shared/value-objects/canvas-id.vo.ts`
  - 이유: PageId로 대체

- [ ] ❌ **CanvasRepository 삭제**
  - 파일: `src/domains/canvas-management/infrastructure/repositories/canvas.repository.ts`
  - 이유: Canvas DB 테이블 없음

- [ ] ❌ **initializeCanvasAction 삭제**
  - 파일: `src/domains/canvas-management/actions/canvas.actions.ts`
  - 이유: `getCanvasViewAction`으로 대체

- [ ] ❌ **CanvasManagementContext 제거**
  - 파일: `src/domains/canvas-management/frontend/context/canvas-management.context.tsx`
  - 이유: Props 전달 방식으로 변경

### 🔧 수정할 것들
- [ ] 🔄 **page.tsx 업데이트**
  - 기존: `initializeCanvasAction()` 호출
  - 변경: `getCanvasViewAction(pageId, userId)` 호출
  - ACL 변환 추가: `toReactFlowNode()`, `toReactFlowEdge()`

- [ ] 🔄 **CanvasClient props 업데이트**
  - 기존: `{ pageId, canvasId, initialData }`
  - 변경: `{ pageId, initialNodes, initialEdges }`
  - CanvasManagementContext 사용 제거

- [ ] 🔄 **useCanvasManagement Hook 리팩토링**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-management.ts`
  - 기존: Context에서 상태 읽기
  - 변경: 제거하고 개별 Hooks으로 분리 (`useCanvasMode`, `useCanvasViewport` 등)

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 빈 페이지 접근 시 빈 캔버스 렌더링
- [ ] 기존 페이지 접근 시 모든 블럭/엣지 표시
- [ ] 사용자별 뷰포트 설정 복원
- [ ] React Flow 인스턴스 정상 생성 및 기본 UI 표시
- [ ] 권한별 UI 차이 구현 (읽기 전용 vs 편집 가능)

### 기술 완료
- [ ] GetCanvasViewQuery 단위 테스트 95% 이상
- [ ] Service Layer 통합 테스트 85% 이상
- [ ] Server Action 통합 테스트 85% 이상
- [ ] ACL 단위 테스트 95% 이상
- [ ] E2E Tests 통과 (3개 시나리오)

### 품질 완료
- [ ] 기존 Canvas Aggregate 관련 코드 완전 제거
- [ ] Read Model 기반 구조로 리팩토링 완료
- [ ] 페이지 접근 권한 검증 완료 (RLS + Service Layer)
- [ ] 에러 처리 및 로딩 상태 관리 완료
- [ ] 코드 리뷰 완료

---

## 📊 진행 상황
**현재**: 90% (Phase 1-4 완료, Phase 5 남음)

### 기존 완료 작업 (재사용 가능)
- [x] ✅ **Database Schema**: block_mounts, edges, viewports 테이블 완료
- [x] ✅ **Value Objects**: Position, Size, ZOrder VO 완료 (89개 테스트 통과)
- [x] ✅ **Entities**: BlockMount, Edge, Viewport Entity 완료
- [x] ✅ **Repositories**: BlockMountRepository 완료

### Phase 1-2 완료 (NEW)
- [x] ✅ **CanvasManagementService.getCanvasView**: Service Layer 통합 완료
- [x] ✅ **CanvasViewData DTO**: 정의 완료
- [x] ✅ **getCanvasViewAction**: Server Action 구현 완료 (실제 구현체 사용)
- [x] ✅ **Service 테스트**: CanvasManagementService 단위 테스트 완료 (4/4 passed)

### Phase 2.3 완료 (의존성 구현) ✅
- [x] ✅ **EdgeRepository 구현체**: DrizzleEdgeRepository 구현 완료
- [x] ✅ **ViewportRepository 구현체**: DrizzleViewportRepository 구현 완료
- [x] ✅ **BlockMountRepository**: findByPageIdWithBlocks() JOIN 쿼리 구현 완료
- [x] ✅ **WorkspaceRepository**: checkPageAccess() 메서드 구현 완료
- [x] ✅ **아키텍처 개선**: GetCanvasViewQuery 제거, CanvasManagementService 통합 처리

### Phase 3 완료 (ACL 구현) ✅
- [x] ✅ **ACL**: toReactFlowNodeFromCanvasView, toReactFlowEdgeFromCanvasView 변환 함수 구현
- [x] ✅ **ACL 테스트**: TDD 기반 단위 테스트 완료 (5/5 테스트 통과)

### Phase 4 완료 (Frontend Components) ✅
- [x] ✅ **page.tsx**: Server Component 구현 완료 (getCanvasViewAction 사용)
- [x] ✅ **CanvasClient**: Client Component 구현 완료 (pageId prop 전달)
- [x] ✅ **CanvasReactFlowWrapper**: React Flow 통합 완료 (pageId prop 전달)
- [x] ✅ **Next.js 호환성**: params Promise 처리 완료 (await params 적용)
  - layout.tsx: 직접 접근 → `await params` 사용으로 변경
  - page.tsx: 이미 올바르게 `await params` 사용 중
  - PageLayoutClient: 클라이언트/서버 컴포넌트 분리로 구조 개선

### 추후 구현 (Phase 5)
- [ ] ⭐ **E2E Tests**: 통합 테스트

### 변경 이유
- ❌ **기존 접근**: Canvas Aggregate 기반 초기화 → DB 테이블 없어서 불필요
- ✅ **새 접근**: Read Model Query 기반 데이터 로드 → 실제 DB 구조 반영
- ✅ **기존 인프라 활용**: DB Schema, Value Objects, Entities, Repositories 모두 재사용

### 최근 아키텍처 개선 (완료)
- ❌ **GetCanvasViewQuery 제거**: 복잡한 쿼리 로직을 Service Layer로 이동
- ✅ **CanvasManagementService 통합**: `getCanvasView()` 메서드로 모든 캔버스 데이터 조회 통합
- ✅ **성능 최적화**: `findByPageIdWithBlocks()` JOIN 쿼리로 DB 호출 횟수 감소
- ✅ **불필요한 메서드 제거**: `initializeCanvas()`, `loadCanvasData()`, `transformBlock()` 제거
- ✅ **TDD 기반 테스트**: CanvasManagementService 단위 테스트 완료 (4/4 passed)

---

## 🔗 의존성
- **선행 Story**: 없음 (첫 번째 스토리)
- **후행 Story**: 
  - CM-002 (블럭 생성 및 마운팅) - 블럭 추가 기능
  - CM-003 (블럭 변환) - 드래그/리사이즈 기능
- **도메인 의존성**: 
  - Workspace Management Domain (페이지 접근 권한)
  - Block Management Domain (블럭 정보 DB JOIN)

---

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 0 (외부 도메인과의 동기화)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - Read Model Service
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - GetCanvasViewQuery 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - CanvasClient, ACL
- [User Flow](../../../event-domain-design/domains/canvas-management-domain/03-user-flow.md) - Scenario 0 화면 흐름

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)

---

## 📝 구현 노트

### Read Model 패턴 적용
- **Query**: `GetCanvasViewQuery` - 페이지별 캔버스 데이터 조회
- **DTO**: `CanvasView` - 블럭/엣지/뷰포트 통합 뷰
- **Repository**: BlockMountRepository, EdgeRepository, ViewportRepository
- **Service**: BlockDomainService (DB JOIN으로 블럭 정보 조회)

### React Flow 초기화 전략
- **Server Side**: 데이터 로드 + ACL 변환
- **Client Side**: React Flow 인스턴스 생성 + 초기 데이터 렌더링
- **SSOT**: React Flow State (단기) + Database (장기)

---

*이 스토리 완료 후 사용자는 페이지에 접근하여 기존 캔버스를 볼 수 있지만, 편집 기능은 CM-002에서 구현됩니다.*
