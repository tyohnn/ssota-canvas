# Sprint 008: Canvas Management Foundation

## 🎯 Sprint 개요
**목표**: 캔버스 초기화 및 기본 블럭 조작 기능을 완성하여 사용자가 무한 캔버스에서 기본적인 시각적 작업을 시작할 수 있도록 한다  
**기간**: 2025-10-21 ~ 2025-11-04 (2주)  
**팀**: 개발팀 3명 (Frontend 1명, Backend 1명, Full-stack 1명)  
**용량**: 120시간 (3명 × 10일 × 4시간)  
**Epic**: Epic-002 Canvas Management Foundation  
**완료 상태**: 📋 계획 완료

---

## 📋 포함 Story

### Story CM-001: Canvas 초기화 및 기본 뷰포트 관리 (8 points)
**목표**: 사용자가 페이지에 접속했을 때 캔버스가 자동으로 초기화되고 이전 뷰포트 설정이 복원된다  
**담당자**: Full-stack Developer  
**예상 완료일**: 2025-10-25 (Week 1)  

**주요 구현**:
- CanvasAggregate 구현 (가상 Aggregate)
- CanvasRepository 구현 (findByPageId, save)
- initializeCanvasAction, loadCanvasDataAction
- CanvasProvider 컴포넌트 및 React Flow 통합
- viewports 테이블 생성 및 RLS 정책

### Story CM-002: 블럭 생성 및 마운팅 (13 points)
**목표**: 사용자가 블럭 타입을 선택하고 캔버스에 배치할 수 있다  
**담당자**: Full-stack Developer  
**예상 완료일**: 2025-10-31 (Week 1-2)  

**주요 구현**:
- BlockMountAggregate 구현
- BlockMount Entity 및 Value Objects (Position, Size, ZOrder)
- mountBlockAction, getAvailableBlockTypesAction
- BlockToolbar 및 BlockAddDialog 컴포넌트
- block_mounts 테이블 생성 및 RLS 정책
- Block Domain 연동 (블럭 타입 검증)

### Story CM-003: 블럭 변환 (이동, 리사이즈, Z-Order) (13 points)
**목표**: 사용자가 블럭을 드래그하여 이동시키고 크기를 조절하며 레이어 순서를 변경할 수 있다  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-11-04 (Week 2)  

**주요 구현**:
- BlockMountAggregate TransformBlock 로직
- transformBlockAction (위치, 크기, Z-Order 변경)
- React Flow 드래그/리사이즈 이벤트 처리
- useOptimistic으로 실시간 UI 업데이트

---

## 📅 Sprint 일정

### Week 1 (2025-10-21 ~ 2025-10-27)
- **월요일 (10-21)**: Sprint 킥오프, 환경 설정, CM-001 시작
- **화요일 (10-22)**: CM-001 진행 (CanvasAggregate, Repository 구현)
- **수요일 (10-23)**: CM-001 진행 (CanvasProvider, React Flow 통합)
- **목요일 (10-24)**: CM-001 완료, CM-002 시작 (BlockMountAggregate)
- **금요일 (10-25)**: CM-002 진행 (블럭 마운팅 로직, DB 스키마)

### Week 2 (2025-10-28 ~ 2025-11-04)
- **월요일 (10-28)**: CM-002 진행 (BlockToolbar, BlockAddDialog UI)
- **화요일 (10-29)**: CM-002 완료, CM-003 시작 (변환 로직)
- **수요일 (10-30)**: CM-003 진행 (React Flow 드래그/리사이즈 처리)
- **목요일 (10-31)**: CM-003 진행 (useOptimistic, 실시간 업데이트)
- **금요일 (11-01)**: 통합 테스트, 버그 수정, Sprint 008 회고

---

## 🔗 의존성 및 리스크

### 의존성
**외부 의존성**: 
- React Flow 라이브러리 안정성 및 성능
- shadcn/ui React Flow Components 설치 및 설정
- Block Domain 서비스 API 준비 상태

**내부 의존성**: 
- CM-001 → CM-002 → CM-003 (순차적 의존성)
- CM-002 → Block Domain 연동 (블럭 타입 검증)

**도메인 의존성**:
- Workspace Management Domain (페이지 생명주기)
- Block Domain (블럭 생성 및 타입 검증)

### 리스크 및 해결 방안
**기술적 리스크**: 
- React Flow와 DDD 아키텍처 통합 복잡도 (High) → ACL 패턴 적용, 충분한 시간 할당
- 실시간 UI 업데이트와 데이터 동기화 (Medium) → useOptimistic 패턴 적용

**일정 리스크**: 
- CM-003의 React Flow 이벤트 처리 복잡도 (Medium) → Frontend Developer 전담 할당
- Block Domain 연동 지연 (Low) → 병렬 개발 진행

**리소스 리스크**: 
- Frontend React Flow 전문 지식 부족 (Medium) → 사전 학습 및 기술 스터디

---

## 🎯 완료 기준

### 기능적 완료
- [ ] 페이지 접속 시 캔버스 자동 초기화 및 뷰포트 복원
- [ ] 블럭 타입 선택 및 캔버스 배치 기능
- [ ] 블럭 드래그 이동, 리사이즈, Z-Order 변경 기능
- [ ] React Flow와 데이터베이스 상태 동기화

### 기술적 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과 (도메인 간 연동)
- [ ] E2E Tests 통과 (기본 사용자 플로우)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] React Flow 성능 최적화 (60fps 드래그)
- [ ] RLS 정책 적용 완료
- [ ] 에러 처리 및 사용자 피드백 완료

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: CM-001 시작, 환경 설정 완료
- [ ] **화요일**: CanvasAggregate 구현 진행 상황
- [ ] **수요일**: React Flow 통합 완료 확인
- [ ] **목요일**: CM-002 시작, BlockMountAggregate 구현
- [ ] **금요일**: Week 1 목표 달성 확인

### 주간 체크포인트
- [ ] **Week 1 종료**: CM-001 완료, CM-002 50% 완료
- [ ] **Week 2 종료**: 모든 Story 완료, 통합 테스트 통과

---

## 📁 관련 문서
- [Epic 문서](../epics/epic-002-canvas-management.md)
- [Story CM-001](../stories/canvas-management/story-cm-001-canvas-initialization.md)
- [Story CM-002](../stories/canvas-management/story-cm-002-block-creation-mounting.md)
- [Story CM-003](../stories/canvas-management/story-cm-003-block-transformation.md)

---

**총 Story Points**: 34pts  
**예상 완료율**: 100% (모든 핵심 기반 기능)
