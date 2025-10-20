# Sprint 008: Canvas Management Foundation

## 🎯 Sprint 개요
**목표**: 캔버스 데이터 렌더링부터 블럭 생성/변형까지 완성하여 사용자가 무한 캔버스에서 완전한 블럭 레이아웃 작업을 할 수 있도록 한다  
**기간**: 2025-10-21 ~ 2025-11-04 (2주)  
**팀**: 개발팀 3명 (Frontend 1명, Backend 1명, Full-stack 1명)  
**용량**: 120시간 (3명 × 10일 × 4시간)  
**Epic**: Epic-002 Canvas Management Foundation  
**완료 상태**: 📋 재계획 완료 (설계 변경으로 전면 재작성)

---

## 📊 설계 변경 사항 (2025-10-20)

### 주요 아키텍처 변경
Canvas Management Domain의 설계가 **React Flow 중심 아키텍처**로 대폭 변경되었습니다:

#### 1. Canvas Aggregate 제거 ❌
- **이유**: Canvas는 실제 DB 테이블이 없음 (블럭은 workspace에, 블럭 마운트/엣지/뷰포트는 page에 속함)
- **대체**: Read Model Query (`GetCanvasViewQuery`) - 페이지별 데이터 통합 조회
- **영향**: 
  - CanvasAggregate, Canvas Entity, CanvasId VO 모두 제거
  - CanvasRepository 제거
  - initializeCanvasAction → getCanvasViewAction 대체

#### 2. Hook 구조 재설계 🔄
- **기존**: 단일 `useCanvasManagement` Hook
- **변경**: 7개 전문 Hooks
  - `useCanvasMode()` - 캔버스 모드 관리 (독립적 비즈니스 로직)
  - `useCanvasBlockLifecycle()` - 블럭 생명주기 (생성, 복제, 삭제)
  - `useCanvasBlockTransform()` - 블럭 변형 (위치, 크기, 정렬)
  - `useCanvasViewport()` - 뷰포트 제어
  - `useCanvasSelection()` - 선택 상태
  - `useCanvasSnapGuides()` - 스냅 가이드라인
  - `useCanvasEdgeManagement()` - 엣지 관리

#### 3. 정렬 로직 프론트엔드 이동 🔄
- **기존**: 서버에서 정렬 계산
- **변경**: 프론트엔드에서 계산 → 서버에 최종 위치값만 전송
- **영향**: `AlignBlocks`, `DistributeBlocks` Command 제거

#### 4. 캔버스 모드 시스템 도입 ⭐ NEW
- **목적**: UI 렌더링 조건 명확화
- **모드 타입**: default, block-creation, single-selection, multi-selection, block-editing, dragging, edge-creation
- **영향**: 모든 UI 컴포넌트가 모드에 따라 조건부 렌더링

---

## 📋 포함 Story (재조정)

### Story CM-001: 캔버스 데이터 로드 및 렌더링 (8 points) 📋 **재계획 완료**
**목표**: 페이지 접근 시 캔버스 데이터(블럭/엣지/뷰포트)가 자동으로 로드되고 렌더링된다  
**담당자**: Full-stack Developer  
**예상 완료일**: 2025-10-25 (Week 1)  

**주요 구현 완료**:
- ✅ **Backend (Service Layer 통합)**:
  - `CanvasManagementService.getCanvasView()` - Repository 통합 조회
  - `getCanvasViewAction` Server Action (URL 파라미터 기반 권한 검증 포함)
  - DrizzleBlockMountRepository `findByPageIdWithBlocks()` JOIN 쿼리
  - DefaultWorkspaceNavigationService 권한 검증 연동
- ✅ **ACL & Frontend**:
  - `toReactFlowNodeFromCanvasView()`, `toReactFlowEdgeFromCanvasView()` 변환 함수
  - `page.tsx` Server Component - getCanvasViewAction 호출 (URL 파라미터 전달)
  - `CanvasClient` Client Component - React Flow 렌더링

**제거할 것들** ❌:
- CanvasAggregate, Canvas Entity, CanvasId VO
- CanvasRepository
- initializeCanvasAction, loadCanvasDataAction
- CanvasManagementContext
- 기존 useCanvasManagement Hook

**테스트 가능한 기능**:
- ✅ 빈 페이지 접근 → 빈 캔버스 렌더링
- ✅ 기존 페이지 접근 → 블럭/엣지 렌더링  
- ✅ 권한 검증 통과 → 데이터 정상 로드
- ✅ URL 파라미터 기반 권한 검증 (orgId, workspaceId)

---

### Story CM-002: 블럭 생성 및 마운팅 (13 points) ✅ **완료**
**목표**: 블럭 타입 선택 → 스켈레톤 블럭 → 캔버스 클릭 → 블럭 생성 (Optimistic UI)  
**담당자**: Full-stack Developer  
**완료일**: 2025-10-21 (현재 완료)  

**주요 구현 완료** ✅:
- ✅ **Backend**:
  - `createBlockAction` Server Action (Block Management Domain 연동) 완료
  - `CanvasManagementService.createAndMountBlock()` 메서드 완료
  - `BlockMountAggregate.mountBlock()` 정적 메서드 완료
  - `BlockRepository.createBlock()` UUID 충돌 처리 완료
  - `BlockType` VO 지원 타입 확장 (basic, image, video, map 등) 완료
- ✅ **Frontend (모드 관리 + Optimistic UI)**:
  - `useCanvasMode()` Hook (모드 전환 메서드) 완료
  - `useCanvasBlockLifecycle()` Hook (createBlock, Optimistic UI) 완료
  - `BlockAddDialog` 컴포넌트 (Command 기반, 카테고리별 블럭 타입) 완료
  - `SkeletonBlock` 컴포넌트 (커서 따라다니는 스켈레톤) 완료
  - `BasicBlockNode` 컴포넌트 (BaseNode 기반 커스텀 노드) 완료
  - `CanvasReactFlowWrapper` (이벤트 핸들러 통합) 완료

**완료된 핵심 기능**:
- ✅ 블럭 타입 선택 다이얼로그 (Command UI)
- ✅ 스켈레톤 블럭 마우스 추적
- ✅ Optimistic UI 블럭 생성 및 데이터베이스 저장
- ✅ UUID 충돌 처리 및 재시도 로직

**완료 시 테스트 가능**:
- ✅ CM-001의 모든 기능
- ✅ 플러스 버튼 → 블럭 타입 선택 → 스켈레톤 → 블럭 생성
- ✅ 생성된 블럭 선택 상태 전환
- ✅ BlockMountToolbar 표시

---

### Story CM-003: 블럭 변환 (드래그, 리사이즈, 정렬) (21 points) 📋 **재계획 완료**
**목표**: 블럭 드래그/리사이즈 + 다중 정렬 + 스냅 가이드라인 + 뷰포트 제어 완성  
**담당자**: Frontend Developer + Backend Developer  
**예상 완료일**: 2025-11-04 (Week 2)  

**주요 구현**:
- ✅ **Backend**:
  - `updateBlockPositionAction`, `updateBlockSizeAction`
  - `updateMultipleBlockPositionsAction` (다중 정렬용)
  - `saveViewportStateAction`, `restoreViewportStateAction`
  - `BlockMountAggregate.updateBlockPosition()`, `updateBlockSize()` 메서드
- ✅ **Frontend (변형 + 정렬 + 스냅 + 뷰포트)**:
  - `useCanvasBlockTransform()` Hook (프로그램적 제어 + 서버 연동 + 정렬)
  - `useCanvasSnapGuides()` Hook (드래그 중 가이드라인 계산)
  - `useCanvasViewport()` Hook (뷰포트 제어 메서드 추가)
  - `SnapGuidelines` 컴포넌트 (드래그 중 표시)
  - `MultiSelectionToolbar` 컴포넌트 (정렬/분포 버튼)
  - `SelectionBoundingBox` 컴포넌트 (커스텀 선택 박스)
  - `ViewportControls` 컴포넌트 (줌/패닝 제어)
- ✅ **이벤트 핸들러 추가**:
  - `onNodeDragStart` - 드래그 모드 진입
  - `onNodeDragStop` - 위치 서버 저장
  - `onNodeResizeEnd` - 크기 서버 저장

**수정할 것들** 🔄:
- BlockMountAggregate (transformBlock 메서드 → 개별 update 메서드)
- CanvasReactFlowWrapper (모든 이벤트 핸들러 + 모드별 UI 렌더링)

**제거할 것들** ❌:
- TransformBlockCommand (개별 Commands로 분리)
- AlignBlocksCommand, DistributeBlocksCommand (프론트엔드 계산으로 대체)

**완료 시 테스트 가능**:
- ✅ CM-001, CM-002의 모든 기능
- ✅ 블럭 드래그 → 위치 저장
- ✅ 블럭 리사이즈 → 크기 저장
- ✅ 스냅 가이드라인 표시
- ✅ 다중 블럭 정렬/분포
- ✅ 뷰포트 줌/패닝
- ✅ **완전한 캔버스 편집 경험!** 🎉

---

## 📅 Sprint 일정 (재조정)

### Week 1 (2025-10-21 ~ 2025-10-27)
**목표**: CM-001 완료 + CM-002 시작

- **월요일 (10-21)**: 
  - Sprint 킥오프 및 설계 변경 사항 공유
  - 기존 Canvas Aggregate 코드 제거 계획 수립
  - CM-001 시작: GetCanvasViewQuery TDD
  
- **화요일 (10-22)**: 
  - CM-001: GetCanvasViewQuery 구현 완료
  - CM-001: Repository findByPageId 메서드 구현
  - CM-001: getCanvasViewAction 구현

- **수요일 (10-23)**: 
  - CM-001: ACL 구현 (toReactFlowNode, toReactFlowEdge)
  - CM-001: page.tsx 재작성 (getCanvasViewAction 사용)
  - CM-001: CanvasClient 재작성 (Props 전달 방식)

- **목요일 (10-24)**: 
  - CM-001: CanvasReactFlowWrapper 기본 버전 구현
  - CM-001: useCanvasMode Hook (읽기 전용)
  - CM-001: E2E 테스트 (빈 페이지, 기존 페이지 렌더링)
  - **CM-001 완료!** ✅

- **금요일 (10-25)**: 
  - CM-002 시작: createBlockAction 구현 (TDD)
  - CM-002: BlockMountAggregate.mountBlock() 구현
  - CM-002: useCanvasMode Hook 업데이트 (모드 전환 메서드 추가)

### Week 2 (2025-10-28 ~ 2025-11-04)
**목표**: CM-002 완료 + CM-003 완료

- **월요일 (10-28)**: 
  - CM-002: useCanvasBlockLifecycle Hook 구현 (Optimistic UI)
  - CM-002: BlockAddDialog 구현
  - CM-002: SkeletonBlock 구현

- **화요일 (10-29)**: 
  - CM-002: BlockMountNode 커스텀 노드 구현
  - CM-002: BlockMountToolbar 기본 버전 구현
  - CM-002: useCanvasSelection Hook 구현
  - CM-002: 이벤트 핸들러 통합 (onNodeClick, onSelectionChange, onPaneClick)
  - CM-002: E2E 테스트 (블럭 생성 플로우)
  - **CM-002 완료!** ✅

- **수요일 (10-30)**: 
  - CM-003 시작: updateBlockPositionAction, updateBlockSizeAction 구현
  - CM-003: updateMultipleBlockPositionsAction 구현
  - CM-003: BlockMountAggregate 메서드 추가 (updatePosition, updateSize)

- **목요일 (10-31)**: 
  - CM-003: useCanvasBlockTransform Hook 구현 (프로그램적 제어 + 서버 연동 + 정렬)
  - CM-003: useCanvasSnapGuides Hook 구현
  - CM-003: 정렬 알고리즘 구현 (alignBlocks, distributeBlocks)

- **금요일 (11-01)**: 
  - CM-003: SnapGuidelines 컴포넌트 구현
  - CM-003: MultiSelectionToolbar 컴포넌트 구현
  - CM-003: SelectionBoundingBox 컴포넌트 구현
  - CM-003: ViewportControls 컴포넌트 업데이트

- **주말 (11-02 ~ 11-03)**: (선택적)
  - CM-003: 이벤트 핸들러 통합 (onNodeDragStart, onNodeDragStop, onNodeResizeEnd)
  - CM-003: 모드별 UI 렌더링 통합

- **월요일 (11-04)**: 
  - CM-003: E2E 테스트 (드래그, 리사이즈, 정렬, 스냅, 뷰포트)
  - 통합 테스트 및 버그 수정
  - **CM-003 완료!** ✅
  - Sprint 008 회고 및 데모

---

## 🎯 완료 기준

### 기능적 완료
- [ ] **CM-001**: 페이지 접근 시 캔버스 데이터 로드 및 렌더링
  - [ ] 빈 페이지 → 빈 캔버스
  - [ ] 기존 페이지 → 블럭/엣지 복원
  - [ ] 뷰포트 복원 (zoom, center)
  
- [ ] **CM-002**: 블럭 생성 및 마운팅 (Optimistic UI)
  - [ ] 블럭 타입 선택 다이얼로그
  - [ ] 블럭 생성 모드 (스켈레톤 블럭)
  - [ ] 블럭 생성 (즉시 UI 반영 + 서버 저장)
  - [ ] 생성된 블럭 선택 상태 전환
  - [ ] BlockMountToolbar 표시
  
- [ ] **CM-003**: 블럭 변환 (드래그, 리사이즈, 정렬, 스냅, 뷰포트)
  - [ ] 블럭 드래그 이동 (React Flow 콜백 + 서버 저장)
  - [ ] 블럭 리사이즈 (React Flow 콜백 + 서버 저장)
  - [ ] 스냅 가이드라인 (드래그 중 표시)
  - [ ] 다중 블럭 정렬/분포 (프론트엔드 계산 + 서버 저장)
  - [ ] 뷰포트 제어 (줌/패닝)

### 기술적 완료
- [ ] **Backend**:
  - [ ] GetCanvasViewQuery 단위 테스트 95% 이상
  - [ ] BlockMountAggregate 단위 테스트 95% 이상
  - [ ] Service Layer 통합 테스트 85% 이상
  - [ ] Server Actions 통합 테스트 85% 이상
  
- [ ] **Frontend**:
  - [ ] useCanvasMode Hook 테스트 95% 이상
  - [ ] useCanvasBlockLifecycle Hook 테스트 95% 이상
  - [ ] useCanvasBlockTransform Hook 테스트 95% 이상
  - [ ] useCanvasSnapGuides Hook 테스트 95% 이상
  - [ ] useCanvasViewport Hook 테스트 95% 이상
  - [ ] 컴포넌트 테스트 90% 이상
  
- [ ] **E2E**:
  - [ ] CM-001: 데이터 로드 및 렌더링 (3개 시나리오)
  - [ ] CM-002: 블럭 생성 플로우 (3개 시나리오)
  - [ ] CM-003: 드래그/리사이즈/정렬 플로우 (4개 시나리오)

### 품질 완료
- [ ] **코드 품질**:
  - [ ] 기존 Canvas Aggregate 코드 완전 제거
  - [ ] Read Model 패턴 적용 완료
  - [ ] React Flow 콜백 패턴 적용 (onNodeDragStop, onNodeResizeEnd)
  - [ ] Optimistic UI 패턴 검증 (성공/실패 시나리오)
  - [ ] 모드 기반 UI 렌더링 검증
  
- [ ] **성능**:
  - [ ] 블럭 드래그 60fps 유지
  - [ ] 리사이즈 실시간 업데이트 부드러움
  - [ ] 다중 정렬 애니메이션 500ms 이내
  
- [ ] **사용자 경험**:
  - [ ] 에러 처리 및 Toast 메시지
  - [ ] 로딩 상태 표시 (Suspense)
  - [ ] 권한별 UI 차이 구현

---

## 📊 진행 상황 추적

### Sprint 008 전체 진행률
**현재**: 85% (CM-001 완료, CM-002 완료, CM-003 준비)  
**목표**: 100% (CM-001, CM-002, CM-003 완료)

**기존 완료 작업**: 
- Database Schema, Value Objects, Entities, Aggregates, Repositories 등 **40%의 인프라 이미 완료**
- 이 작업들은 새 설계에서도 그대로 재사용 가능!

### Story별 진행 상황

#### CM-001: 캔버스 데이터 로드 및 렌더링 (8pts) - 35% 완료
**기존 완료** (재사용 가능):
- [x] ✅ Database Schema (block_mounts, edges, viewports)
- [x] ✅ Value Objects (Position, Size, ZOrder)
- [x] ✅ Entities (BlockMount, Edge, Viewport)
- [x] ✅ Repositories (기본 구조 및 findByPageId)

#### CM-001: 캔버스 데이터 로드 및 렌더링 (8pts) - ✅ **100% 완료**
**완료된 주요 작업**:
- [x] ✅ **CanvasManagementService.getCanvasView()** 통합 구현
- [x] ✅ **getCanvasViewAction** Server Action (URL 파라미터 기반 권한 검증 포함)
- [x] ✅ **DrizzleBlockMountRepository** JOIN 쿼리 최적화
- [x] ✅ **ACL** React Flow 변환 함수 및 테스트
- [x] ✅ **Frontend** page.tsx + CanvasClient 컴포넌트
- [x] ✅ **권한 검증** workspace-management 연동 (DefaultWorkspaceNavigationService.verifyPageAccess())

---

#### CM-002: 블럭 생성 및 마운팅 (13pts) - ✅ **100% 완료**
**완료된 주요 작업**:
- [x] ✅ **Backend 완료**: createBlockAction, BlockManagementService 연동, UUID 충돌 처리
- [x] ✅ **Frontend 완료**: useCanvasBlockLifecycle, Optimistic UI 패턴 구현
- [x] ✅ **UI 컴포넌트 완료**: BlockAddDialog (Command), SkeletonBlock, BasicBlockNode
- [x] ✅ **통합 완료**: CanvasReactFlowWrapper 이벤트 핸들러, 노드 타입 등록

**핵심 성과**:
- ✅ 완전한 블럭 생성 플로우 (타입 선택 → 스켈레톤 → 생성 → 저장)
- ✅ Optimistic UI로 즉시 피드백 제공
- ✅ UUID 충돌 시 자동 재시도 로직
- ✅ Command UI로 향상된 사용자 경험

---

#### CM-003: 블럭 변환 (21pts) - 25% 완료
**기존 완료** (재사용 가능):
- [x] ✅ CM-001, CM-002 완료 인프라
- [x] ✅ BlockMount Entity.transform() 메서드 (개별 메서드로 분리 필요)
- [x] ✅ Position, Size, ZOrder VO (업데이트 로직 포함)

**새로 구현 필요**:
- [ ] Phase 1: updateBlockPosition/Size Actions - 0%
- [ ] Phase 2: useCanvasBlockTransform (정렬 알고리즘 포함) - 0%
- [ ] Phase 3: useCanvasSnapGuides - 0%
- [ ] Phase 4: useCanvasViewport (제어 메서드) - 0%
- [ ] Phase 5: SnapGuidelines, MultiSelectionToolbar, SelectionBoundingBox - 0%
- [ ] Phase 6: 이벤트 핸들러 추가 (Drag, Resize) - 0%
- [ ] Phase 7: E2E Testing - 0%

**수정 작업**:
- [ ] 🔄 BlockMountAggregate (transformBlock → 개별 update 메서드)
- [ ] 🔄 Commands/Events (통합 → 개별로 분리)

---

## 🔗 의존성 및 리스크

### 의존성
**외부 의존성**: 
- React Flow 라이브러리 (@xyflow/react)
- shadcn/ui React Flow Components (BaseNode, LabeledHandle)
- Block Management Domain API (createBlockAction)

**내부 의존성**: 
- CM-001 → CM-002 → CM-003 (순차적 의존성)
- 각 스토리 완료 시 다음 스토리 시작 가능

**도메인 의존성**:
- Workspace Management Domain (페이지 접근 권한)
- Block Management Domain (블럭 생성, DB JOIN)

### 리스크 및 해결 방안

**기술적 리스크**: 
- **기존 코드 제거 범위** (High):
  - 영향: Canvas Aggregate 관련 코드 전체 제거
  - 해결: Phase별 순차 제거, 테스트로 회귀 방지
  
- **React Flow 통합 복잡도** (High):
  - 영향: 7개 Hook 통합, 모드별 UI 렌더링
  - 해결: CM-002에서 기본 구조 완성, CM-003에서 확장
  
- **Optimistic UI 패턴** (Medium):
  - 영향: 서버 실패 시 롤백 로직
  - 해결: useCanvasBlockLifecycle Hook에 철저한 에러 처리

**일정 리스크**: 
- **CM-003 복잡도 증가** (Medium):
  - 영향: 21pts로 증가 (정렬, 스냅, 뷰포트 통합)
  - 해결: Frontend + Backend 동시 작업, 병렬 구현

**리소스 리스크**: 
- **설계 변경 학습 곡선** (Medium):
  - 영향: 팀원들이 새로운 Hook 구조 이해 필요
  - 해결: 킥오프 시 설계 문서 리뷰 세션

---

## 🎯 Sprint 008 완료 시 사용자 경험

### 사용자 시나리오 (완전한 테스트 가능)

```
1. 사용자가 페이지 URL 접근
   → 로딩 스켈레톤 표시
   → 기존 블럭/엣지가 렌더링됨 ✅
   → 이전 뷰포트 설정 복원됨 (zoom, center) ✅

2. 플러스 버튼 클릭
   → 블럭 타입 선택 다이얼로그 표시 ✅
   → "Text" 블럭 선택
   → 스켈레톤 블럭이 마우스 커서 따라다님 ✅

3. 캔버스 빈 영역 (100, 100) 클릭
   → 즉시 임시 블럭 표시 (Optimistic UI) ✅
   → 1초 이내 실제 블럭으로 교체 ✅
   → 블럭 선택 상태로 전환 ✅
   → BlockMountToolbar 표시 ✅

4. 블럭 드래그 시작
   → 드래그 모드로 전환 ✅
   → 스냅 가이드라인 표시 ✅
   → 실시간 위치 업데이트 ✅

5. 블럭 드래그 종료
   → 최종 위치 서버 저장 ✅
   → 저장 실패 시 원래 위치로 롤백 ✅

6. 블럭 리사이즈
   → 리사이즈 핸들 드래그 ✅
   → 실시간 크기 변경 ✅
   → 리사이즈 종료 시 서버 저장 ✅

7. 다중 블럭 선택 (Shift+Click)
   → multi-selection 모드로 전환 ✅
   → MultiSelectionToolbar 표시 ✅
   → SelectionBoundingBox 표시 ✅

8. 좌측 정렬 버튼 클릭
   → 즉시 정렬된 위치로 애니메이션 ✅
   → 서버에 위치 저장 ✅

9. 줌 인/아웃 버튼 클릭
   → 뷰포트 줌 레벨 변경 ✅
   → 마우스 휠로도 줌 가능 ✅

10. 페이지 이탈
    → 뷰포트 상태 자동 저장 ✅
    
11. 페이지 재접근
    → 이전 뷰포트 상태 복원 ✅
```

**Sprint 008 완료 = 완전한 캔버스 편집 경험 제공!** 🎉

---

## 📊 기존 완료 작업 및 재사용 전략

### ✅ 재사용 가능한 완료 작업 (CM-001 이전 완료)

**Database Schema** (Drizzle migration 완료):
- [x] ✅ **block_mounts 테이블** (id, page_id, block_id, position, size, z_order)
- [x] ✅ **edges 테이블** (id, page_id, source_block_id, target_block_id, edge_type)
- [x] ✅ **viewports 테이블** (id, page_id, user_id, zoom_level, center)
- [x] ✅ **RLS 정책** (페이지 접근 권한 기반)

**Value Objects** (89개 테스트 통과):
- [x] ✅ **Position VO** - 좌표 검증, 계산 메서드
- [x] ✅ **Size VO** - 크기 검증, 리사이즈 메서드
- [x] ✅ **ZOrder VO** - z-order 검증, 비교 메서드
- [x] ✅ **BlockMountId VO** - 복합 식별자
- [x] ✅ **EdgeId VO** - UUID 검증

**Entities** (단위 테스트 완료):
- [x] ✅ **BlockMount Entity** - transform() 메서드 포함 (🔄 분리 필요)
- [x] ✅ **Edge Entity** - updateType, updateLabel, updateStyle
- [x] ✅ **Viewport Entity** - updateViewport, saveState, restoreState

**Aggregates** (단위 테스트 완료):
- [x] ✅ **BlockMountAggregate** - mountBlock() 정적 메서드
- [x] ✅ **EdgeAggregate** - createEdge(), deleteEdge()
- [x] ✅ **ViewportAggregate** - updateViewport()

**Repositories** (기본 CRUD 완료):
- [x] ✅ **BlockMountRepository** - save(), findById(), findByPageId()
- [x] ✅ **EdgeRepository** - save(), findById(), findByPageId()
- [x] ✅ **ViewportRepository** - save(), findById(), findByPageId()

**Service Layer** (기본 구조 완료):
- [x] ✅ **CanvasManagementService** - 의존성 주입, 기본 메서드 구조

**Frontend 컴포넌트** (기본 버전 완료):
- [x] ✅ **BlockToolbar** - 플러스 버튼 (🔄 Hook으로 리팩토링 필요)
- [x] ✅ **BlockAddDialog** - 블럭 타입 선택 (🔄 Hook 연동 필요)

**재사용 비율**: ~40% (DB Schema, Value Objects, Entities, Aggregates, Repositories)

---

### ❌ 완전 제거 대상 (Canvas Aggregate 관련)

**이미 구현되었지만 제거 필요**:
- [x] CanvasAggregate 클래스 및 테스트
- [x] Canvas Entity 및 테스트
- [x] CanvasId VO 및 테스트
- [x] CanvasRepository 및 테스트
- [x] InitializeCanvasCommand, LoadCanvasDataCommand
- [x] CanvasInitializedEvent, CanvasDataLoadedEvent
- [x] initializeCanvasAction, loadCanvasDataAction (메서드)
- [x] CanvasManagementContext
- [x] 기존 useCanvasManagement Hook (Context 기반)

**예상 제거 파일 수**: ~15개 (코드 + 테스트)
**제거 시간**: 2-3시간 (회귀 테스트 포함)

---

### 🔄 수정 대상

**Backend** (리팩토링):
- [ ] 🔄 **BlockMountAggregate**: transformBlock() → updatePosition(), updateSize(), updateZOrder() (CM-003)
- [ ] 🔄 **Commands**: TransformBlockCommand 삭제 → 개별 Commands 추가 (CM-003)
- [ ] 🔄 **Events**: BlockTransformedEvent 삭제 → 개별 Events 추가 (CM-003)
- [ ] 🔄 **CanvasManagementService**: getCanvasView() 추가 (CM-001), mountBlock() 검증 (CM-002)

**Frontend** (리팩토링):
- [ ] 🔄 **page.tsx**: getCanvasViewAction 사용, ACL 변환 추가 (CM-001)
- [ ] 🔄 **CanvasClient**: Props 구조 변경, Context 제거 (CM-001)
- [ ] 🔄 **CanvasReactFlowWrapper**: 이벤트 핸들러 전면 추가 (CM-002, CM-003)
- [ ] 🔄 **BlockToolbar**: Context → Hook (CM-002)
- [ ] 🔄 **BlockAddDialog**: Hook 연동 (CM-002)

**예상 수정 파일 수**: ~10개
**수정 시간**: 4-6시간

---

## 📈 Velocity 및 Burndown

### 예상 Velocity
- **Week 1 목표**: 8pts (CM-001 완료)
- **Week 2 목표**: 34pts (CM-002: 13pts, CM-003: 21pts 완료)
- **총 Sprint Velocity**: 42pts

### Burndown Chart 목표
```
Day  | 남은 Points | 완료 누적 | 주요 작업
-----|------------|----------|----------
준비 | 42pts      | 0pts     | 기존 작업 재사용 확인 (40% 인프라)
1    | 40pts      | 2pts     | Canvas Aggregate 제거 (2-3시간)
2    | 38pts      | 4pts     | GetCanvasViewQuery 구현
3    | 36pts      | 6pts     | ACL 구현 (toReactFlowNode, toReactFlowEdge)
4    | 34pts      | 8pts     | CM-001 완료 ✅ (page.tsx, CanvasClient)
5    | 30pts      | 12pts    | createBlockAction 구현
6    | 26pts      | 16pts    | useCanvasMode Hook 구현
7    | 22pts      | 20pts    | useCanvasBlockLifecycle Hook 구현
8    | 21pts      | 21pts    | CM-002 완료 ✅ (BlockMountNode, 이벤트 핸들러)
9    | 18pts      | 24pts    | updateBlockPosition/Size Actions 구현
10   | 14pts      | 28pts    | useCanvasBlockTransform Hook (정렬 알고리즘)
11   | 10pts      | 32pts    | useCanvasSnapGuides Hook + SnapGuidelines
12   | 6pts       | 36pts    | MultiSelectionToolbar + SelectionBoundingBox
13   | 2pts       | 40pts    | 이벤트 핸들러 통합 (Drag, Resize)
14   | 0pts       | 42pts    | CM-003 완료 ✅ + E2E 테스트, Sprint 종료!
```

**재사용 효과**: 
- 기존 40% 인프라 덕분에 실제 새 구현은 60%만 필요
- DB Schema, VO, Entity 테스트는 이미 89개 통과
- Repository CRUD 기본 동작 보장됨

---

## 🔗 문서 참조

### Domain Documentation
**Canvas Management Domain**:
- [Event Storming](../../event-domain-design/domains/canvas-management-domain/01-event-storm.md)
- [Process Model](../../event-domain-design/domains/canvas-management-domain/02-process-model.md)
- [Software Design](../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - ⭐ SSOT
- [User Flow](../../event-domain-design/domains/canvas-management-domain/03-user-flow.md)
- [Technical Specification](../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Frontend Specification](../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

### Story Documentation
- [Story CM-001](../stories/canvas-management/story-cm-001-canvas-initialization.md) - ⭐ 재작성 완료
- [Story CM-002](../stories/canvas-management/story-cm-002-block-creation-mounting.md) - ⭐ 재작성 완료
- [Story CM-003](../stories/canvas-management/story-cm-003-block-transformation.md) - ⭐ 재작성 완료
- [Stories README](../stories/canvas-management/README.md) - ⭐ 업데이트 완료

### Agile Planning
- [Epic 문서](../epics/epic-002-canvas-management.md)

---

## 🎉 Sprint 008 성공 기준

### 데모 시나리오 (Sprint Review)
스프린트 종료 시 다음 시나리오를 라이브로 시연할 수 있어야 함:

1. **캔버스 렌더링**: 페이지 접근 → 기존 블럭/엣지 확인
2. **블럭 생성**: 플러스 버튼 → 타입 선택 → 캔버스 클릭 → 즉시 생성
3. **블럭 이동**: 드래그 → 스냅 가이드라인 → 위치 저장
4. **블럭 리사이즈**: 핸들 드래그 → 크기 변경 → 저장
5. **다중 정렬**: 블럭 3개 선택 → 좌측 정렬 → 애니메이션 → 저장
6. **뷰포트 제어**: 줌 인/아웃 → 패닝 → Fit to Screen
7. **에러 처리**: 네트워크 오류 시 롤백 → Toast 메시지

### 회고 질문
- Read Model 패턴 적용이 효과적이었는가?
- 7개 Hook 분리가 테스트와 유지보수에 도움이 되었는가?
- Optimistic UI 패턴이 사용자 경험을 개선했는가?
- 모드 기반 UI 렌더링이 코드 가독성을 높였는가?
- 기존 코드 제거 과정에서 어려움은 없었는가?

---

**총 Story Points**: 42pts  
**현재 완료율**: 0% (재시작)  
**목표 완료율**: 100% (CM-001, CM-002, CM-003 완료)

---

*Sprint 008 완료 시 사용자는 완전한 캔버스 블럭 편집 경험을 얻게 됩니다! 🚀*
