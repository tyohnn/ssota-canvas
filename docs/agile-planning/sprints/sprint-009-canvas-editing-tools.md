# Sprint 009: Canvas Editing Tools

## 🎯 Sprint 개요
**목표**: 블럭 선택, 정렬, 스마트 가이드라인 기능을 완성하여 사용자가 직관적이고 정확한 시각적 편집 경험을 할 수 있도록 한다  
**기간**: 2025-11-05 ~ 2025-11-19 (2주)  
**팀**: 개발팀 3명 (Frontend 2명, Backend 1명)  
**용량**: 120시간 (3명 × 10일 × 4시간)  
**Epic**: Epic-002 Canvas Management Foundation  
**완료 상태**: 📋 계획 완료

---

## 📋 포함 Story

### Story CM-004: 블럭 선택 및 다중 선택 (8 points)
**목표**: 사용자가 블럭을 선택하고 여러 블럭을 동시에 선택하여 일괄 작업을 수행할 수 있다  
**담당자**: Frontend Developer A  
**예상 완료일**: 2025-11-08 (Week 1)  

**주요 구현**:
- useCanvasManagement Hook에서 selectedBlockIds 상태 관리
- useBlockSelection Hook 구현 (선택 로직 캡슐화)
- React Flow onSelectionChange 이벤트 처리
- 영역 선택 (SelectionMode), Ctrl/Shift 키 처리, Ctrl+A 전체 선택
- 선택 상태 로컬 스토리지 영속성

### Story CM-005: 블럭 정렬 및 분포 도구 (8 points)
**목표**: 선택된 여러 블럭들을 정렬하고 균등하게 분포시켜 일관된 레이아웃을 만들 수 있다  
**담당자**: Backend Developer  
**예상 완료일**: 2025-11-12 (Week 1-2)  

**주요 구현**:
- BlockMountAggregate alignBlocks, distributeBlocks 로직
- Commands 정의 (AlignBlocksCommand, DistributeBlocksCommand)
- alignBlocksAction, distributeBlocksAction
- BlockToolbar에 정렬 도구 버튼들 (상하좌우, 중심, 분포)
- alignment_type enum 활용

### Story CM-006: 스마트 가이드라인 및 스냅 (13 points)
**목표**: 블럭 드래그 시 다른 블럭들과의 정렬 가이드라인이 표시되고 자동으로 스냅되어 정확한 레이아웃을 만들 수 있다  
**담당자**: Frontend Developer B  
**예상 완료일**: 2025-11-19 (Week 2)  

**주요 구현**:
- useSnapGuidelines Hook 구현 (가이드라인 계산 로직)
- 스냅 계산 알고리즘 (수직/수평/중심선 감지, 5px 임계값)
- SnapGuidelines 컴포넌트 (React Flow 오버레이로 가이드라인 렌더링)
- 드래그 중 실시간 가이드라인 업데이트 및 스냅 적용

---

## 📅 Sprint 일정

### Week 1 (2025-11-05 ~ 2025-11-11)
- **월요일 (11-05)**: Sprint 킥오프, CM-004 시작 (블럭 선택 로직)
- **화요일 (11-06)**: CM-004 진행 (React Flow 이벤트 처리, 다중 선택)
- **수요일 (11-07)**: CM-004 진행 (영역 선택, 키보드 단축키)
- **목요일 (11-08)**: CM-004 완료, CM-005 시작 (정렬 알고리즘)
- **금요일 (11-09)**: CM-005 진행 (BlockMountAggregate 정렬 로직)

### Week 2 (2025-11-12 ~ 2025-11-19)
- **월요일 (11-12)**: CM-005 진행 (정렬 도구 UI, Server Actions)
- **화요일 (11-13)**: CM-005 완료, CM-006 시작 (가이드라인 계산)
- **수요일 (11-14)**: CM-006 진행 (스냅 알고리즘, 5px 임계값)
- **목요일 (11-15)**: CM-006 진행 (SnapGuidelines 컴포넌트, 실시간 렌더링)
- **금요일 (11-16)**: CM-006 완료, 통합 테스트, Sprint 009 회고

---

## 🔗 의존성 및 리스크

### 의존성
**선행 Sprint 의존성**: 
- Sprint 008 완료 필수 (CM-001, CM-002, CM-003)

**내부 의존성**: 
- CM-004 → CM-005 (선택된 블럭들에 대한 정렬 적용)
- CM-004 → CM-006 (선택 및 드래그 상태 관리)

**기술 의존성**:
- React Flow SelectionMode 및 오버레이 렌더링
- 실시간 계산 성능 최적화

### 리스크 및 해결 방안
**기술적 리스크**: 
- 스냅 가이드라인 실시간 계산 성능 (High) → 알고리즘 최적화, 디바운싱 적용
- React Flow 오버레이 렌더링 복잡도 (Medium) → 컴포넌트 최적화, 렌더링 최적화

**일정 리스크**: 
- CM-006의 복잡한 가이드라인 계산 로직 (Medium) → Frontend Developer B 전담, 충분한 시간 할당
- 다중 선택과 정렬 도구 연동 (Low) → 이미 CM-004에서 기반 작업 완료

**리소스 리스크**: 
- Frontend 개발자 2명의 작업 분배 및 협업 (Medium) → 명확한 역할 분담 및 일일 동기화

---

## 🎯 완료 기준

### 기능적 완료
- [ ] 단일/다중 블럭 선택 (클릭, Ctrl/Shift, 영역 선택, Ctrl+A)
- [ ] 블럭 정렬 도구 (상하좌우, 중심 정렬, 균등 분포)
- [ ] 드래그 중 실시간 스냅 가이드라인 표시
- [ ] 5px 임계값 기반 자동 스냅 적용

### 기술적 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과 (선택-정렬 연동)
- [ ] E2E Tests 통과 (편집 도구 사용 플로우)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 스냅 가이드라인 계산 성능 최적화 (60fps 유지)
- [ ] 사용자 피드백 (선택 상태, 정렬 결과 표시)
- [ ] 키보드 접근성 지원 완료

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: CM-004 시작, 선택 로직 구현
- [ ] **화요일**: 다중 선택 및 키보드 단축키 구현
- [ ] **수요일**: 영역 선택 및 React Flow 통합
- [ ] **목요일**: CM-004 완료, CM-005 시작
- [ ] **금요일**: Week 1 목표 달성 확인

### 주간 체크포인트
- [ ] **Week 1 종료**: CM-004 완료, CM-005 50% 완료
- [ ] **Week 2 종료**: 모든 Story 완료, 통합 테스트 통과

---

## 📁 관련 문서
- [Epic 문서](../epics/epic-002-canvas-management.md)
- [Story CM-004](../stories/canvas-management/story-cm-004-block-selection.md)
- [Story CM-005](../stories/canvas-management/story-cm-005-block-alignment-tools.md)
- [Story CM-006](../stories/canvas-management/story-cm-006-smart-guidelines-snapping.md)

---

**총 Story Points**: 29pts  
**예상 완료율**: 100% (핵심 편집 도구 완성)
