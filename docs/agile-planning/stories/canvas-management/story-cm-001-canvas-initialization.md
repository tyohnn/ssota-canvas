# Story CM-001: Canvas 초기화 및 기본 뷰포트 관리

## 🎯 Story 개요
**User Story**: As a 사용자, I want to 페이지에 접속했을 때 캔버스가 자동으로 초기화되고 내 이전 뷰포트 설정이 복원되어야 so that 즉시 작업을 시작할 수 있다

**Story Points**: 8pts  
**우선순위**: High  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 새 페이지 캔버스 초기화
```gherkin
Given 사용자가 새로 생성된 페이지에 접속했다
When 페이지가 로드된다
Then 빈 캔버스가 초기화된다
And React Flow 인스턴스가 생성된다
And 기본 뷰포트 설정이 적용된다
And 블럭 생성 도구에 접근할 수 있다
```

### 시나리오 2: 기존 페이지 캔버스 복원
```gherkin
Given 사용자가 기존 페이지에 접속했다
When 페이지가 로드된다
Then 캔버스가 초기화된다
And 기존 블럭들이 올바른 위치에 렌더링된다
And 엣지 연결들이 복원된다
And 사용자별 뷰포트 설정이 복원된다
```

### 시나리오 3: 뷰포트 상태 복원
```gherkin
Given 사용자가 이전에 작업했던 페이지에 재접속했다
When 페이지가 로드된다
Then 이전 줌 레벨이 복원된다
And 이전 중심점 위치가 복원된다
And 사용자별 설정이 올바르게 적용된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] CanvasAggregate 구현 (초기화 로직)
- [ ] Canvas Entity 구현
- [ ] CanvasId, PageId Value Objects 구현
- [ ] Commands 정의 (InitializeCanvasCommand, LoadCanvasDataCommand)
- [ ] Events 정의 (CanvasInitializedEvent, CanvasDataLoadedEvent)
- [ ] CanvasRepository 구현 (가상 Aggregate 처리)

#### Database
- [ ] viewports 테이블 생성 (Drizzle migration)
- [ ] edge_type, alignment_type enum 생성
- [ ] RLS 정책 적용 (사용자별 뷰포트 접근 제어)

#### Server Actions
- [ ] initializeCanvasAction (캔버스 초기화)
- [ ] loadCanvasDataAction (기존 데이터 로드)
- [ ] getViewportAction (뷰포트 상태 조회)

#### Frontend
- [ ] CanvasProvider 컴포넌트 (React Flow 통합)
- [ ] CanvasManagementContext 및 useCanvasManagement Hook
- [ ] Initial data loading 및 viewport restoration 로직

---

### Workspace Management Domain (통합)
**참조 문서**: 
- [Process Model 참조](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 0

#### Backend Implementation
- [ ] 페이지 생성 이벤트와 캔버스 초기화 연동

---

### 도메인 간 통합
- [ ] Workspace Management → Canvas Management 페이지 생명주기 동기화
- [ ] 페이지 접근 권한 검증 로직
- [ ] 초기 데이터 전달 및 에러 처리

---

### Testing & Quality
- [ ] Unit Tests (CanvasAggregate 초기화 로직)
- [ ] Integration Tests (페이지-캔버스 연동)
- [ ] E2E Tests (전체 초기화 플로우)

## 🎯 Definition of Done

### 기능 완료
- [ ] 새 페이지 접속 시 빈 캔버스 초기화
- [ ] 기존 페이지 접속 시 블럭/엣지 복원
- [ ] 사용자별 뷰포트 설정 복원 (줌/패닝)
- [ ] React Flow 인스턴스 정상 생성

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] RLS 정책 적용 완료 (사용자별 뷰포트 접근 제어)
- [ ] 페이지 접근 권한 검증 완료
- [ ] 에러 처리 및 로딩 상태 관리 완료

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: Epic-001의 기본 플랫폼 완료 필요
- **후행 Story**: CM-002 (블럭 생성 및 마운팅)
- **도메인 의존성**: Workspace Management Domain과의 페이지 생명주기 연동

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 0 (외부 도메인과의 동기화)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - Canvas Aggregate
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md) - viewports 테이블
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - CanvasProvider, Context

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
