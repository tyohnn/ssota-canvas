# Epic-004: Basic AI Context Engineering

## 🎯 Epic 개요
**Epic Goal**: As a 사용자, I want to AI Agent에게 자연어로 작업을 요청하고 자동으로 캔버스 조작 및 블럭 액션을 실행받아 so that 복잡한 작업을 빠르고 효율적으로 완료할 수 있다

**기간**: 2025-11-12 ~ 2025-12-20 (5주, 2-3 Sprints)  
**Story Points**: 89pts (예상)  
**우선순위**: High  
**현재 상태**: 📋 계획 중

## 📊 비즈니스 가치

### 문제 정의
1. **수동 작업의 비효율성**: 
   - 사용자가 블럭 생성, 수정, 연결 등을 수동으로 수행해야 함
   - 반복적인 작업에 시간 소모
   - 복잡한 작업을 단계별로 직접 수행해야 함

2. **컨텍스트 이해 부족**: 
   - AI가 현재 캔버스 상태를 파악하지 못함
   - 선택된 블럭, 주변 블럭, 과거 작업 이력을 활용하지 못함
   - 사용자 의도를 정확히 파악하지 못함

3. **작업 자동화 부재**:
   - Agent가 자율적으로 작업을 수행하지 못함
   - 사용자가 중간에 개입해야 하는 단계가 많음
   - 작업 완료까지 시간이 오래 걸림

### 해결책
1. **Vercel AI Agent 기반 자율 실행**: 
   - 사용자 발화만 입력하면 Agent가 자동으로 작업 수행
   - 액션칩 제거로 중간 클릭 단계 제거
   - Agent Loop 자동 관리 (최대 10회)

2. **지능적 컨텍스트 조립**: 
   - Short-Term Memory: 최근 20개 이벤트
   - Long-Term Memory: BM25 전문 검색 + 메타데이터 필터링
   - Canvas Context: 선택/주변 블럭 정보
   - 프론트엔드에서 이미 계산된 블럭 ID만 전달

3. **툴 중심 아키텍처**:
   - 모든 작업을 툴로 표준화
   - Block Management, Canvas Management 서비스 직접 호출
   - 통합 이벤트 로그로 모든 작업 추적

### 기대 효과
- ✅ **작업 효율성 향상**: 복잡한 작업을 자연어로 빠르게 완료
- ✅ **사용자 경험 개선**: 중간 개입 없이 자동으로 작업 수행
- ✅ **컨텍스트 인식**: 캔버스 상태와 과거 작업을 활용한 지능적 작업
- ✅ **확장 가능한 구조**: 새로운 툴 추가로 기능 확장 용이
- ✅ **작업 추적**: 모든 작업을 이벤트 로그로 기록하여 분석 가능

---

## 🎯 성공 기준

### 기능적 기준
- [ ] **사용자 발화 처리**: 자연어 입력을 받아 Agent 실행 (AI-001)
- [ ] **컨텍스트 자동 조립**: Short-Term + Long-Term + Canvas 컨텍스트 수집 (AI-002)
- [ ] **Agent 툴 실행**: Block/Canvas Management 서비스 직접 호출 (AI-003)
- [ ] **이벤트 로깅**: 모든 이벤트(발화, AI 응답, 툴 호출, 블럭 변경) 저장 (AI-004)
- [ ] **Long-Term Memory 검색**: BM25 + 메타데이터 필터링으로 과거 이벤트 복원 (AI-005)
- [ ] **실시간 피드백**: Agent 실행 상태 및 툴 호출 상태 실시간 표시 (AI-006)

### 성능 기준
- [ ] **Agent 성공률**: 사용자 요청 성공 완료 비율 > 85%
- [ ] **평균 응답 시간**: 발화부터 Agent 완료까지 < 5초
- [ ] **툴 호출 평균 횟수**: Agent당 평균 2-5개 툴 호출
- [ ] **컨텍스트 조립 시간**: 컨텍스트 수집 및 조합 < 2초
- [ ] **Agent Loop 타임아웃**: 최대 10회 루프, 30초 타임아웃

### 사용성 기준
- [ ] **직관적인 발화 입력**: 자연어로 작업 요청 가능
- [ ] **실시간 상태 표시**: Agent 실행 중 상태 및 툴 호출 상태 표시
- [ ] **에러 처리**: 명확한 에러 메시지 및 재시도 옵션
- [ ] **작업 완료 피드백**: 작업 완료 시 요약 및 결과 표시

### 품질 기준
- [ ] **단위 테스트 커버리지 85% 이상**: Domain Services, Application Services
- [ ] **통합 테스트 통과**: Agent 실행 플로우 전체 검증
- [ ] **E2E 테스트 통과**: 사용자 발화 → Agent 실행 → 결과 확인
- [ ] **RLS 정책 적용**: Event Log 페이지별 접근 제어
- [ ] **보안 취약점 0개**: 보안 검증 완료

---

## 📋 포함 기능

### 핵심 기능
- **Event Log Aggregate**: Append-Only Audit Log 패턴으로 모든 이벤트 저장
- **Context Assembly Service**: Short-Term + Long-Term + Canvas 컨텍스트 조립
- **Tool Execution Service**: Agent 툴 호출 실행 및 외부 도메인 연동
- **Memory Search Service**: BM25 전문 검색 + 메타데이터 필터링
- **AI Query Handler**: 발화 처리 전체 Use Case 조율
- **Vercel AI SDK 통합**: Agent Loop 자동 관리 및 스트리밍 응답

### 지원 기능
- **Conversation UI**: 일시적 정보 표시 (호버 시 상세, 평상시 축소/흐릿)
- **Message 컴포넌트**: 사용자 발화 및 AI 응답 표시
- **Task 컴포넌트**: 툴 호출 목록 표시
- **Tool 컴포넌트**: 개별 툴 호출 상세 정보
- **Reasoning 컴포넌트**: Agent 추론 과정 표시 (선택적)
- **Client Context 수집**: 선택 블럭, 주변 블럭 ID 수집

### 통합 기능
- **Block Management Domain 연동**: 블럭 CRUD 및 블럭 액션 실행 (서비스 직접 호출)
- **Canvas Management Domain 연동**: 캔버스 상태 조회 및 엣지 생성 (서비스 직접 호출)
- **Vercel AI SDK 통합**: LLM 추론 및 툴 호출 결정
- **PostgreSQL BM25 검색**: 전문 검색 및 JSONB 메타데이터 필터링
- **Event Log 저장**: 모든 이벤트 Append-Only 저장

---

## 🚫 제외 범위
- **임베딩 기반 검색**: 현재는 BM25 + 메타데이터 필터링만 사용 (향후 확장 가능)
- **의미적 블럭 검색**: Canvas Context의 의미적 블럭은 미구현 (향후 추가)
- **세션 관리**: 세션 개념 없이 페이지 단위로 이벤트 관리
- **대화 히스토리 조회**: 메시지는 휘발적이며 서버에서 불러오지 않음
- **고급 Agent 기능**: Multi-Agent 협업, 워크플로우 자동화는 별도 Epic에서 처리

---

## 🔗 의존성

**선행 Epic**: 
- ✅ Epic-002: Canvas Management Domain (완료)
- ✅ Epic-003: Block Management Domain (진행 중, 75% 완료)

**후행 Epic**: 
- 향후: Advanced AI Features (Multi-Agent, 워크플로우 자동화)

**외부 의존성**: 
- Vercel AI SDK (`ai` 패키지)
- PostgreSQL (BM25 전문 검색, JSONB 인덱스)
- Block Management Domain Service (직접 호출)
- Canvas Management Domain Service (직접 호출)

---

## 🏗️ 기술적 고려사항

### 아키텍처
- **DDD 패턴**: Event Log Aggregate, Domain Services, Application Services
- **Server Reasoning + Client Execution**: LLM 추론은 서버, 툴 실행은 클라이언트
- **Vercel AI SDK 통합**: `useChat` Hook, `onToolCall`, `addToolOutput`
- **서비스 직접 호출**: ACL 없이 Block/Canvas Management 서비스 직접 호출
- **Append-Only Audit Log**: 이벤트 로그는 생성 후 수정/삭제 불가

### 성능
- **BM25 전문 검색**: PostgreSQL 내장 기능으로 추가 비용 없음
- **JSONB GIN 인덱스**: 메타데이터 필터링 최적화
- **병렬 컨텍스트 조립**: Promise.all로 3가지 컨텍스트 병렬 수집
- **Redis 캐싱**: 컨텍스트 조립 결과 캐싱 (TTL: 5분)
- **스트리밍 응답**: Vercel AI SDK의 실시간 응답 표시

### 보안
- **페이지 격리**: Event Log는 페이지 범위로 격리
- **RLS 정책**: 페이지 멤버십 기반 데이터 접근 제어
- **권한 검증**: 모든 툴 실행 시 권한 확인
- **타임아웃 제한**: Agent Loop 최대 10회, 30초 타임아웃

---

## 📅 마일스톤

### Sprint 014: AI Foundation (예상 2주)
- **Week 1**: Event Log Aggregate 및 Repository 구현
  - Event Log Aggregate 구현 (Append-Only)
  - EventLogRepository 구현 (BM25 + JSONB 인덱스)
  - Value Objects 구현 (EventId, EventType, UtteranceContent, AIResponse, ToolCallResult)
- **Week 2**: Domain Services 구현
  - MemorySearchService 구현 (BM25 + 메타데이터 필터링)
  - ContextAssemblyService 구현 (3가지 컨텍스트 조립)
  - ToolExecutionService 구현 (외부 도메인 서비스 직접 호출)

### Sprint 015: Agent Integration (예상 2주)
- **Week 3**: Application Service 및 Server API 구현
  - AIQueryHandler 구현 (Use Case 조율)
  - Server API Route 구현 (`/api/agent/route.ts`)
  - Vercel AI SDK 통합 (`streamText`, `onToolCall`)
- **Week 4**: Frontend Integration
  - `useAIAgent` Hook 구현 (`useChat` 래핑)
  - AIAgentRunner 컴포넌트 구현
  - Conversation UI 연동

### Sprint 016: Polish & Testing (예상 1주)
- **Week 5**: 테스트 및 최적화
  - 통합 테스트 작성
  - E2E 테스트 작성
  - 성능 최적화 및 버그 수정
  - 사용자 피드백 수집 및 개선

---

## 🎯 완료 기준

- [ ] 모든 핵심 기능 완료
  - [ ] Event Log Aggregate 구현 완료
  - [ ] Context Assembly Service 구현 완료
  - [ ] Tool Execution Service 구현 완료
  - [ ] AI Query Handler 구현 완료
  - [ ] Vercel AI SDK 통합 완료
- [ ] 성공 기준 달성
  - [ ] Agent 성공률 > 85%
  - [ ] 평균 응답 시간 < 5초
  - [ ] 컨텍스트 조립 시간 < 2초
- [ ] 테스트 통과
  - [ ] 단위 테스트 커버리지 85% 이상
  - [ ] 통합 테스트 통과
  - [ ] E2E 테스트 통과
- [ ] 문서화 완료
  - [ ] Technical Specification 완료
  - [ ] Frontend Specification 완료
  - [ ] 사용자 가이드 작성

---

## 📁 관련 문서

- [Event Storming 결과](../../event-domain-design/domains/ai-management-domain/01-event-storm.md)
- [Process Model](../../event-domain-design/domains/ai-management-domain/02-process-model.md)
- [Software Design](../../event-domain-design/domains/ai-management-domain/03-software-design.md)
- [User Flow](../../event-domain-design/domains/ai-management-domain/03-user-flow.md)
- [Technical Specification](../../event-domain-design/domains/ai-management-domain/04-technical-specification.md)
- [Frontend Specification](../../event-domain-design/domains/ai-management-domain/04-frontend-specification.md)
- [DB Schema](../../event-domain-design/domains/ai-management-domain/04-db-schema.md)
- [Basic AI Context Engineering 설계](../../event-domain-design/discussion/ai-automation/basic-ai-context-engineering.md)

---

## 📊 Story 예상 목록

### Phase 1: Event Log Foundation (Sprint 014)
- **AI-001**: Event Log Aggregate 구현 (13pts)
  - EventId, EventType, UtteranceContent, AIResponse, ToolCallResult VO
  - EventLog Entity
  - EventLogAggregate (Append-Only)
  - Commands & Events 구현
  
- **AI-002**: EventLogRepository 구현 (8pts)
  - BM25 전문 검색 구현
  - JSONB 메타데이터 필터링 구현
  - 시간 가중치 적용
  - 인덱스 최적화

- **AI-003**: MemorySearchService 구현 (8pts)
  - BM25 검색 메서드
  - 메타데이터 패턴 매칭
  - 하이브리드 검색
  - 시간 가중치 적용

### Phase 2: Context & Tool Execution (Sprint 014-015)
- **AI-004**: ContextAssemblyService 구현 (13pts)
  - Short-Term Memory 조립
  - Long-Term Memory 조립 (MemorySearchService 활용)
  - Canvas Context 조립 (CanvasManagementService 직접 호출)
  - Agent 입력 포맷 변환

- **AI-005**: ToolExecutionService 구현 (13pts)
  - BlockManagementService 직접 호출
  - CanvasManagementService 직접 호출
  - 툴 실행 결과 파싱
  - 에러 처리 및 재시도 로직

### Phase 3: Agent Integration (Sprint 015)
- **AI-006**: AIQueryHandler 구현 (13pts)
  - 발화 처리 Use Case 조율
  - Vercel AI SDK 통합 (`streamText`)
  - Agent Loop 관리 (maxSteps: 10)
  - 이벤트 로깅 오케스트레이션

- **AI-007**: Server API Route 구현 (8pts)
  - `/api/agent/route.ts` 구현
  - Client Context 추출 (`metadata`에서)
  - System Prompt 빌더
  - 툴 스키마 정의 (`inputSchema`, execute 없음)

- **AI-008**: Frontend Hook 구현 (8pts)
  - `useAIAgent` Hook (`useChat` 래핑)
  - `onToolCall` 구현
  - `addToolOutput` 구현
  - Client Context 수집 및 전달

- **AI-009**: AIAgentRunner 컴포넌트 구현 (5pts)
  - Conversation UI 연동
  - 메시지 렌더링 (`message.parts` 사용)
  - 실시간 상태 표시

### Phase 4: Testing & Polish (Sprint 016)
- **AI-010**: 통합 테스트 작성 (5pts)
  - ContextAssemblyService 테스트
  - ToolExecutionService 테스트
  - AIQueryHandler 테스트

- **AI-011**: E2E 테스트 작성 (5pts)
  - 사용자 발화 처리 시나리오
  - Agent 툴 호출 시나리오
  - Long-Term Memory 검색 시나리오

**총 예상 Story Points**: 89pts

---

## 🔄 진행 상황 추적

### Sprint 014 (예정)
- [ ] AI-001: Event Log Aggregate 구현
- [ ] AI-002: EventLogRepository 구현
- [ ] AI-003: MemorySearchService 구현
- [ ] AI-004: ContextAssemblyService 구현
- [ ] AI-005: ToolExecutionService 구현

### Sprint 015 (예정)
- [ ] AI-006: AIQueryHandler 구현
- [ ] AI-007: Server API Route 구현
- [ ] AI-008: Frontend Hook 구현
- [ ] AI-009: AIAgentRunner 컴포넌트 구현

### Sprint 016 (예정)
- [ ] AI-010: 통합 테스트 작성
- [ ] AI-011: E2E 테스트 작성
- [ ] 성능 최적화 및 버그 수정
- [ ] 사용자 피드백 수집 및 개선

---

## 💡 리스크 및 대응 방안

### 기술적 리스크
1. **Vercel AI SDK 학습 곡선**
   - **리스크**: 새로운 SDK 학습에 시간 소요
   - **대응**: 사전 학습 및 PoC 구현

2. **BM25 검색 성능**
   - **리스크**: PostgreSQL BM25 검색 성능 이슈
   - **대응**: 인덱스 최적화 및 쿼리 튜닝

3. **Agent Loop 제어**
   - **리스크**: 무한 루프 또는 불필요한 툴 호출
   - **대응**: maxSteps 제한 및 타임아웃 설정

### 비즈니스 리스크
1. **사용자 기대치 관리**
   - **리스크**: 사용자가 AI Agent의 능력을 과대 기대
   - **대응**: 명확한 사용 가이드 및 제한사항 안내

2. **LLM 비용**
   - **리스크**: Agent Loop로 인한 LLM 비용 증가
   - **대응**: Loop 횟수 제한 및 비용 모니터링

---

## 📝 참고사항

- **설계 문서 완료**: Technical Specification, Frontend Specification 완료
- **의존성 확인**: Block Management Domain 75% 완료, Canvas Management Domain 완료
- **기술 스택**: Vercel AI SDK, PostgreSQL, Next.js, React
- **아키텍처**: Server Reasoning + Client Execution 하이브리드 방식

---

이 Epic을 통해 사용자가 자연어로 AI Agent에게 작업을 요청하고 자동으로 실행받을 수 있는 기본 AI 기능을 제공합니다! 🤖

