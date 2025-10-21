# Sprint 010: Canvas Advanced Features

## 🎯 Sprint 개요
**목표**: 엣지 관리, 블럭 삭제, 복제 기능을 완성하여 사용자가 완전한 캔버스 작업 환경을 사용할 수 있도록 한다  
**기간**: 2025-11-20 ~ 2025-12-04 (2주)  
**팀**: 개발팀 3명 (Frontend 1명, Backend 1명, Full-stack 1명)  
**용량**: 120시간 (3명 × 10일 × 4시간)  
**Epic**: Epic-002 Canvas Management Foundation  
**완료 상태**: 📋 계획 조정 완료

**참고**: CM-009 (뷰포트 관리)는 Sprint 008의 CM-003에 이미 포함되어 제외됨

---

## 📋 포함 Story

### Story CM-007: 엣지 생성 및 관리 (13 points)
**목표**: 사용자가 블럭 간의 연결선을 생성하고 편집하여 관계와 데이터 흐름을 시각적으로 표현할 수 있다  
**담당자**: Full-stack Developer  
**예상 완료일**: 2025-11-25 (Week 1)  

**주요 구현**:
- EdgeAggregate 구현 (엣지 생성, 수정, 삭제 로직)
- Edge Entity 및 Value Objects (EdgeId, EdgeType)
- createEdgeAction, updateEdgeAction, deleteEdgeAction
- React Flow onConnect 이벤트 처리
- edges 테이블 생성 및 RLS 정책 (React Flow 기본 타입 지원)

### Story CM-008: 블럭 삭제 및 엣지 정리 (5 points)
**목표**: 사용자가 불필요한 블럭을 삭제하고 연결된 엣지들이 자동으로 정리되어 깔끔한 캔버스를 유지할 수 있다  
**담당자**: Backend Developer  
**예상 완료일**: 2025-11-27 (Week 1)  

**주요 구현**:
- BlockMountAggregate deleteBlockMount 로직 (Soft Delete)
- EdgeAggregate deleteConnectedEdges 로직
- 트랜잭션 처리 (블럭 삭제 + 연결된 엣지 삭제)
- 삭제 확인 다이얼로그 및 Delete 키보드 단축키

### Story CM-010: 블럭 복제 (8 points)
**목표**: 사용자가 기존 블럭을 복사하여 새로운 블럭을 빠르게 생성할 수 있다  
**담당자**: Full-stack Developer  
**예상 완료일**: 2025-12-04 (Week 2)  

**주요 구현**:
- BlockMountAggregate duplicateBlock 로직
- duplicateBlockAction (Block Domain 연동)
- 복제 위치 계산 로직 (원본 근처 오프셋)
- Ctrl+D 키보드 단축키 및 UI 버튼

---

## 📅 Sprint 일정

### Week 1 (2025-11-20 ~ 2025-11-26)
- **월요일 (11-20)**: Sprint 킥오프, CM-007 시작 (EdgeAggregate 구현)
- **화요일 (11-21)**: CM-007 진행 (엣지 생성 로직, DB 스키마)
- **수요일 (11-22)**: CM-007 진행 (React Flow onConnect 처리)
- **목요일 (11-23)**: CM-007 진행 (엣지 편집/삭제 UI)
- **금요일 (11-24)**: CM-007 완료, CM-008 시작 (블럭 삭제 로직)

### Week 2 (2025-11-27 ~ 2025-12-04)
- **월요일 (11-27)**: CM-008 완료, CM-010 시작 (블럭 복제)
- **화요일 (11-28)**: CM-010 진행 (복제 로직, Block Domain 연동)
- **수요일 (11-29)**: CM-010 진행 (복제 위치 계산, UI 구현)
- **목요일 (11-30)**: CM-010 완료, 통합 테스트
- **금요일 (12-01)**: 전체 기능 테스트, Sprint 010 회고 및 데모

---

## 🔗 의존성 및 리스크

### 의존성
**선행 Sprint 의존성**: 
- Sprint 008 완료 필수 (기본 캔버스, 편집 도구, 뷰포트 관리 포함)

**내부 의존성**: 
- CM-007 → CM-008 (엣지 생성 후 삭제 시 정리 로직)
- CM-002 → CM-010 (블럭 마운팅 후 복제 기능)

**기술 의존성**:
- React Flow 엣지 렌더링 및 이벤트 처리
- Block Domain과의 블럭 복제 API 연동

### 리스크 및 해결 방안
**기술적 리스크**: 
- 엣지 생성과 블럭 삭제 간 데이터 일관성 (High) → 트랜잭션 처리 및 테스트 강화
- 복제 기능의 Block Domain 연동 (Medium) → API 인터페이스 사전 정의

**일정 리스크**: 
- CM-007의 복잡한 엣지 관리 로직 (Medium) → Full-stack Developer 전담, 충분한 시간 할당

**리소스 리스크**: 
- 3개 Story의 병렬 처리 (Low) → 명확한 역할 분담 및 의존성 관리

---

## 🎯 완료 기준

### 기능적 완료
- [ ] 드래그 앤 드롭으로 엣지 생성, 타입 변경, 삭제
- [ ] 블럭 삭제 시 연결된 엣지 자동 정리 (Soft Delete)
- [ ] 블럭 복제 (Ctrl+D, UI 버튼), 자동 마운트

### 기술적 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과 (엣지-블럭 관계, 복제 연동)
- [ ] E2E Tests 통과 (엣지 생성, 블럭 삭제, 복제 플로우)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 데이터 일관성 보장 (블럭-엣지 관계, 트랜잭션 처리)
- [ ] 성능 최적화 (엣지 렌더링)
- [ ] 사용자 피드백 (삭제 확인, 복제 상태 표시)

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: CM-007 시작, EdgeAggregate 구현
- [ ] **화요일**: 엣지 생성/편집 기능 구현
- [ ] **수요일**: React Flow 엣지 통합 완료
- [ ] **목요일**: CM-007 완료, CM-008 시작
- [ ] **금요일**: Week 1 목표 달성 확인

### 주간 체크포인트
- [ ] **Week 1 종료**: CM-007, 008 완료, CM-010 시작
- [ ] **Week 2 종료**: 모든 Story 완료, 전체 기능 통합 테스트

---

## 📁 관련 문서
- [Epic 문서](../epics/epic-002-canvas-management.md)
- [Story CM-007](../stories/canvas-management/story-cm-007-edge-creation-management.md)
- [Story CM-008](../stories/canvas-management/story-cm-008-block-deletion-cleanup.md)
- [Story CM-010](../stories/canvas-management/story-cm-010-block-duplication.md)

**참고**: [Story CM-009 (뷰포트 관리)](../stories/canvas-management/story-cm-009-viewport-management.md)는 Sprint 008의 CM-003에 이미 포함됨

---

**총 Story Points**: 26pts (CM-007: 13pts + CM-008: 5pts + CM-010: 8pts)  
**예상 완료율**: 100% (고급 기능 완성)

**변경 사항**: CM-009 (뷰포트 관리, 8pts)는 Sprint 008에 이미 포함되어 제외됨 (34pts → 26pts)
