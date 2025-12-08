# Story E001-006: 블록 툴 실행

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록 타입별 특화 기능을 실행할 수 있어야 so that 블록의 데이터를 활용하여 추가 정보를 생성할 수 있다

**Story Points**: 13pts  
**우선순위**: Medium  
**Epic**: Epic-001 Block Management Domain  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 툴 실행
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 블록 툴을 실행한다
Then 툴 실행이 시작된다
And 실행 진행률이 표시된다
And 실행 결과가 새 블록으로 생성된다
```

### 시나리오 2: 툴 실행 결과 처리
```gherkin
Given 블록 툴이 실행되었다
When 툴 실행이 완료된다
Then 결과가 파싱되어 새 블록들로 생성된다
And Canvas Management에 새 블록 정보가 전달된다
```

### 시나리오 3: AI 자동 툴 실행
```gherkin
Given AI가 블록 툴 실행을 요청했다
When AI가 툴을 자동 실행한다
Then 사용자 권한이 검증된다
And 툴 실행 결과가 AI에게 전달된다
```

### 시나리오 4: 툴 실행 실패 처리
```gherkin
Given 블록 툴이 실행되었다
When 툴 실행이 실패한다
Then 적절한 에러 메시지가 표시된다
And 실행 상태가 초기화된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] BlockToolId, BlockToolName Value Objects 구현
- [ ] Commands 정의 (ExecuteBlockTool, ExecuteBlockToolByAI)
- [ ] Events 정의 (BlockToolExecuted, ToolExecutionCompleted)
- [ ] 툴 타입별 실행 로직
- [ ] 결과 파싱 및 새 블록 생성 로직

#### Database
- [ ] 툴 실행 로그 저장 (선택적)

#### Server Actions
- [ ] executeBlockToolAction (툴 실행)
- [ ] executeBlockToolByAIAction (AI 툴 실행)

#### Frontend
- [ ] BlockMountToolbar 컴포넌트
- [ ] 툴 실행 진행률 표시
- [ ] 툴 실행 결과 표시
- [ ] AI 툴 실행 UI

---

### Canvas Management Domain (통합)
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

#### Backend Implementation
- [ ] 새 블록 마운트 로직
- [ ] 엣지 연결 처리

#### Frontend
- [ ] 새 블록 Canvas 마운트
- [ ] 블록 간 연결 처리

---

### 도메인 간 통합
- [ ] Block Management → Canvas Management (새 블록 정보 전달)
- [ ] 툴 실행 권한 검증
- [ ] 에러 처리 및 롤백
- [ ] AI 툴 실행 권한 검증

---

### Testing & Quality
- [ ] Unit Tests (툴 실행 로직)
- [ ] Integration Tests (툴 실행 및 결과 처리)
- [ ] E2E Tests (툴 실행 전체 플로우)
- [ ] 성능 테스트 (툴 실행 30초 이내 완료)

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] 블록 툴 실행 기능 완성
- [ ] 툴 실행 진행률 표시 완성
- [ ] AI 툴 실행 기능 완성
- [ ] UI/UX가 Frontend Specification을 준수함

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [ ] RLS 정책 적용 완료
- [ ] 권한 검증 로직 구현 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 60% 완료 (Backend Repository, Server Actions, Frontend Hooks 완전 구현, AI 연동 미구현)

### ✅ 완료된 구현 (2025-10-24 기준)
- **Backend Service**: BlockToolService 완전 구현 (툴 실행, 검증 로직)
- **Server Actions**: executeBlockToolAction 완전 구현
- **Frontend Hooks**: useBlockToolExecution Hook 완전 구현 (진행률 표시 포함)
- **Frontend Components**: BlockMountToolbar 컴포넌트 완전 구현
- **Testing**: Backend Service, Server Actions, Frontend Hooks 단위 테스트 완전 구현
- **UI Components**: 툴 실행 진행률 표시 완전 구현 (isExecuting, executionProgress 상태 관리)

### ❌ 미구현 사항
- **Backend Repository**: DrizzleToolRepository 파일이 실제로 존재하는지 확인 필요
- **AI 연동**: AI 서비스 API 연동, AI 툴 콜 인터페이스, AI 결과 처리 로직 미구현
- **Canvas Management 연동**: 새 블록 마운트 로직은 부분 구현 (useBlockToolExecution에서 addNodes 사용)
- **Frontend Components**: AI 자동 실행 전용 UI 컴포넌트 미구현
- **Testing**: Integration Tests, E2E Tests 미구현

## 🔗 의존성
- **선행 Story**: E001-005 (미디어 업로드)
- **후행 Story**: 없음 (Epic 완료)
- **도메인 의존성**: Block Management Domain ↔ Canvas Management Domain

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Process Model](../../../event-domain-design/domains/block-management-domain/02-process-model.md) - Scenario 4
- [Software Design](../../../event-domain-design/domains/block-management-domain/03-software-design.md) - BlockTool
- [Testing Strategy](../../../event-domain-design/domains/block-management-domain/05-testing-strategy.md) - Scenario 4 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - blocks 테이블
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - BlockMountToolbar

**Canvas Management Domain**:
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md)
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/canvas-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

### Agile Planning
- [Epic 문서](../../epics/epic-001-block-management.md)
