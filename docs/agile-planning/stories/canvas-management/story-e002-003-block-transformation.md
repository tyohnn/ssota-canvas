# Story E002-003: 블럭 변환 (드래그, 리사이즈, 정렬)

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 블럭을 드래그하여 이동시키고 크기를 조절하며 여러 블럭을 정렬할 수 있어야 so that 원하는 레이아웃으로 시각적 요소를 정확히 배치하고 테스트할 수 있다

**Story Points**: 21pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

**핵심 범위**: 
- ✅ 블럭 드래그 이동 (React Flow 콜백 + 서버 저장)
- ✅ 블럭 리사이즈 (React Flow 콜백 + 서버 저장)
- ✅ 스냅 가이드라인 (드래그 중 표시)
- ✅ 다중 블럭 정렬/분포 (프론트엔드 계산 + 서버 저장)
- ✅ 뷰포트 제어 (줌/패닝)
- ❌ Z-Order 변경 (추후 스토리에서 처리)
- ❌ 블럭 삭제 (E002-008에서 처리)

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블럭 드래그 이동 (React Flow 콜백 패턴)
```gherkin
Given 사용자가 블럭을 선택한 상태이다 ('single-selection' 모드)
When 블럭을 드래그 시작한다
Then onNodeDragStart 콜백이 트리거된다
And useCanvasMode().enterDraggingMode([blockId])이 호출된다
And 캔버스 모드가 'dragging'으로 전환된다
And 스냅 가이드라인이 표시된다 (SnapGuidelines 컴포넌트)

When 드래그 중이다
Then React Flow가 실시간으로 블럭 위치를 업데이트한다 (자동)
And useCanvasSnapGuides().calculateSnapGuides()가 호출된다
And 5px 임계값 내 진입 시 스냅 가이드라인이 하이라이트된다

When 드래그를 종료한다
Then onNodeDragStop 콜백이 트리거된다
And useCanvasBlockTransform().saveBlockPosition(blockId, finalPosition)이 호출된다
And updateBlockPositionAction(blockMountId, finalPosition)이 서버로 전송된다
And 서버 성공 시 위치가 DB에 저장된다
And 서버 실패 시 원래 위치로 롤백되고 에러 Toast가 표시된다
And 캔버스 모드가 'single-selection'으로 복귀한다
And 스냅 가이드라인이 숨겨진다
```

### 시나리오 2: 블럭 리사이즈 (React Flow 콜백 패턴)
```gherkin
Given 사용자가 블럭을 선택한 상태이다 ('single-selection' 모드)
And 블럭에 리사이즈 핸들이 표시된다 (8방향)
When 리사이즈 핸들을 드래그한다
Then React Flow가 실시간으로 블럭 크기를 업데이트한다 (자동)
And 최소/최대 크기 제한이 적용된다

When 리사이즈를 종료한다
Then onNodeResizeEnd 콜백이 트리거된다
And useCanvasBlockTransform().saveBlockSize(blockId, finalSize)가 호출된다
And updateBlockSizeAction(blockMountId, finalSize)이 서버로 전송된다
And 서버 성공 시 크기가 DB에 저장된다
And 서버 실패 시 원래 크기로 롤백되고 에러 Toast가 표시된다
```

### 시나리오 3: 다중 블럭 정렬 (프론트엔드 계산 + 서버 저장)
```gherkin
Given 사용자가 다중 블럭을 선택한 상태이다 ('multi-selection' 모드)
And MultiSelectionToolbar가 표시된다
And SelectionBoundingBox가 선택 영역을 감싼다
When 좌측 정렬 버튼을 클릭한다
Then useCanvasBlockTransform().alignBlocks(blockIds, 'left')가 호출된다
And 프론트엔드에서 정렬 위치를 계산한다
And React Flow Store에 새로운 위치가 즉시 반영된다
And 블럭들이 정렬된 위치로 애니메이션된다 (500ms)

And 동시에 updateMultipleBlockPositionsAction(blockPositions[])이 호출된다
And 서버가 계산된 위치값들을 검증하고 DB에 저장한다
And 서버 실패 시 원래 위치로 롤백되고 에러 Toast가 표시된다
```

### 시나리오 4: 뷰포트 제어 (줌/패닝)
```gherkin
Given 사용자가 캔버스 페이지에 있다
When 마우스 휠을 스크롤한다
Then React Flow가 자동으로 줌 레벨을 조정한다
And useCanvasViewport().getZoomLevel()로 현재 줌 레벨을 읽을 수 있다

When 줌 인 버튼을 클릭한다
Then useCanvasViewport().zoomIn()이 호출된다
And React Flow Store 줌 레벨이 증가한다

When 페이지를 이탈한다
Then saveViewportStateAction(pageId, zoom, center)이 호출된다
And 뷰포트 상태가 DB에 저장된다
```

---

## 📋 개발 Task (Phase별)

### Phase 0: 기존 완료된 인프라 (재사용) ✅

**E002-001, E002-002에서 완료된 인프라** (재사용):
- [x] ✅ **Database Schema**: block_mounts 테이블 (position, size 컬럼 포함)
- [x] ✅ **Value Objects**: Position, Size VO (좌표/크기 계산 메서드 포함)
- [x] ✅ **Entities**: BlockMount Entity (기본 구조, transform 메서드 포함)
- [x] ✅ **Aggregates**: BlockMountAggregate (기본 구조, 이벤트 발행 포함)
- [x] ✅ **Repositories**: BlockMountRepository (findById, save 메서드)
- [x] ✅ **Service**: CanvasManagementService (기본 구조)
- [x] ✅ **Frontend 기본 구조**: CanvasReactFlowWrapper, useCanvasMode, useCanvasSelection

**기존 완료된 블럭 변형 관련 코드** (검증 및 활용):
- [x] ✅ **BlockMount Entity.transform() 메서드**
  - 파일: `src/domains/canvas-management/shared/entities/block-mount.entity.ts`
  - 이미 구현됨 (위치, 크기, z-order 업데이트 가능)
  - 🔄 **분리 필요**: `updateBlockPosition()`, `updateBlockSize()`, `updateBlockZOrder()` 개별 메서드로 분리

- [x] ✅ **Position VO 업데이트 메서드**
  - 파일: `src/domains/canvas-management/shared/value-objects/position.vo.ts`
  - `add()`, `subtract()`, `distanceTo()` 메서드 포함

- [x] ✅ **Size VO 업데이트 메서드**
  - 파일: `src/domains/canvas-management/shared/value-objects/size.vo.ts`
  - `resize()`, `getArea()`, `isValidSize()` 메서드 포함

- [x] ✅ **BlockMountAggregate 기본 구조**
  - 파일: `src/domains/canvas-management/shared/aggregates/block-mount.aggregate.ts`
  - 이벤트 발행 구조 및 기본 메서드 구현됨
  - 🔄 **확장 필요**: 개별 update 메서드들 추가

**기존 완료된 Frontend 컴포넌트** (확장 필요):
- [x] ✅ **CanvasReactFlowWrapper (기본 버전)**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
  - React Flow 인스턴스, 기본 이벤트 핸들러 구조
  - 🔄 **확장 필요**: 드래그/리사이즈 콜백, 모드별 UI 렌더링

- [x] ✅ **ViewportControls (읽기 전용 버전)**
  - 파일: `src/domains/canvas-management/frontend/components/viewport-controls.tsx`
  - 기본 UI 구조, 줌 레벨 표시
  - 🔄 **확장 필요**: 제어 메서드 연동

---

### Phase 1: Backend - Block Transform Server Actions ⭐ NEW

**참조 문서**: 
- [Technical Specification - Server Actions](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md#updateblockpositionaction)
- [Software Design - Scenario 2, 5](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md#업무-시나리오-연결-scenario-2-블럭-변환)

#### 1.1. Server Actions 구현
- [ ] **updateBlockPositionAction** ⭐ NEW
  - 파일: `src/domains/canvas-management/actions/block.actions.ts`
  - 입력: `{ blockMountId, newPosition, userId }`
  - 로직:
    1. 인증 확인
    2. CanvasManagementService.updateBlockPosition() 호출
    3. DTO 직렬화
  - 출력: `Result<BlockPositionUpdatedDTO>`

- [ ] **updateBlockSizeAction** ⭐ NEW
  - 입력: `{ blockMountId, newSize, userId }`
  - 로직: updateBlockPositionAction과 유사
  - 출력: `Result<BlockSizeUpdatedDTO>`

- [ ] **updateMultipleBlockPositionsAction** ⭐ NEW
  - 입력: `{ blockPositions: Array<{blockMountId, position}>, userId }`
  - 로직:
    1. 인증 확인
    2. CanvasManagementService.updateMultipleBlockPositions() 호출
    3. 배치 저장 (트랜잭션)
  - 출력: `Result<MultipleBlockPositionsUpdatedDTO>`

- [ ] **Server Actions 테스트** ⭐ NEW
  - 파일: `src/domains/canvas-management/actions/__tests__/block.actions.test.ts`
  - 테스트 케이스:
    - ✅ 인증되지 않은 요청 거부
    - ✅ 블럭 존재하지 않으면 에러
    - ✅ 위치/크기 유효성 검증
    - ✅ 다중 업데이트 트랜잭션 검증

#### 1.2. Service Layer 구현 (검증 및 확장)
- [ ] **CanvasManagementService 메서드 추가** (검증 필요)
  - 현재 상태 확인: `src/domains/canvas-management/application/services/canvas-management.service.ts`
  - 추가 필요: `updateBlockPosition()`, `updateBlockSize()`, `updateMultipleBlockPositions()`
  
- [ ] **Service 통합 테스트** (업데이트)
  - 기존 테스트 활용 가능
  - 테스트 케이스:
    - ✅ BlockMountRepository.findById() 호출 검증 (기존 메서드 활용)
    - ✅ BlockMountAggregate.updatePosition() 호출 검증 (새 메서드)
    - ✅ 다중 블럭 배치 저장 검증

#### 1.3. BlockMount Aggregate 확장 (기존 구조 활용)
- [x] ✅ **기존 transform() 메서드** (이미 구현됨)
  - 현재: 통합 메서드로 위치/크기/z-order 동시 업데이트 가능
  - 🔄 **분리 필요**: 개별 메서드로 분리하여 이벤트 세분화
  
- [ ] **Aggregate 메서드 추가** (분리 구현)
  - `updateBlockPosition(newPosition: Position)`: BlockPositionUpdated 이벤트 발행
  - `updateBlockSize(newSize: Size)`: BlockSizeUpdated 이벤트 발행
  - `updateBlockZOrder(newZOrder: ZOrder)`: BlockZOrderUpdated 이벤트 발행

- [x] ✅ **Aggregate 단위 테스트** (기존 구조 활용)
  - 기존 테스트 구조 재사용 가능
  - 테스트 케이스 추가 필요:
    - ✅ 위치 업데이트 시 이벤트 발행 (새 이벤트)
    - ✅ 크기 업데이트 시 이벤트 발행 (새 이벤트)
    - ✅ updatedAt 자동 갱신 (기존 검증 연장)

---

### Phase 2: Frontend - useCanvasBlockTransform Hook ⭐⭐⭐

**참조 문서**: 
- [Frontend Specification - useCanvasBlockTransform](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md#2-usecanvasblocktransform-layer-2)

#### 2.1. Hook 구현
- [ ] **useCanvasBlockTransform() Hook**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-block-transform.ts`
  - Props: `{ pageId: string }`
  - React Flow Hooks: `useReactFlow()`, `useNodesState()`
  - Server Actions: `updateBlockPositionAction`, `updateBlockSizeAction`, `updateMultipleBlockPositionsAction`
  - 의존성: React Flow Store (프로그램적 제어용), 서버 액션 (영구 저장용)
  
  - **프로그램적 제어** (AI Tool Call, 즉시 UI 반영):
    ```typescript
    setBlockPosition(blockId: BlockId, position: Position) {
      // React Flow Store 직접 업데이트
      const { setNodes } = useReactFlow();
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === blockId ? { ...node, position } : node
        )
      );
    }
    ```

  - **서버 연동** (React Flow 콜백용, 영구 저장):
    ```typescript
    async saveBlockPosition(blockId: BlockId, position: Position) {
      // 1. blockMountId 조회 (노드 데이터에서)
      // 2. updateBlockPositionAction 호출
      // 3. 실패 시 원래 위치로 롤백
    }
    ```

  - **블럭 정렬** (프론트엔드 계산 + 서버 저장):
    ```typescript
    async alignBlocks(blockIds: BlockId[], alignmentType: AlignmentType) {
      // 1. 선택된 블럭들의 현재 위치 조회
      // 2. 정렬 알고리즘 실행 (좌정렬, 우정렬 등)
      // 3. 새로운 위치 계산
      // 4. React Flow Store에 즉시 반영
      // 5. updateMultipleBlockPositions() 호출하여 서버 저장
      // 6. 실패 시 원래 위치로 롤백
    }
    ```

- [ ] **Hook 단위 테스트**
  - 파일: `src/domains/canvas-management/frontend/hooks/__tests__/use-canvas-block-transform.test.ts`
  - Mock: React Flow Hooks, Server Actions
  - 테스트 케이스:
    - ✅ setBlockPosition: React Flow Store 직접 업데이트
    - ✅ saveBlockPosition: 서버 호출 + 실패 시 롤백
    - ✅ alignBlocks: 정렬 계산 → UI 반영 → 서버 저장
    - ✅ 서버 실패 시 롤백 동작

---

### Phase 3: Frontend - useCanvasSnapGuides Hook ⭐⭐

#### 3.1. Hook 구현
- [ ] **useCanvasSnapGuides() Hook**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-snap-guidelines.ts`
  - Props: `{ nodes: Node[] }`
  - 상태: `useState<Guideline[]>([])` - 표시할 가이드라인 목록
  - 역할: 스냅 가이드라인 계산 및 표시
  
  - **주요 메서드**:
    ```typescript
    calculateSnapGuides(draggedBlockId: BlockId, currentPosition: Position) {
      const guidelines: Guideline[] = [];
      
      nodes.forEach(node => {
        if (node.id === draggedBlockId) return;
        
        // 중심선 스냅 (우선순위 높음)
        const centerDist = Math.abs(currentPosition.x - node.position.x);
        if (centerDist <= 5) {
          guidelines.push({ 
            type: 'center-vertical', 
            position: node.position.x, 
            priority: 'high' 
          });
        }
        
        // 가장자리 스냅 (우선순위 낮음)
        const edgeDist = Math.abs(
          currentPosition.x - (node.position.x + (node.width || 0))
        );
        if (edgeDist <= 5) {
          guidelines.push({ 
            type: 'edge-vertical', 
            position: node.position.x + (node.width || 0), 
            priority: 'low' 
          });
        }
      });
      
      setGuidelines(guidelines);
    }
    ```

- [ ] **Hook 단위 테스트**
  - 테스트 케이스:
    - ✅ 5px 임계값 내 가이드라인 생성
    - ✅ 중심선 우선순위 > 가장자리 우선순위
    - ✅ 가이드라인 표시/숨김

---

### Phase 4: Frontend - useCanvasViewport Hook ⭐⭐

#### 4.1. Hook 구현
- [ ] **useCanvasViewport() Hook**
  - 파일: `src/domains/canvas-management/frontend/hooks/use-canvas-viewport.ts`
  - React Flow Hooks: `useReactFlow()`, `useStore()`
  - Server Actions: `saveViewportStateAction`, `restoreViewportStateAction`
  - 역할: 뷰포트 상태 관리 (React Flow Store 활용)
  
  - **수동 제어**:
    ```typescript
    zoomIn() {
      const { zoomIn } = useReactFlow();
      zoomIn({ duration: 300 });
    }
    
    zoomOut() {
      const { zoomOut } = useReactFlow();
      zoomOut({ duration: 300 });
    }
    
    panTo(center: Position) {
      const { setCenter } = useReactFlow();
      setCenter(center.x, center.y, { duration: 500, zoom: 1.0 });
    }
    
    fitToScreen() {
      const { fitView } = useReactFlow();
      fitView({ duration: 500, padding: 0.1 });
    }
    ```

  - **상태 읽기**:
    ```typescript
    const viewport = useStore((state) => state.viewport);
    
    getZoomLevel() {
      return viewport.zoom;
    }
    
    getViewportCenter() {
      return { x: viewport.x, y: viewport.y };
    }
    ```

- [ ] **Hook 단위 테스트**
  - 테스트 케이스:
    - ✅ zoomIn/zoomOut 동작
    - ✅ panTo 애니메이션
    - ✅ fitToScreen 동작
    - ✅ 상태 읽기 메서드

---

### Phase 5: Frontend - UI 컴포넌트 구현 ⭐⭐⭐

#### 5.1. SnapGuidelines 컴포넌트
- [ ] **컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/snap-guidelines.tsx`
  - Hook: `useCanvasMode()`, `useCanvasSnapGuides()`
  - 렌더링 조건: `isDraggingMode() === true`
  - UI:
    - 수직/수평 가이드라인 (SVG 또는 div)
    - 중심선: 파란색 실선 (우선순위 높음)
    - 가장자리: 회색 점선 (우선순위 낮음)
    - 5px 임계값 내 하이라이트 효과

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ dragging 모드에서만 렌더링
    - ✅ 가이드라인 위치 계산
    - ✅ 우선순위별 스타일 차이

#### 5.2. MultiSelectionToolbar 컴포넌트
- [ ] **컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/multi-selection-toolbar.tsx`
  - Hook: `useCanvasMode()`, `useCanvasSelection()`, `useCanvasBlockTransform()`
  - 렌더링 조건: `isMultiSelectionMode() === true && getSelectionCount() >= 2`
  - UI:
    - 정렬 버튼들 (좌, 우, 상, 하, 중앙)
    - 분포 버튼들 (수평, 수직)
    - 복제/삭제 버튼 (비활성화, 추후 활성화)
  - 위치: 선택된 블럭들 영역 중앙 상단
  - 이벤트:
    - 정렬 버튼 클릭 → `alignBlocks(blockIds, alignmentType)` 호출
    - 분포 버튼 클릭 → `distributeBlocks(blockIds, direction)` 호출

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ multi-selection 모드에서만 렌더링
    - ✅ 정렬 버튼 클릭 시 alignBlocks 호출
    - ✅ 선택 영역 중앙 상단 위치 계산

#### 5.3. SelectionBoundingBox 컴포넌트
- [ ] **컴포넌트 구현**
  - 파일: `src/domains/canvas-management/frontend/components/selection-bounding-box.tsx`
  - Hook: `useCanvasMode()`, `useStore()`
  - 렌더링 조건: `isMultiSelectionMode() === true && getSelectionCount() >= 2`
  - UI:
    - 선택된 노드들의 경계 계산
    - 커스텀 바운딩 박스 렌더링
    - 테두리: 2px solid primary color
    - 배경: 반투명 (rgba)
  - CSS: `.react-flow.hide-default-selection .react-flow__selection { display: none !important; }`

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ multi-selection 모드에서만 렌더링
    - ✅ 선택된 노드들의 경계 계산
    - ✅ 기본 선택 박스 숨김 확인

#### 5.4. ViewportControls 컴포넌트 업데이트
- [ ] **컴포넌트 업데이트**
  - 파일: `src/domains/canvas-management/frontend/components/viewport-controls.tsx`
  - Hook: `useCanvasViewport()`
  - UI:
    - 줌 인/아웃 버튼
    - 현재 줌 레벨 표시 (예: 100%)
    - 원래 크기 버튼 (resetZoom)
    - Fit to Screen 버튼 (fitToScreen)
    - 미니맵 토글
  - 이벤트:
    - 줌 인 버튼 → `zoomIn()` 호출
    - 줌 아웃 버튼 → `zoomOut()` 호출
    - 원래 크기 → `resetZoom()` 호출
  - 🔄 **수정 필요**: E002-001의 읽기 전용 버전 → 제어 메서드 추가

- [ ] **컴포넌트 테스트**
  - 테스트 케이스:
    - ✅ 버튼 클릭 시 Hook 메서드 호출
    - ✅ 줌 레벨 표시 업데이트

---

### Phase 6: Frontend - React Flow Wrapper 통합 ⭐⭐⭐

#### 6.1. CanvasReactFlowWrapper 완전 업데이트
- [ ] **컴포넌트 대폭 업데이트**
  - 파일: `src/domains/canvas-management/frontend/components/canvas-react-flow-wrapper.tsx`
  - Hooks 추가:
    - `useCanvasMode()` - 모드 관리 (E002-002에서 확장)
    - `useCanvasBlockTransform(pageId)` - 블럭 변형
    - `useCanvasSnapGuides()` - 스냅 가이드
    - `useCanvasViewport()` - 뷰포트 제어
    - `useCanvasSelection()` - 선택 상태 (읽기 전용)
    - 🔄 **추후 추가**: `useCanvasEdgeManagement()` (엣지 연결 기능이 필요할 때)
  
  - **이벤트 핸들러 추가**:
    ```typescript
    // 드래그 시작 → 드래그 모드 진입
    const onNodeDragStart = useCallback((event, node, nodes) => {
      const draggedIds = nodes.map(n => n.id);
      enterDraggingMode(draggedIds);
    }, []);
    
    // 드래그 종료 → 위치 서버 저장
    const onNodeDragStop = useCallback((event, node, nodes) => {
      nodes.forEach(n => {
        saveBlockPosition(n.id, n.position);
      });
      
      // 이전 모드로 복귀 (single or multi selection)
      if (nodes.length === 1) {
        enterSingleSelectionMode(nodes[0].id);
      } else {
        enterMultiSelectionMode(nodes.map(n => n.id));
      }
    }, []);
    
    // 리사이즈 종료 → 크기 서버 저장
    const onNodeResizeEnd = useCallback((event, node) => {
      const newSize = { 
        width: node.width || 0, 
        height: node.height || 0 
      };
      saveBlockSize(node.id, newSize);
    }, []);
    ```

  - **모드별 UI 컴포넌트 렌더링 업데이트**:
    ```tsx
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      className="hide-default-selection"
      onNodeClick={onNodeClick}
      onSelectionChange={onSelectionChange}
      onPaneClick={onPaneClick}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onNodeResizeEnd={onNodeResizeEnd}
      nodeResizeEnabled={isSingleSelectionMode()}
    >
      <Background />
      <Controls />
      
      {/* 모드별 컴포넌트 */}
      {isBlockCreationMode() && <SkeletonBlock />}
      {isSingleSelectionMode() && <BlockMountToolbar />}
      {isMultiSelectionMode() && (
        <>
          <MultiSelectionToolbar />
          <SelectionBoundingBox />
        </>
      )}
      {isDraggingMode() && <SnapGuidelines />}
      
      <MiniMap />
    </ReactFlow>
    ```

  - 🔄 **수정 필요**: E002-001의 기본 버전 → 모든 이벤트 핸들러 및 모드별 렌더링 추가

---

### Phase 7: E2E Testing (사용자 시나리오) ⭐⭐⭐

#### 7.1. E2E 테스트 시나리오
- [ ] **블럭 드래그 플로우 테스트**
  - 파일: `src/__tests__/e2e/canvas/block-drag.spec.ts`
  - 시나리오:
    1. 페이지 접근, 블럭 생성 (E002-002 의존)
    2. 블럭 선택 (single-selection 모드 확인)
    3. 블럭 드래그 시작 (dragging 모드 전환 확인)
    4. 스냅 가이드라인 표시 확인
    5. 드래그 종료
    6. 서버 호출 확인 (updateBlockPositionAction)
    7. 새 위치로 블럭 렌더링 확인
    8. DB에 위치 저장 확인

- [ ] **블럭 리사이즈 플로우 테스트**
  - 시나리오:
    1. 블럭 선택
    2. 리사이즈 핸들 드래그
    3. 실시간 크기 변경 확인
    4. 리사이즈 종료
    5. 서버 호출 확인 (updateBlockSizeAction)
    6. 새 크기로 블럭 렌더링 확인
    7. DB에 크기 저장 확인

- [ ] **다중 블럭 정렬 플로우 테스트**
  - 시나리오:
    1. 다중 블럭 선택 (multi-selection 모드 확인)
    2. MultiSelectionToolbar 표시 확인
    3. SelectionBoundingBox 표시 확인
    4. 좌측 정렬 버튼 클릭
    5. 블럭들이 정렬된 위치로 애니메이션 확인
    6. 서버 호출 확인 (updateMultipleBlockPositionsAction)
    7. DB에 새 위치들 저장 확인

- [ ] **스냅 가이드라인 테스트**
  - 시나리오:
    1. 블럭 2개 생성 (수평 정렬 가능 위치)
    2. 블럭 1 드래그 시작
    3. 블럭 2와 5px 이내로 이동
    4. 중심선 가이드라인 표시 확인
    5. 스냅 하이라이트 효과 확인

- [ ] **뷰포트 제어 테스트**
  - 시나리오:
    1. 페이지 접근
    2. 줌 인 버튼 클릭 → 줌 증가 확인
    3. 마우스 휠 스크롤 → 줌 변경 확인
    4. 캔버스 드래그 → 패닝 확인
    5. Fit to Screen 버튼 → 모든 블럭 화면에 맞춤 확인

#### 7.2. 수동 테스트 체크리스트
- [ ] **드래그 플로우**
  - [ ] 블럭 선택 → 드래그 시작 → dragging 모드
  - [ ] 스냅 가이드라인 표시
  - [ ] 5px 임계값 내 진입 시 하이라이트
  - [ ] 드래그 종료 → 위치 저장 → single-selection 모드
  - [ ] 서버 실패 시 원래 위치로 롤백

- [ ] **리사이즈 플로우**
  - [ ] 블럭 선택 → 리사이즈 핸들 표시 (8방향)
  - [ ] 핸들 드래그 → 실시간 크기 변경
  - [ ] 최소/최대 크기 제한 적용
  - [ ] 리사이즈 종료 → 크기 저장
  - [ ] 서버 실패 시 원래 크기로 롤백

- [ ] **다중 정렬 플로우**
  - [ ] 다중 블럭 선택 (Shift+Click 또는 드래그)
  - [ ] multi-selection 모드 전환 확인
  - [ ] MultiSelectionToolbar 표시
  - [ ] SelectionBoundingBox 표시
  - [ ] 정렬 버튼 클릭 → 즉시 UI 반영
  - [ ] 500ms 애니메이션 확인
  - [ ] 서버 저장 확인

- [ ] **뷰포트 제어**
  - [ ] 줌 인/아웃 버튼 동작
  - [ ] 마우스 휠 줌 동작
  - [ ] 트랙패드/마우스 드래그 패닝
  - [ ] Fit to Screen 동작
  - [ ] 줌 레벨 표시 업데이트

---

## 🔄 기존 구현 수정 사항

### ✅ 기존 완료 작업 활용

**재사용 가능한 기존 코드**:
- [x] ✅ **BlockMount Entity.transform() 메서드**
  - 현재 상태: 통합 메서드로 위치/크기/z-order 동시 업데이트 가능
  - 활용: 기존 로직을 개별 메서드로 분리하여 재사용
  - 테스트: 기존 단위 테스트 구조 그대로 활용

- [x] ✅ **Position, Size Value Objects**
  - 현재 상태: 계산 메서드, 검증 로직, equals 메서드 모두 완료 (89개 테스트 통과)
  - 활용: 그대로 재사용, 추가 메서드 없음

- [x] ✅ **BlockMountRepository, Service 기본 구조**
  - 현재 상태: findById, save 메서드, 트랜잭션 처리 완료
  - 활용: 기존 구조에 새로운 메서드만 추가

### 🗑️ 제거할 것들 (기존 통합 Command만)
- [ ] ❌ **TransformBlockCommand 삭제**
  - 파일: `src/domains/canvas-management/shared/commands/transform-block.command.ts`
  - 이유: `UpdateBlockPositionCommand`, `UpdateBlockSizeCommand`로 분리됨
  - 대체: 기존 로직을 개별 Command로 분리

- [ ] ❌ **BlockTransformedEvent 통합** (이벤트만)
  - 이유: `BlockPositionUpdatedEvent`, `BlockSizeUpdatedEvent`, `BlockZOrderUpdatedEvent`로 분리됨
  - 🔄 **유지**: 기존 Aggregate 이벤트 발행 구조는 그대로 활용

- [x] ✅ **AlignBlocksCommand, DistributeBlocksCommand** (이미 없음)
  - 이유: 프론트엔드에서 계산하므로 서버 Command 불필요
  - 서버: `UpdateMultipleBlockPositionsCommand`만 처리

### 🔧 수정할 것들 (기존 구조 확장)

- [ ] 🔄 **BlockMountAggregate 확장** (기존 구조 활용)
  - **기존**: `transformBlock(position?, size?, zOrder?)` 통합 메서드 
  - **변경**: 개별 메서드 추가 (기존 메서드는 유지)
    - `updateBlockPosition(newPosition: Position)` 추가
    - `updateBlockSize(newSize: Size)` 추가  
    - `updateBlockZOrder(newZOrder: ZOrder)` 추가
  - **이벤트**: 기존 이벤트 발행 구조 활용, 이벤트 타입만 분리

- [ ] 🔄 **CanvasReactFlowWrapper 확장** (기존 구조 활용)
  - **기존**: 기본 React Flow 렌더링, 기본 이벤트 핸들러 (E002-001, E002-002)
  - **변경**: 이벤트 핸들러 추가
    - `onNodeDragStart`, `onNodeDragStop`, `onNodeResizeEnd` 추가
    - 모드별 UI 렌더링 추가 (SnapGuidelines, MultiSelectionToolbar)
  - **Hook 통합**: 기존 Hook들 + useCanvasBlockTransform, useCanvasSnapGuides

- [x] ✅ **BlockMountToolbar** (E002-002에서 완료)
  - 기존: 기본 UI만 (E002-002에서 구현 완료)
  - 변경: 실제 기능 연동 필요 없음 (단순 UI 컴포넌트)

**재사용 비율**: ~40% (Entity, Value Objects, Repository, 기본 Aggregate/Service 구조)

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 블럭 드래그로 위치 변경 (실시간 + 서버 저장)
- [ ] 블럭 리사이즈 기능 (실시간 + 서버 저장)
- [ ] 스냅 가이드라인 표시 (드래그 중)
- [ ] 다중 블럭 정렬/분포 (프론트엔드 계산 + 서버 저장)
- [ ] 뷰포트 제어 (줌/패닝/Fit to Screen)
- [ ] 드래그/리사이즈 실패 시 롤백

### 기술 완료
- [ ] useCanvasBlockTransform Hook 테스트 95% 이상
- [ ] useCanvasSnapGuides Hook 테스트 95% 이상
- [ ] useCanvasViewport Hook 테스트 95% 이상
- [ ] 컴포넌트 테스트 90% 이상
- [ ] Service Layer 통합 테스트 85% 이상
- [ ] Server Actions 통합 테스트 85% 이상
- [ ] E2E Tests 통과 (4개 시나리오)

### 품질 완료
- [ ] React Flow 콜백 패턴 적용 (onNodeDragStop, onNodeResizeEnd)
- [ ] Optimistic UI 패턴 검증 (즉시 반영 + 서버 호출)
- [ ] 롤백 메커니즘 동작 검증 (서버 실패 시)
- [ ] 모드별 UI 렌더링 검증 (dragging, multi-selection)
- [ ] 스냅 가이드라인 정확도 검증 (5px 임계값)
- [ ] 정렬 알고리즘 정확도 검증 (좌/우/상/하/중앙)
- [ ] 뷰포트 애니메이션 부드러움 검증 (300-500ms)
- [ ] 에러 처리 및 사용자 피드백 완료
- [ ] 코드 리뷰 완료

---

## 📊 진행 상황
**현재**: 25% (E002-001, E002-002 완료 인프라 + 기존 블럭 변형 코드 재사용 가능)

### 기존 완료 작업 (재사용 가능)
- [x] ✅ **E002-001, E002-002 완료 인프라**: GetCanvasViewQuery, ACL, Frontend 기본 구조, useCanvasMode, useCanvasSelection
- [x] ✅ **Database Schema**: block_mounts 테이블 (position, size 컬럼)
- [x] ✅ **Value Objects**: Position, Size VO (좌표/크기 계산 메서드, 89개 테스트 통과)
- [x] ✅ **Entities**: BlockMount Entity (transform 메서드 포함)
- [x] ✅ **Aggregates**: BlockMountAggregate (기본 구조, 이벤트 발행)
- [x] ✅ **Repositories**: BlockMountRepository (findById, save 메서드)
- [x] ✅ **Service**: CanvasManagementService (기본 구조)
- [x] ✅ **Frontend**: CanvasReactFlowWrapper (기본 버전), ViewportControls (읽기 전용 버전)

### 새로 구현 필요
- [ ] ⭐ **Server Actions**: updateBlockPositionAction, updateBlockSizeAction, updateMultipleBlockPositionsAction
- [ ] ⭐ **useCanvasBlockTransform**: 프로그램적 제어 + 서버 연동 + 정렬 알고리즘
- [ ] ⭐ **useCanvasSnapGuides**: 드래그 중 실시간 가이드라인 계산
- [ ] ⭐ **useCanvasViewport**: 뷰포트 제어 메서드 (zoomIn, zoomOut, panTo, fitToScreen)
- [ ] ⭐ **UI 컴포넌트**: SnapGuidelines, MultiSelectionToolbar, SelectionBoundingBox
- [ ] 🔄 **리팩토링**: BlockMount.transform() → 개별 메서드 분리, CanvasReactFlowWrapper 확장

### 변경 이유
- ❌ **기존 설계**: TransformBlock 통합 Command
- ✅ **새 설계**: 개별 Update Commands + React Flow 콜백 패턴
- ✅ **기존 활용**: BlockMount Entity, Value Objects, Repository 모두 재사용 가능

### 핵심 차이점
| 항목 | 기존 | 새 설계 |
|------|------|---------|
| 드래그 처리 | onNodesChange 사용 | onNodeDragStop 콜백 사용 |
| 정렬 처리 | 서버에서 계산 | 프론트엔드 계산 → 서버 저장 |
| Hook 구조 | useCanvasManagement 통합 | 개별 Hooks 분리 (Transform, Viewport 등) |
| 모드 관리 | 없음 | useCanvasMode Hook (독립적) |
| 스냅 가이드 | 서버 계산 | 프론트엔드 실시간 계산 |
| **재사용 코드** | ❌ | ✅ **BlockMount Entity, Position/Size VO, Repository 기본 구조** |

---

## 🔗 의존성
- **선행 Story**: E002-002 (블럭 생성 완료 필수)
- **블로킹**: E002-002 완료 전까지 블럭 드래그/리사이즈 테스트 불가
- **후행 Story**: 
  - E002-003 완료 시점에 사용자가 테스트 가능:
    - ✅ 블럭 생성
    - ✅ 블럭 드래그 이동
    - ✅ 블럭 리사이즈
    - ✅ 다중 선택 및 정렬
    - ✅ 스냅 가이드라인
    - ✅ 뷰포트 제어
  - E002-007 (엣지 생성) - 엣지 연결 기능 추가
  - E002-008 (블럭 삭제) - 삭제 기능 추가
- **도메인 의존성**: React Flow 라이브러리

---

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 2 (블럭 변환), Scenario 5 (정렬), Scenario 9 (뷰포트)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - useCanvasBlockTransform, useCanvasViewport
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - BlockMount Aggregate 메서드들
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - 모든 Hooks 및 컴포넌트
- [User Flow](../../../event-domain-design/domains/canvas-management-domain/03-user-flow.md) - Scenario 2, 5, 9 화면 흐름

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)

---

## 📝 구현 가이드

### TDD 순서
1. **Backend**: UpdateBlockPosition/Size Commands → Aggregate 메서드 → Service → Server Actions (TDD)
2. **Hooks**: useCanvasBlockTransform, useCanvasSnapGuides, useCanvasViewport (Mock 테스트)
3. **Components**: SnapGuidelines, MultiSelectionToolbar, SelectionBoundingBox (렌더링 테스트)
4. **통합**: CanvasReactFlowWrapper에 모든 이벤트 핸들러 연결
5. **E2E**: 드래그, 리사이즈, 정렬, 뷰포트 시나리오 테스트

### 정렬 알고리즘 구현 가이드
```typescript
// 좌측 정렬: 모든 블럭의 x를 최소 x로 설정
function alignLeft(blocks: Node[]): Position[] {
  const minX = Math.min(...blocks.map(b => b.position.x));
  return blocks.map(b => ({ ...b.position, x: minX }));
}

// 중앙 정렬: 모든 블럭의 중심 x를 평균 중심 x로 설정
function alignCenter(blocks: Node[]): Position[] {
  const centerX = blocks.reduce((sum, b) => 
    sum + b.position.x + (b.width || 0) / 2, 0
  ) / blocks.length;
  
  return blocks.map(b => ({
    x: centerX - (b.width || 0) / 2,
    y: b.position.y
  }));
}

// 수평 분포: 블럭들을 동일 간격으로 배치
function distributeHorizontal(blocks: Node[]): Position[] {
  const sorted = [...blocks].sort((a, b) => a.position.x - b.position.x);
  const totalWidth = sorted[sorted.length - 1].position.x - sorted[0].position.x;
  const gap = totalWidth / (sorted.length - 1);
  
  return sorted.map((b, i) => ({
    x: sorted[0].position.x + gap * i,
    y: b.position.y
  }));
}
```

### 주요 검증 포인트
- ✅ **React Flow 콜백**: onNodeDragStop, onNodeResizeEnd 동작
- ✅ **서버 연동**: 콜백 → Hook → Server Action → DB 저장
- ✅ **롤백**: 서버 실패 시 원래 상태 복원
- ✅ **스냅**: 5px 임계값, 우선순위 처리
- ✅ **정렬**: 프론트엔드 계산, 서버 저장, 애니메이션
- ✅ **모드 전환**: dragging ↔ single-selection ↔ multi-selection

---

*이 스토리 완료 후 사용자는 블럭을 자유롭게 배치하고 정렬하여 완전한 캔버스 레이아웃을 만들고 테스트할 수 있습니다! 🎨*
