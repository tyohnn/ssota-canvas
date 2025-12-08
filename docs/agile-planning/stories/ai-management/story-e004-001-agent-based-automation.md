# Story E004-001: AI Agent 기반 자연어 작업 자동화

## 🎯 Story 개요
**User Story**: As a 사용자, I want to AI Agent에게 자연어로 작업을 요청하고 자동으로 캔버스 조작 및 블럭 액션을 실행받아 so that 복잡한 작업을 빠르고 효율적으로 완료할 수 있다

**Story Points**: 89pts  
**예상 기간**: 2-3 Sprints (5주)  
**우선순위**: High  
**Epic**: [Epic-004: Basic AI Context Engineering](../../epics/epic-004-basic-ai-context-engineering.md)  
**Domain**: AI Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 사용자 발화 입력 및 Agent 자동 실행
```gherkin
Feature: AI Agent 자연어 작업 요청
  Scenario: 사용자가 자연어로 작업을 요청하고 Agent가 자동으로 실행
    Given 사용자가 페이지에 로그인되어 있고
    And 페이지에 블럭 2개가 선택되어 있고
    And AI 입력창에 포커스가 있다
    When 사용자가 "선택한 블럭을 3개 복제해줘"를 입력하고 Enter를 누른다
    Then 사용자 발화가 Message 컴포넌트로 표시되고
    And "작업 준비 중..." 상태가 표시되고
    And 컨텍스트가 자동으로 조립되고 (Short-Term + Long-Term + Canvas)
    And Agent가 자동으로 실행되고
    And Agent가 "Thinking..." 상태를 표시하고
    And Agent가 필요한 툴을 자동으로 호출하고 (addBlock 툴 6회)
    And 툴 실행 결과가 Task 컴포넌트로 실시간 표시되고
    And 복제된 블럭 6개가 캔버스에 생성되고
    And Agent가 최종 응답을 Message 컴포넌트로 표시한다
    And 모든 이벤트가 Event Log에 저장된다
```

### 시나리오 2: Agent 툴 호출 및 블럭 조작
```gherkin
Feature: Agent 자동 툴 호출
  Scenario: Agent가 자율적으로 툴을 호출하여 블럭 조작
    Given 사용자가 "빨간색 사각형 블럭을 만들어줘"를 요청했고
    And Agent가 실행 중이다
    When Agent가 addBlock 툴을 호출하고 (blockType: rectangle, color: red)
    Then 툴 실행 상태가 "⏳ addBlock 실행 중"으로 표시되고
    And BlockManagementService가 직접 호출되어 블럭이 생성되고
    And 생성된 블럭 ID가 반환되고
    And 툴 실행 결과가 Task 컴포넌트에 "✓ 빨간색 사각형 블럭 생성 완료"로 표시되고
    And 블럭이 캔버스에 실시간으로 표시되고
    And 툴 호출 이벤트가 Event Log에 저장된다
```

### 시나리오 3: Long-Term Memory 기반 컨텍스트 복원
```gherkin
Feature: Long-Term Memory 검색
  Scenario: 과거 작업 이력을 기반으로 유사한 작업 수행
    Given 사용자가 이전에 "파란색 원 블럭 3개 생성"을 요청했고
    And 해당 이벤트가 Event Log에 저장되어 있고
    And 사용자가 "지난번처럼 원 블럭 만들어줘"를 요청했다
    When MemorySearchService가 BM25 검색으로 유사 발화를 검색하고
    And 검색 결과에서 "파란색 원 블럭 3개 생성" 이벤트를 찾고
    And 해당 이벤트의 toolCall 패턴을 시간 윈도우로 복원하고
    And Long-Term Memory를 Agent 컨텍스트에 포함한다
    Then Agent가 Long-Term Memory를 참고하여 작업을 수행하고
    And 파란색 원 블럭 3개가 생성되고
    And Agent가 "이전 작업과 유사하게 파란색 원 블럭 3개를 생성했습니다"라고 응답한다
```

### 시나리오 4: Agent Loop 제한 및 타임아웃
```gherkin
Feature: Agent Loop 제한
  Scenario: Agent가 10회 루프를 초과하면 강제 종료
    Given 사용자가 복잡한 작업을 요청했고
    And Agent가 실행 중이고
    And Agent가 이미 9회 툴 호출을 완료했다
    When Agent가 10번째 툴 호출을 완료하고
    And Agent가 추가 툴 호출을 시도한다
    Then Agent Loop이 강제 종료되고
    And "작업이 너무 복잡합니다. 작업을 나눠서 요청해주세요" 메시지가 표시되고
    And 현재까지 수행한 작업 결과가 표시되고
    And Agent 실행 종료 이벤트가 Event Log에 저장된다

  Scenario: Agent가 30초 타임아웃을 초과하면 강제 종료
    Given 사용자가 작업을 요청했고
    And Agent가 실행 중이고
    And 이미 25초가 경과했다
    When Agent 실행 시간이 30초를 초과한다
    Then Agent가 강제 종료되고
    And "작업 시간이 초과되었습니다. 다시 시도해주세요" 메시지가 표시되고
    And 현재까지 수행한 작업 결과가 표시되고
    And 타임아웃 이벤트가 Event Log에 저장된다
```

### 시나리오 5: 권한 없는 블럭 접근 시 에러 처리
```gherkin
Feature: 권한 검증
  Scenario: 사용자가 권한 없는 블럭에 대한 작업을 요청
    Given 사용자가 페이지에 로그인되어 있고
    And 페이지에 사용자가 읽기 권한만 있는 블럭이 있고
    And 사용자가 "이 블럭을 삭제해줘"를 요청했다
    When Agent가 deleteBlock 툴을 호출하고
    And BlockManagementService가 권한을 검증한다
    Then 권한 오류가 발생하고
    And "이 작업을 수행할 권한이 없습니다" 메시지가 표시되고
    And Agent가 다른 대안을 제안하고
    And 권한 오류 이벤트가 Event Log에 저장된다
```

### 시나리오 6: 실시간 상태 표시 및 Conversation UI
```gherkin
Feature: 실시간 Agent 상태 표시
  Scenario: Agent 실행 중 상태를 실시간으로 표시
    Given 사용자가 작업을 요청했고
    And Agent가 실행 중이다
    When Agent가 "Thinking..." 상태일 때
    Then Reasoning 컴포넌트에 Shimmer 애니메이션이 표시되고
    When Agent가 툴을 호출할 때
    Then Task 컴포넌트에 "⏳ 툴명 실행 중"이 표시되고
    When 툴 실행이 완료될 때
    Then Task 컴포넌트에 "✓ 툴명 완료"가 표시되고
    When 사용자가 Conversation에 마우스를 올릴 때
    Then Conversation 높이가 증가하고 선명도가 증가하고
    When 사용자가 마우스를 빼면
    Then Conversation이 축소되고 흐릿하게 표시된다
```

## 📋 개발 Task (도메인별)

### AI Management Domain
**참조 문서**: 
- [Software Design](../../../event-domain-design/domains/ai-management-domain/03-software-design.md)
- [Technical Specification](../../../event-domain-design/domains/ai-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/ai-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/ai-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] EventLog Aggregate 구현 (핵심 로직)
- [ ] EventLog Entity 구현
- [ ] Value Objects 구현 (EventId, EventType, UtteranceContent, AIResponse, ToolCallResult)
- [ ] Commands 정의 (LogUserUtterance, LogAIResponse, LogToolCall, LogBlockChange, SearchLongTermMemory)
- [ ] Events 정의 (UserUtteranceLogged, AIResponseLogged, ToolCallLogged, BlockChangeLogged)
- [ ] EventLogRepository 구현 (BM25 + JSONB 인덱스)
- [ ] MemorySearchService 구현 (BM25 검색 + 메타데이터 필터링)
- [ ] ContextAssemblyService 구현 (Short-Term + Long-Term + Canvas)
- [ ] ToolExecutionService 구현 (외부 도메인 서비스 직접 호출)
- [ ] AIQueryHandler 구현 (Use Case 조율)

#### Database
- [ ] ai_event_logs 테이블 생성 (Drizzle migration)
- [ ] event_type enum 생성
- [ ] BM25 전문 검색 인덱스 (GIN 인덱스)
- [ ] JSONB 메타데이터 인덱스 (jsonb_path_ops)
- [ ] RLS 정책 적용 (페이지별 접근 제어)

#### Server Actions / API Routes
- [ ] `/api/agent/route.ts` 구현 (Agent 실행 API)
  - Client Context 추출
  - System Prompt 빌더
  - Vercel AI SDK 통합 (`streamText`)
  - 툴 스키마 정의

#### Frontend
- [ ] `useAIAgent` Hook 구현 (`useChat` 래핑)
- [ ] AIAgentRunner 컴포넌트 구현
- [ ] Conversation UI 연동
- [ ] Message/Task/Tool 컴포넌트 렌더링

---

### 도메인 간 통합
- [ ] Block Management Domain 연동 (서비스 직접 호출)
- [ ] Canvas Management Domain 연동 (서비스 직접 호출)
- [ ] Vercel AI SDK 통합
- [ ] PostgreSQL BM25 검색 통합

---

### Testing & Quality
- [ ] Unit Tests (EventLog Aggregate, Services, Repository)
- [ ] Integration Tests (Context Assembly, Tool Execution, AI Query Handler)
- [ ] E2E Tests (사용자 발화 → Agent 실행 → 결과 확인)
- [ ] 성능 테스트 (Agent 성공률 > 85%, 평균 응답 시간 < 5초)

## 🎯 Definition of Done

### 기능 완료
- [ ] **시나리오 1**: 사용자 발화 입력 → Agent 자동 실행 정상 동작
- [ ] **시나리오 2**: Agent 툴 호출 및 블럭 조작 정상 동작
- [ ] **시나리오 3**: Long-Term Memory 기반 컨텍스트 복원 정상 동작
- [ ] **시나리오 4**: Agent Loop 제한 및 타임아웃 정상 동작
- [ ] **시나리오 5**: 권한 없는 블럭 접근 시 에러 처리 정상 동작
- [ ] **시나리오 6**: 실시간 상태 표시 및 Conversation UI 정상 동작
- [ ] **Event Log**: 모든 이벤트(발화, AI 응답, 툴 호출, 블럭 변경) 저장됨
- [ ] **UI/UX**: Frontend Specification 준수 (Conversation 호버 동작, Message/Task/Tool 컴포넌트)

### 기술 완료
- [ ] **단위 테스트**: EventLog Aggregate, Value Objects, Services (커버리지 85% 이상)
- [ ] **통합 테스트**: 
  - ContextAssemblyService (Short-Term + Long-Term + Canvas 조립)
  - ToolExecutionService (외부 도메인 연동)
  - AIQueryHandler (전체 Use Case 조율)
  - MemorySearchService (BM25 + 메타데이터 필터링)
- [ ] **E2E 테스트**: 
  - 사용자 발화 → Agent 실행 → 블럭 생성 플로우
  - Long-Term Memory 검색 시나리오
  - Agent Loop 제한 시나리오
- [ ] **성능 요구사항**: 
  - Agent 성공률 > 85%
  - 평균 응답 시간 < 5초
  - 컨텍스트 조립 시간 < 2초
  - Agent Loop 최대 10회, 30초 타임아웃
- [ ] **코드 리뷰**: 시니어 개발자 승인 완료

### 품질 완료
- [ ] **RLS 정책**: ai_event_logs 테이블 페이지별 접근 제어 적용
- [ ] **권한 검증**: 모든 툴 실행 시 권한 확인 로직 구현
- [ ] **에러 처리**: 
  - Agent Loop 초과 시 명확한 메시지 표시
  - 타임아웃 시 현재까지 작업 결과 표시
  - 권한 오류 시 대안 제안
- [ ] **보안**: 
  - 페이지 격리 (Event Log는 페이지 범위로 격리)
  - 입력 검증 (SQL Injection, XSS 방지)
  - LLM Prompt Injection 방어
  - 보안 취약점 0개
- [ ] **접근성**: 
  - 키보드 포커스 관리 (Cmd/Ctrl + K로 입력창 포커스)
  - 스크린 리더 지원 ("AI에게 작업 요청하기")
  - ARIA 속성 적용

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**마일스톤**:
- Sprint 014 (Week 1-2): Event Log Foundation + Context Assembly
- Sprint 015 (Week 3-4): Agent Integration + Frontend
- Sprint 016 (Week 5): Testing & Polish

## 🔗 의존성
- **선행 Story**: 없음 (Epic 004의 첫 번째 Story)
- **후행 Story**: 향후 Advanced AI Features (Multi-Agent, 워크플로우 자동화)
- **도메인 의존성**: Block Management Domain, Canvas Management Domain

## 📁 관련 문서

### Domain Documentation
**AI Management Domain**:
- [Event Storming](../../../event-domain-design/domains/ai-management-domain/01-event-storm.md)
- [Process Model](../../../event-domain-design/domains/ai-management-domain/02-process-model.md) - Scenario 1
- [Software Design](../../../event-domain-design/domains/ai-management-domain/03-software-design.md) - Event Log Aggregate
- [User Flow](../../../event-domain-design/domains/ai-management-domain/03-user-flow.md) - Scenario 1
- [Technical Specification](../../../event-domain-design/domains/ai-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/ai-management-domain/04-db-schema.md) - ai_event_logs 테이블
- [Frontend Specification](../../../event-domain-design/domains/ai-management-domain/04-frontend-specification.md) - UI 컴포넌트들
- [Basic AI Context Engineering](../../../event-domain-design/discussion/ai-automation/basic-ai-context-engineering.md) - 설계 상세

### Agile Planning
- [Epic 004: Basic AI Context Engineering](../../epics/epic-004-basic-ai-context-engineering.md)

