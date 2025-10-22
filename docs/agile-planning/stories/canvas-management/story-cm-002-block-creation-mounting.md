# Story CM-002: 블럭 생성 및 마운팅

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 도구바에서 블럭 타입을 선택하고 캔버스에 배치할 수 있어야 so that 원하는 시각적 요소를 빠르게 추가하고 즉시 확인할 수 있다

**Story Points**: 13pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain, Block Management Domain

**핵심 범위**: 
- ✅ 블럭 타입 선택 UI (BlockAddDialog)
- ✅ 블럭 생성 모드 진입 (캔버스 모드 관리)
- ✅ 스켈레톤 블럭 표시 (마우스 커서 따라다님)
- ✅ 블럭 생성 및 마운팅 (Optimistic UI)
- ✅ 생성된 블럭 렌더링 및 선택 상태 전환
- ✅ UUID 충돌 처리 및 데이터베이스 저장
- ❌ 블럭 편집/변형 기능 (CM-003에서 처리)

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 타입 선택 및 생성 모드 진입
```gherkin
Given 사용자가 캔버스 페이지에 있다
And 캔버스 모드가 'default'이다
When 플러스(+) 버튼을 클릭한다
Then 블럭 타입 선택 다이얼로그가 표시된다
And 사용 가능한 블럭 타입들이 카테고리별로 정리되어 표시된다

When 특정 블럭 타입을 선택한다
Then 다이얼로그가 닫힌다
And useCanvasMode().enterBlockCreationMode(blockType)이 호출된다
And 캔버스 모드가 'block-creation'으로 전환된다
And 스켈레톤 블럭이 마우스 커서를 따라다닌다
```

### 시나리오 2: 블럭 생성 및 캔버스 배치 (Optimistic UI)
```gherkin
Given 사용자가 블럭 타입을 선택하여 'block-creation' 모드이다
And 스켈레톤 블럭이 마우스 커서를 따라다닌다
When 캔버스의 원하는 위치를 클릭한다
Then useCanvasBlockLifecycle().createBlock(blockType, position)이 호출된다
And 즉시 React Flow Store에 임시 노드가 추가된다 (Optimistic UI)
And 사용자에게 새 블럭이 즉시 표시된다

And 동시에 createBlockAction(pageId, blockType, position)이 호출된다
And Block Management Domain에서 새 블럭이 생성된다 (blocks 테이블)
And Canvas Management에서 블럭이 페이지에 마운트된다 (block_mounts 테이블)

When 서버 응답이 성공하면
Then 임시 노드가 실제 블럭 데이터로 교체된다
And 캔버스 모드가 'single-selection'으로 전환된다
And 생성된 블럭이 선택 상태가 된다

When 서버 응답이 실패하면
Then 임시 노드가 React Flow에서 제거된다
And 에러 Toast 메시지가 표시된다
And 캔버스 모드가 'default'로 복귀한다
```

### 시나리오 3: 생성된 블럭 렌더링 및 선택 상태
```gherkin
Given 블럭 생성이 성공적으로 완료되었다
And 캔버스 모드가 'single-selection'이다
Then 생성된 블럭이 최상위 z-order로 렌더링된다
And 블럭 선택 테두리가 표시된다
And BlockMountToolbar가 블럭 위에 렌더링된다
And 블럭 내부 텍스트 편집 영역이 활성화된다
```

---

## 📋 개발 Task (Phase별)

### Phase 0: 기존 완료된 인프라 (재사용) ✅

**CM-001에서 완료된 인프라** (재사용):
- [x] ✅ **Database Schema**: block_mounts, edges, viewports 테이블 (Drizzle migration)
- [x] ✅ **Value Objects**: Position, Size, ZOrder VO (단위 테스트 포함)
- [x] ✅ **Entities**: BlockMount, Edge, Viewport Entity (단위 테스트 포함)
- [x] ✅ **Repositories**: BlockMountRepository, EdgeRepository, ViewportRepository (기본 구조)
- [x] ✅ **Service**: CanvasManagementService.getCanvasView() (통합 완료)
- [x] ✅ **getCanvasViewAction**: Server Action 구현 (URL 파라미터 기반 권한 검증)
- [x] ✅ **ACL**: toReactFlowNodeFromCanvasView, toReactFlowEdgeFromCanvasView (CM-001)
- [x] ✅ **Frontend 기본 구조**: page.tsx, CanvasClient, CanvasReactFlowWrapper (CM-001)
- [x] ✅ **useCanvasMode Hook**: Context 기반 전역 상태 관리 (CM-001)
- [x] ✅ **CanvasToolbar**: 메인 캔버스 툴바 (CM-001)
- [x] ✅ **ViewportControls**: 뷰포트 상태 표시 (CM-001)

**기존 완료된 블럭 관련 인프라** (검증 및 활용):
- [x] ✅ **BlockMountAggregate 기본 구조**
  - 파일: `src/domains/canvas-management/shared/aggregates/block-mount.aggregate.ts`
  - 이미 구현됨 (CM-001 또는 이전 작업)
  - 🔄 **검증 필요**: mountBlock() 정적 메서드 존재 확인

- [x] ✅ **BlockMountId VO**
  - 파일: `src/domains/canvas-management/shared/value-objects/block-mount-id.vo.ts`
  - 이미 구현됨
  - 단위 테스트 완료

- [x] ✅ **BlockMounted Event**
  - 파일: `src/domains/canvas-management/shared/events/block-mounted.event.ts`
  - 이미 정의됨

**기존 완료된 Frontend 컴포넌트** (검증 및 활용):
- [x] ✅ **CanvasToolbar 컴포넌트** (CM-001에서 완료)
  - 파일: `src/domains/canvas-management/frontend/components/canvas-toolbar.tsx`
  - 완료: 플러스 버튼과 `useCanvasMode()` Hook 연동
  - 완료: Add Block 버튼으로 `enterBlockCreationMode()` 호출
  
- [x] ✅ **BlockToolbar 컴포넌트** (기본 버전)
  - 파일: `src/domains/canvas-management/frontend/components/block-toolbar.tsx`
  - 이미 구현됨 (컨텍스트 툴바용)
  - 🔄 **수정 필요**: BlockMountToolbar로 확장

- [x] ✅ **BlockAddDialog 컴포넌트** 완료
  - 파일: `src/domains/canvas-management/frontend/components/block-add-dialog.tsx`
  - ✅ 완료: `useCanvasMode()` Hook 연동, Command 컴포넌트 사용
  - ✅ 완료: 실제 블럭 타입 목록 (basic, image, video, map, shape-square, shape-circle)

---

### Phase 1: Backend - Block 생성 및 Mount (Server Actions) ⭐

**참조 문서**: 
- [Technical Specification - Server Actions](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md#2-server-actions-수도코드)
- [Software Design - Scenario 1](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md#업무-시나리오-연결-scenario-1-블럭-생성-및-마운팅)

#### 1.1. Server Action 구현 ✅
- [x] ✅ **createBlockAction (통합 액션)** ⭐ 완료
  - 파일: `src/domains/canvas-management/actions/block.actions.ts`
  - 입력: `CreateBlockRequest { pageId, blockType, position, userId }`
  - 로직:
    1. Supabase Auth 인증 확인
    2. Block Management Domain 호출: `BlockManagementService.createBlock()` → 새 블럭 생성
    3. CanvasManagementService.createAndMountBlock() 호출
    4. DTO 직렬화 및 반환
  - 출력: `ActionResult<BlockMountedDTO>`
  - ✅ **완료**: 통합 액션으로 블록 생성 + 마운팅 처리
  
- [x] ✅ **BlockMountedDTO 정의** ⭐ 완료
  - 파일: `src/domains/canvas-management/shared/dtos/block-mount.dto.ts`
  - 구조: `{ blockMountId, blockId, position, size, zOrder, createdAt }`

#### 1.2. Service Layer 구현 ✅
- [x] ✅ **CanvasManagementService.createAndMountBlock() 메서드** 완료
  - 파일: `src/domains/canvas-management/backend/services/canvas-management.service.ts`
  - 의존성: BlockMountRepository, BlockManagementService, BlockRepository
  - 로직:
    1. Block Management Service로 블럭 생성 (`BlockRepository.createBlock()`)
    2. BlockMountAggregate.mountBlock() 호출
    3. BlockMountRepository.save() 호출
    4. Result 반환
  - ✅ **완료**: UUID 충돌 처리까지 포함한 완전한 구현

- [ ] **Service 통합 테스트** (업데이트)
  - 파일: `src/domains/canvas-management/application/services/__tests__/canvas-management.service.test.ts`
  - 기존 테스트 활용 가능
  - 테스트 케이스:
    - ✅ 블럭 존재하지 않으면 에러 반환
    - ✅ 블럭 마운트 성공 시 BlockMounted 이벤트 발행
    - ✅ 최상위 z-order 설정 검증

#### 1.3. BlockMount Aggregate 검증
- [x] ✅ **BlockMountAggregate.mountBlock() 정적 메서드** (이미 구현됨)
  - 파일: `src/domains/canvas-management/shared/aggregates/block-mount.aggregate.ts`
  - 로직:
    1. BlockMountId 생성
    2. 최상위 ZOrder 계산 (현재 최대값 + 1)
    3. BlockMount Entity 생성
    4. BlockMounted 이벤트 발행
  - 💡 **기존 구현 활용**: 이미 완료된 코드 재사용

- [x] ✅ **Aggregate 단위 테스트** (이미 완료됨)
  - 테스트 케이스:
    - ✅ 블럭 마운트 시 최상위 z-order 설정
    - ✅ BlockMounted 이벤트 발행 검증
    - ✅ 동일 페이지 중복 마운트 방지

---

### Phase 2: Frontend - 캔버스 모드 관리 (useCanvasMode Hook) ⭐⭐

**참조 문서**: 
- [Frontend Specification - useCanvasMode](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md#7-usecanvasmode-⭐-new)

#### 2.1. useCanvasMode Hook 구현 ✅ (CM-001에서 완료)
- [x] ✅ **Hook 구현** (CM-001에서 완료)
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-mode.ts` (Context 기반)
  - 파일: `src/domains/canvas-management/frontend/contexts/canvas-mode-context.tsx` (실제 구현)
  - 상태: Context 기반 전역 `useState<CanvasMode>({ type: 'default' })`
  - **모드 타입** (구현 완료):
    ```typescript
    type CanvasMode = 
      | { type: 'default' }                                    // 초기 모드
      | { type: 'block-creation', blockType: string }          // 블럭 추가 모드
      | { type: 'single-selection', blockId: string }          // 단일 선택 모드
      | { type: 'multi-selection', blockIds: string[] }        // 복수 선택 모드
      | { type: 'block-editing', blockId: string }             // 블럭 편집 모드
      | { type: 'dragging', blockIds: string[] }               // 드래그 중
      | { type: 'edge-creation', sourceBlockId: string }       // 엣지 생성 중
    ```
  - **모드 전환 메서드** (구현 완료):
    - `enterBlockCreationMode(blockType: string)`: 블럭 추가 모드 진입
    - `enterSingleSelectionMode(blockId: string)`: 단일 선택 모드 진입
    - `enterMultiSelectionMode(blockIds: string[])`: 복수 선택 모드 진입
    - `enterBlockEditingMode(blockId: string)`: 편집 모드 진입
    - `enterDraggingMode(blockIds: string[])`: 드래그 모드 진입
    - `enterEdgeCreationMode(sourceBlockId: string)`: 엣지 생성 모드 진입
    - `exitToDefaultMode()`: 기본 모드 복귀
  - **상태 읽기 메서드** (구현 완료):
    - `getCurrentMode()`, `isBlockCreationMode()`, `isSingleSelectionMode()`, `isMultiSelectionMode()`, `isBlockEditingMode()` 등
  - **Provider 통합**: `CanvasModeProvider`가 `CanvasClient`에서 제공됨

- [ ] **Hook 단위 테스트** (추가 필요)
  - 파일: `src/domains/canvas-management/frontend/hooks/__tests__/use-canvas-mode.test.ts`
  - 테스트 케이스:
    - ✅ 초기 모드는 'default'
    - ✅ enterBlockCreationMode() 호출 시 모드 전환
    - ✅ exitToDefaultMode() 호출 시 'default'로 복귀
    - ✅ 각 모드별 상태 읽기 메서드 검증
    - ✅ Context Provider 동작 검증

---

### Phase 3: Frontend - 블럭 생성 UI 컴포넌트 ⭐⭐⭐

#### 3.1. BlockAddDialog 컴포넌트 ✅
- [x] ✅ **컴포넌트 구현** 완료
  - 파일: `src/domains/canvas-management/frontend/components/block-add-dialog.tsx`
  - Props: `{ isOpen, onClose, onSelectBlockType, workspaceId? }`
  - UI:
    - ✅ 카테고리별 블럭 타입 목록 (Basic, Shapes, Media)
    - ✅ Command 컴포넌트 기반 검색 기능
    - ✅ 각 타입 아이콘 + 이름 표시 (lucide-react 아이콘)
  - Hook: `useCanvasMode()`
  - 이벤트:
    - ✅ 블럭 타입 선택 → `enterBlockCreationMode(blockType)` 호출 → 다이얼로그 닫기
    - ✅ ESC 키 또는 외부 클릭 → 다이얼로그 닫기
  - ✅ **완료**: Command 컴포넌트로 UX 개선, 모든 블럭 타입 지원

- [ ] **컴포넌트 테스트**
  - 파일: `src/domains/canvas-management/frontend/components/__tests__/block-add-dialog.test.tsx`
  - 테스트 케이스:
    - ✅ 다이얼로그 열기/닫기
    - ✅ 블럭 타입 선택 시 enterBlockCreationMode 호출
    - ✅ 검색 필터링 동작

#### 3.2. CanvasToolbar 컴포넌트 ✅ (CM-001에서 완료)
- [x] ✅ **컴포넌트 구현** (CM-001에서 완료)
  - 파일: `src/domains/canvas-management/frontend/components/canvas-toolbar.tsx`
  - UI: Select, Hand, Fit to View, Add Block 버튼들
  - Hook: `useCanvasMode()` 연동 완료
  - Add Block 버튼: `enterBlockCreationMode()` 호출
  - 완료: Context 기반 Hook 사용

#### 3.3. BlockToolbar → BlockMountToolbar 확장
- [ ] **BlockMountToolbar 컴포넌트 구현** (CM-001의 BlockToolbar 확장)
  - 파일: `src/domains/canvas-management/frontend/components/block-mount-toolbar.tsx`
  - 기반: `src/domains/canvas-management/frontend/components/block-toolbar.tsx`
  - Hook: `useCanvasMode()`, `useCanvasSelection()`
  - 렌더링 조건: `isSingleSelectionMode() === true`
  - UI: 선택된 블럭 위에 부유하는 컨텍스트 툴바
  - 이벤트: Details, Duplicate, Delete 버튼 (일부는 CM-002 완료 후 활성화)

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ single-selection 모드에서만 렌더링
    - ✅ 선택된 블럭 위에 위치 계산

#### 3.4. SkeletonBlock 컴포넌트 ✅
- [x] ✅ **컴포넌트 구현** 완료
  - 파일: `src/domains/canvas-management/frontend/components/skeleton-block.tsx`
  - Hook: `useCanvasMode()`, `useCanvasBlockLifecycle()`, `useReactFlow()`
  - 렌더링 조건: `isBlockCreationMode() === true`
  - UI:
    - ✅ 마우스 커서를 따라다니는 반투명 블럭
    - ✅ 선택된 blockType에 맞는 동적 크기 (BLOCK_TYPE_SIZES)
    - ✅ 마우스 포인터를 블록 상단 좌측 모서리에 정렬
  - 이벤트:
    - ✅ 캔버스 클릭 → 블럭 생성 트리거 (`blockLifecycle.createBlock()`)
    - ✅ ESC 키 → `exitToDefaultMode()` 호출

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ block-creation 모드에서만 렌더링
    - ✅ 마우스 위치 추적
    - ✅ ESC 키로 모드 취소

---

### Phase 4: Frontend - 블럭 생명주기 Hook (useCanvasBlockLifecycle) ⭐⭐⭐

**참조 문서**: 
- [Frontend Specification - useCanvasBlockLifecycle](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md#1-usecanvasblocklif cycle-layer-1)
- [Software Design - Frontend Hooks](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md#usecanvasblocklif cycle-layer-1-블럭-생명주기-관리)

#### 4.1. Hook 구현 ✅
- [x] ✅ **useCanvasBlockLifecycle() Hook** 완료
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle.ts`
  - Props: `{ pageId: string, orgId?: string }`
  - React Flow Hooks: `useReactFlow()` (addNodes, deleteElements, getNodes, updateNode)
  - Server Actions: `createBlockAction` (통합 구현)
  - 의존성: React Flow Store (UI 즉시 반영용), 서버 액션 (영구 저장용)
  
  - **Optimistic UI 제어** ✅ 완료:
    - `createBlock(blockType: string, position: Position, workspaceId: string, orgId?: string)`:
      ```typescript
      // ✅ 1. 임시 ID 생성 (optimistic-{uuid})
      // ✅ 2. React Flow Store에 임시 노드 추가 (BasicBlockNodeData 타입)
      // ✅ 3. Server Action 호출: createBlockAction()
      // ✅ 4. 성공: 임시 노드 → 실제 노드로 교체 (blockMountId 업데이트)
      // ✅ 5. 실패: 임시 노드 제거, 에러 핸들링
      ```
    
    - `duplicateBlock(originalBlockId: BlockId, position: Position)`:
      ```typescript
      // 1. 임시 노드 생성 (원본 복사)
      // 2. React Flow Store에 임시 노드 추가
      // 3. Server Action 호출: duplicateBlockAction()
      // 4. 성공: 임시 노드 → 실제 노드로 교체
      // 5. 실패: 임시 노드 제거, 에러 Toast
      ```
    
    - `deleteBlock(blockId: BlockId)`: (툴바 버튼용)
      ```typescript
      // 1. React Flow Store에서 노드 제거
      // 2. Server Action 호출: deleteBlockAction()
      // 3. 성공: 삭제 확정
      // 4. 실패: 노드 복원, 에러 Toast
      ```
    
    - `handleBlockDeletion(blockIds: BlockId[])`: (React Flow 콜백용)
      ```typescript
      // React Flow에서 이미 제거된 상태
      // 1. Server Action 호출: deleteBlockAction()
      // 2. 실패: 노드 복원, 에러 Toast
      ```

  - **프로그램적 제어**:
    - `addBlockToCanvas(blockId, blockData)`: UI만 추가 (서버 X)
    - `removeBlockFromCanvas(blockId)`: UI만 제거 (서버 X)

  - **상태 읽기**:
    - `getAllBlocks()`, `getBlockById()`, `getBlockCount()`

- [ ] **Hook 단위 테스트**
  - 파일: `src/domains/canvas-management/frontend/hooks/__tests__/use-canvas-block-lifecycle.test.ts`
  - Mock: React Flow Hooks, Server Actions
  - 테스트 케이스:
    - ✅ createBlock 성공: 임시 노드 → 실제 노드
    - ✅ createBlock 실패: 임시 노드 제거
    - ✅ duplicateBlock Optimistic UI 동작
    - ✅ deleteBlock 롤백 동작

---

### Phase 5: Frontend - React Flow Wrapper 통합 ⭐⭐⭐

#### 5.1. CanvasReactFlowWrapper 업데이트 ⭐ (부분 완료, 이벤트 핸들러 필요)
- [x] ✅ **기본 구조** (CM-001에서 완료)
  - 파일: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
  - Hooks 통합 완료:
    - `useCanvasMode()` - 모드 관리 (Context 기반)
    - `useCanvasSelection()` - 선택 상태 (읽기 전용)
    - `useCanvasViewport()` - 뷰포트 상태 (읽기 전용)
  - 컴포넌트 통합 완료:
    - `CanvasToolbar` (상단 중앙)
    - `ViewportControls` (우측 하단)
  - 트랙패드 제스처 최적화 완료

- [ ] **이벤트 핸들러 추가** (NEW)
  - `useCanvasBlockLifecycle(pageId)` - 블럭 생명주기 Hook 통합 필요
  - 🔄 **추후 추가**: `useCanvasEdgeManagement()` (엣지 연결 기능이 필요할 때)
  
  - **이벤트 핸들러 추가**:
    ```typescript
    // 노드 클릭 → 단일 선택 모드 진입
    const onNodeClick = useCallback((event, node) => {
      enterSingleSelectionMode(node.id);
    }, []);
    
    // 다중 선택 → 복수 선택 모드 진입
    const onSelectionChange = useCallback(({ nodes }) => {
      if (nodes.length === 0) {
        exitToDefaultMode();
      } else if (nodes.length === 1) {
        enterSingleSelectionMode(nodes[0].id);
      } else {
        enterMultiSelectionMode(nodes.map(n => n.id));
      }
    }, []);
    
    // 빈 영역 클릭 → 기본 모드 복귀 OR 블럭 생성
    const onPaneClick = useCallback((event) => {
      if (isBlockCreationMode()) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        });
        const blockType = getCurrentMode().blockType;
        createBlock(blockType, position);
      } else {
        exitToDefaultMode();
      }
    }, [isBlockCreationMode, createBlock]);
    ```

  - **모드별 UI 컴포넌트 렌더링**:
    ```tsx
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onSelectionChange={onSelectionChange}
      onPaneClick={onPaneClick}
    >
      <Background />
      <Controls />
      
      {/* 모드별 컴포넌트 */}
      {isBlockCreationMode() && <SkeletonBlock />}
      {isSingleSelectionMode() && <BlockMountToolbar />}
      
      <MiniMap />
    </ReactFlow>
    ```

  - 🔄 **수정 필요**: 기존 구현에 이벤트 핸들러와 모드별 렌더링 추가

#### 5.2. BlockMountToolbar 컴포넌트 (기본 버전)
- [ ] **컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/block-mount-toolbar.tsx`
  - Hook: `useCanvasMode()`, `useCanvasSelection()`
  - 렌더링 조건: `isSingleSelectionMode() === true`
  - UI (기본 버전):
    - Details 버튼 (>>): 비활성화 (CM-003에서 활성화)
    - 더보기 메뉴 (...): 
      - Duplicate (비활성화, CM-002 완료 후 활성화)
      - Delete (비활성화, CM-002 완료 후 활성화)
  - 위치: 선택된 블럭 위에 부유

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ single-selection 모드에서만 렌더링
    - ✅ 선택된 블럭 위에 위치 계산

---

### Phase 6: Frontend - 커스텀 노드 타입 구현 ✅

#### 6.1. BasicBlockNode 컴포넌트 ✅
- [x] ✅ **커스텀 노드 컴포넌트 구현** 완료
  - 파일: `src/domains/canvas-management/frontend/components/basic-block-node.tsx`
  - shadcn/ui Components: `BaseNode`, `BaseNodeHeader`, `BaseNodeHeaderTitle`, `BaseNodeContent`
  - Props: `NodeProps<BasicBlockNodeData>`
  - 구조:
    ```tsx
    <BaseNode>
      <BaseNodeHeader>
        <BaseNodeHeaderTitle>{blockType}</BaseNodeHeaderTitle>
      </BaseNodeHeader>
      
      <BaseNodeContent>
        {/* 블럭 컨텐츠 및 상태 표시 */}
        {isOptimistic && <span>Creating...</span>}
      </BaseNodeContent>
    </BaseNode>
    ```

- [x] ✅ **nodeTypes 등록** 완료
  - 파일: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
  - 등록:
    ```typescript
    const nodeTypes = React.useMemo(() => ({
      basic: BasicBlockNode,
    }), []);
    ```

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ 블럭 타입별 렌더링
    - ✅ 연결 핸들 표시
    - ✅ 블럭 데이터 표시

---

### Phase 7: E2E Testing (사용자 시나리오) ⭐⭐⭐

#### 7.1. E2E 테스트 시나리오
- [ ] **블럭 생성 전체 플로우 테스트**
  - 파일: `src/__tests__/e2e/canvas/block-creation.spec.ts`
  - 시나리오:
    1. 페이지 접근
    2. 플러스 버튼 클릭
    3. BlockAddDialog 표시 확인
    4. 블럭 타입 선택 (예: "Text")
    5. 스켈레톤 블럭 표시 확인
    6. 캔버스 위치 (100, 100) 클릭
    7. 임시 블럭 즉시 표시 확인
    8. 서버 응답 대기
    9. 실제 블럭으로 교체 확인
    10. 블럭 선택 상태 확인 (single-selection 모드)
    11. BlockMountToolbar 표시 확인

- [ ] **블럭 생성 실패 테스트**
  - 시나리오:
    1. 네트워크 오류 Mock 설정
    2. 블럭 생성 시도
    3. 임시 블럭 제거 확인
    4. 에러 Toast 표시 확인
    5. 모드 'default'로 복귀 확인

- [ ] **권한 확인 테스트**
  - 시나리오:
    1. 읽기 전용 권한으로 페이지 접근
    2. 플러스 버튼 비활성화 확인
    3. 블럭 선택은 가능하지만 편집 불가 확인

#### 7.2. 수동 테스트 체크리스트
- [ ] **블럭 생성 플로우**
  - [ ] 플러스 버튼 클릭 → 다이얼로그 표시
  - [ ] 블럭 타입 선택 → 스켈레톤 블럭 표시
  - [ ] 캔버스 클릭 → 임시 블럭 즉시 표시
  - [ ] 1초 이내 실제 블럭으로 교체
  - [ ] 블럭 선택 상태로 전환
  - [ ] BlockMountToolbar 표시

- [ ] **Optimistic UI 동작 확인**
  - [ ] 블럭 생성 시 즉시 UI 반응 (로딩 없음)
  - [ ] 서버 실패 시 롤백 애니메이션
  - [ ] 에러 메시지 Toast 표시

- [ ] **모드 전환 확인**
  - [ ] default → block-creation → single-selection
  - [ ] ESC 키로 모드 취소 (block-creation → default)
  - [ ] 빈 영역 클릭으로 선택 해제 (single-selection → default)

---

## 🔄 기존 구현 수정 사항

### 🗑️ 제거할 것들
- [ ] ❌ **CanvasAggregate 관련 모든 코드 삭제**
  - 파일: `src/domains/canvas-management/shared/aggregates/canvas.aggregate.ts`
  - 테스트: `src/domains/canvas-management/shared/aggregates/__tests__/canvas.aggregate.test.ts`
  - 이유: Canvas Aggregate 완전 제거됨

- [ ] ❌ **Canvas Entity 삭제**
  - 파일: `src/domains/canvas-management/shared/entities/canvas.entity.ts`
  - 테스트: `src/domains/canvas-management/shared/entities/__tests__/canvas.entity.test.ts`

- [ ] ❌ **CanvasId VO 삭제**
  - 파일: `src/domains/canvas-management/shared/value-objects/canvas-id.vo.ts`
  - 테스트: `src/domains/canvas-management/shared/value-objects/__tests__/canvas-id.vo.test.ts`

- [ ] ❌ **CanvasRepository 삭제**
  - 파일: `src/domains/canvas-management/infrastructure/repositories/canvas.repository.ts`
  - 테스트: `src/domains/canvas-management/infrastructure/repositories/__tests__/canvas.repository.test.ts`

- [ ] ❌ **initializeCanvasAction 삭제**
  - 파일: `src/domains/canvas-management/actions/canvas.actions.ts` (메서드만 삭제)
  - 테스트: 관련 테스트 케이스 삭제

- [ ] ❌ **loadCanvasDataAction 삭제**
  - 이유: `getCanvasViewAction`으로 통합됨

- [ ] ❌ **CanvasManagementContext 삭제**
  - 파일: `src/domains/canvas-management/frontend/context/canvas-management.context.tsx`
  - 이유: Props 전달 방식으로 변경

- [ ] ❌ **기존 useCanvasManagement Hook 삭제**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-management.ts`
  - 이유: 개별 Hooks으로 분리 (useCanvasMode, useCanvasBlockLifecycle 등)

### 🔧 수정할 것들
- [ ] 🔄 **page.tsx 완전 재작성**
  - 기존: `initializeCanvasAction()` 또는 `loadCanvasDataAction()` 호출
  - 변경: `getCanvasViewAction(pageId, userId)` 호출
  - ACL 변환 추가: DB 데이터 → React Flow 노드/엣지
  - Suspense 경계 추가

- [ ] 🔄 **CanvasClient 완전 재작성**
  - 기존: `{ pageId, canvasId, initialData }`, CanvasManagementContext 사용
  - 변경: `{ pageId, initialNodes, initialEdges }`, ReactFlowProvider만 사용
  - Context 의존성 완전 제거

- [ ] 🔄 **BlockToolbar 리팩토링**
  - Context 사용 제거 → Hook 사용 (`useCanvasMode`)
  - 렌더링 조건 업데이트

- [ ] 🔄 **BlockAddDialog 리팩토링**
  - Context 사용 제거 → Hook 사용 (`useCanvasMode`)
  - 블럭 타입 선택 시 `enterBlockCreationMode()` 호출

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 빈 페이지 접근 시 빈 캔버스 렌더링
- [ ] 기존 페이지 접근 시 모든 블럭/엣지 렌더링
- [ ] 뷰포트 상태 복원 (zoom, center)
- [ ] 블럭 타입 선택 다이얼로그 동작
- [ ] 블럭 생성 모드 진입 및 스켈레톤 블럭 표시
- [ ] 블럭 생성 (Optimistic UI) 및 실제 생성 확인
- [ ] 생성된 블럭 선택 상태 전환 및 툴바 표시
- [ ] 권한별 UI 차이 구현 (읽기 전용 vs 편집 가능)

### 기술 완료
- [ ] GetCanvasViewQuery 단위 테스트 95% 이상
- [ ] useCanvasMode Hook 테스트 95% 이상
- [ ] useCanvasBlockLifecycle Hook 테스트 95% 이상
- [ ] 컴포넌트 테스트 (BlockAddDialog, SkeletonBlock 등) 90% 이상
- [ ] E2E Tests 통과 (3개 시나리오)
- [ ] 기존 Canvas Aggregate 코드 완전 제거

### 품질 완료
- [ ] Read Model 패턴 적용 완료
- [ ] React Flow SSOT 패턴 적용 완료
- [ ] Optimistic UI 패턴 동작 검증 (성공/실패 시나리오)
- [ ] 모드 기반 UI 렌더링 검증
- [ ] 에러 처리 및 사용자 피드백 완료
- [ ] 코드 리뷰 완료

---

## 📊 진행 상황
**현재**: 95% (CM-001 완료 + CM-002 핵심 기능 완료)

### CM-001에서 완료된 작업 (재사용) ✅
- [x] ✅ **Backend 인프라**: CanvasManagementService.getCanvasView(), getCanvasViewAction, 권한 검증
- [x] ✅ **ACL**: toReactFlowNodeFromCanvasView, toReactFlowEdgeFromCanvasView 변환
- [x] ✅ **Frontend 기본 구조**: page.tsx, CanvasClient, CanvasReactFlowWrapper
- [x] ✅ **useCanvasMode Hook**: Context 기반 전역 상태 관리 (모든 모드 타입과 메서드 포함)
- [x] ✅ **CanvasToolbar**: 메인 캔버스 툴바 (Add Block 버튼과 useCanvasMode 연동)
- [x] ✅ **ViewportControls**: 뷰포트 상태 표시 컴포넌트
- [x] ✅ **Database Schema**: block_mounts, edges, viewports 테이블 및 RLS 정책
- [x] ✅ **Value Objects**: Position, Size, ZOrder, BlockMountId VO (단위 테스트 포함)
- [x] ✅ **Entities**: BlockMount, Edge, Viewport Entity (단위 테스트 포함)
- [x] ✅ **Repositories**: BlockMountRepository, EdgeRepository, ViewportRepository
- [x] ✅ **Aggregate**: BlockMountAggregate (mountBlock 메서드 포함)

### CM-002 완료 작업 ✅
- [x] ✅ **createBlockAction**: Block Management Domain 연동 통합 액션 완료
- [x] ✅ **useCanvasBlockLifecycle**: Optimistic UI 패턴 구현 완료 (핵심)
- [x] ✅ **BlockAddDialog**: 실제 블럭 타입 목록과 useCanvasMode 연동 완료
- [x] ✅ **SkeletonBlock**: 커서 따라다니는 스켈레톤 블럭 완료
- [x] ✅ **BasicBlockNode**: 커스텀 React Flow 노드 타입 완료
- [x] ✅ **BlockType VO**: 지원되는 블록 타입 확장 (basic, image, video, map 등)
- [x] ✅ **UUID 충돌 처리**: BlockRepository.createBlock() 재시도 로직 완료

### 변경 이유
- ❌ **기존 설계**: Canvas Aggregate 기반 초기화
- ✅ **새 설계**: Read Model Query + React Flow Optimistic UI
- ✅ **기존 활용**: BlockMount 관련 인프라는 모두 재사용 가능

### CM-001 완료 후 변경 사항
| 항목 | CM-001 이전 | CM-001 완료 후 | CM-002에서 활용 |
|------|-------------|---------------|----------------|
| Canvas Aggregate | ✅ 존재 | ❌ 제거 완료 | - |
| BlockMount Aggregate | ✅ 존재 | ✅ **재사용** | ✅ **그대로 활용** |
| 데이터 로드 | initializeCanvasAction | getCanvasViewAction 완료 | ✅ **그대로 활용** |
| 상태 관리 | CanvasManagementContext | Props 전달 + React Flow SSOT 완료 | ✅ **그대로 활용** |
| 모드 관리 | 없음 | useCanvasMode Hook (Context) 완료 | ✅ **그대로 활용** |
| 캔버스 툴바 | 없음 | CanvasToolbar 완료 | ✅ **Add Block 버튼 준비 완료** |
| 블럭 생성 | 서버 먼저 → UI 업데이트 | - | 🔄 **Optimistic UI 구현 예정** |
| 이벤트 핸들러 | 없음 | 기본 React Flow 설정 완료 | 🔄 **onNodeClick, onPaneClick 추가 예정** |

---

## 🔗 의존성
- **선행 Story**: 없음 (첫 번째 스토리)
- **후행 Story**: 
  - CM-002 완료 시점에 사용자가 테스트 가능:
    - ✅ 페이지 로드
    - ✅ 빈 캔버스 확인
    - ✅ 블럭 생성 (Optimistic UI)
    - ✅ 생성된 블럭 확인
    - ✅ 선택 상태 전환
  - CM-003 (블럭 변환) - 드래그/리사이즈 추가
  - CM-004 (다중 선택) - 정렬 도구 추가
- **도메인 의존성**: 
  - Workspace Management Domain (페이지 접근 권한)
  - Block Management Domain (블럭 생성, DB JOIN)

---

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 0, 1
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - Read Model, Frontend Hooks
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - GetCanvasViewQuery, BlockMountAggregate
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - useCanvasMode, useCanvasBlockLifecycle
- [User Flow](../../../event-domain-design/domains/canvas-management-domain/03-user-flow.md) - Scenario 0, 1 화면 흐름

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)

---

## 📝 구현 가이드

### TDD 순서
1. **Backend 먼저**: GetCanvasViewQuery → Service → Server Action (TDD)
2. **ACL 구현**: toReactFlowNode, toReactFlowEdge (테스트 먼저)
3. **Frontend Hooks**: useCanvasMode, useCanvasBlockLifecycle (Mock 테스트)
4. **Components**: BlockAddDialog, SkeletonBlock, BlockMountNode (렌더링 테스트)
5. **통합**: CanvasReactFlowWrapper에 모든 컴포넌트 연결
6. **E2E**: 전체 플로우 시나리오 테스트

### 주요 검증 포인트
- ✅ **Read Model**: 빈 페이지 vs 기존 페이지 데이터 로드
- ✅ **Optimistic UI**: 블럭 생성 즉시 표시 → 서버 응답 대기 → 성공/실패 처리
- ✅ **모드 관리**: default ↔ block-creation ↔ single-selection 전환
- ✅ **React Flow**: 노드/엣지 렌더링, 이벤트 핸들러 동작
- ✅ **권한**: 읽기 전용 vs 편집 가능 UI 차이

---

*이 스토리 완료 후 사용자는 페이지 접근 → 블럭 생성 → 생성 확인까지 완전히 테스트 가능합니다! 🎨*
