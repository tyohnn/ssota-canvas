# Sprint 014: AI Foundation

## 🎯 Sprint 개요
**목표**: 2주 동안 Event Log Aggregate와 핵심 Domain Services (Memory Search, Context Assembly, Tool Execution)를 완성하여 AI Agent의 기반을 구축한다

**기간**: 2025-11-12 (수) ~ 2025-11-25 (월) (2주)  
**팀**: 시니어 개발자 1명 + 주니어 개발자 1명  
**Sprint 유형**: Implementation Sprint  
**Story Points**: 55pts  

## 📋 포함 Story

### Story AI-001: AI Agent 기반 자연어 작업 자동화 (Phase 1 & 2: 55pts)

**Phase 1: Event Log Foundation (29pts)**
- Event Log Aggregate 구현 (13pts)
- EventLogRepository 구현 (8pts)
- MemorySearchService 구현 (8pts)

**Phase 2: Context & Tool Execution (26pts)**
- ContextAssemblyService 구현 (13pts)
- ToolExecutionService 구현 (13pts)

**참조 문서**: [Story AI-001](../stories/ai-management/story-ai-001-agent-based-automation.md)

---

## 📅 Sprint 일정

### Week 1 (2025-11-12 ~ 2025-11-18)

#### 월요일 (11/12)
- Sprint Planning 회의 (2시간)
- Event Log Aggregate 설계 검토
- EventId, EventType, UtteranceContent VO 구현 시작

#### 화요일 (11/13)
- AIResponse, ToolCallResult VO 구현
- EventLog Entity 구현
- EventLogAggregate 구현 (Commands & Events)

#### 수요일 (11/14)
- EventLogAggregate 단위 테스트 작성
- ai_event_logs 테이블 마이그레이션 작성
- event_type enum 생성

#### 목요일 (11/15)
- EventLogRepository 인터페이스 정의
- EventLogRepository 구현 (Drizzle)
- BM25 전문 검색 인덱스 생성

#### 금요일 (11/16)
- JSONB 메타데이터 인덱스 생성 (jsonb_path_ops)
- EventLogRepository 통합 테스트 작성
- Week 1 진행 상황 검토

---

### Week 2 (2025-11-19 ~ 2025-11-25)

#### 월요일 (11/19)
- MemorySearchService 구현 시작
- BM25 검색 메서드 구현
- 메타데이터 패턴 매칭 구현

#### 화요일 (11/20)
- 하이브리드 검색 구현
- 시간 가중치 적용 로직 구현
- MemorySearchService 단위 테스트 작성

#### 수요일 (11/21)
- ContextAssemblyService 구현 시작
- Short-Term Memory 조립 로직
- Long-Term Memory 조립 로직 (MemorySearchService 활용)

#### 목요일 (11/22)
- Canvas Context 조립 로직 (CanvasManagementService 직접 호출)
- Agent 입력 포맷 변환 로직
- ContextAssemblyService 통합 테스트 작성

#### 금요일 (11/23)
- ToolExecutionService 구현 시작
- BlockManagementService 직접 호출 로직
- CanvasManagementService 직접 호출 로직

#### 월요일 (11/25)
- 툴 실행 결과 파싱 로직
- 에러 처리 및 재시도 로직
- ToolExecutionService 통합 테스트 작성
- Sprint 014 완료 및 회고

---

## 📋 상세 Task 목록

### Phase 1: Event Log Foundation (29pts)

#### Event Log Aggregate 구현 (13pts)
- [ ] **EventId VO**: UUID 검증 및 동등성 비교 (1pt)
- [ ] **EventType VO**: 이벤트 타입 검증 (user_utterance, ai_response, tool_call, block_change) (1pt)
- [ ] **UtteranceContent VO**: 발화 내용 검증 (최대 5000자) (1pt)
- [ ] **AIResponse VO**: AI 응답 내용 검증 (1pt)
- [ ] **ToolCallResult VO**: 툴 호출 결과 검증 (1pt)
- [ ] **EventLog Entity**: 이벤트 로그 엔티티 구현 (2pts)
- [ ] **EventLogAggregate**: Append-Only 패턴 구현 (3pts)
- [ ] **Commands**: LogUserUtterance, LogAIResponse, LogToolCall, LogBlockChange (2pts)
- [ ] **Events**: UserUtteranceLogged, AIResponseLogged, ToolCallLogged, BlockChangeLogged (1pt)

#### EventLogRepository 구현 (8pts)
- [ ] **Repository 인터페이스**: EventLogRepository 인터페이스 정의 (1pt)
- [ ] **Drizzle Repository**: DrizzleEventLogRepository 구현 (3pts)
- [ ] **BM25 전문 검색**: to_tsvector + GIN 인덱스 (2pts)
- [ ] **JSONB 메타데이터 필터링**: jsonb_path_ops 인덱스 (1pt)
- [ ] **시간 가중치**: exp(-t/τ) 적용 로직 (1pt)

#### MemorySearchService 구현 (8pts)
- [ ] **Service 인터페이스**: MemorySearchService 인터페이스 정의 (1pt)
- [ ] **BM25 검색 메서드**: searchByKeyword() 구현 (2pts)
- [ ] **메타데이터 패턴 매칭**: searchByMetadata() 구현 (2pts)
- [ ] **하이브리드 검색**: searchHybrid() 구현 (2pts)
- [ ] **시간 가중치**: applyTimeWeight() 구현 (1pt)

---

### Phase 2: Context & Tool Execution (26pts)

#### ContextAssemblyService 구현 (13pts)
- [ ] **Service 인터페이스**: ContextAssemblyService 인터페이스 정의 (1pt)
- [ ] **Short-Term Memory 조립**: assembleShortTermMemory() 구현 (2pts)
- [ ] **Long-Term Memory 조립**: assembleLongTermMemory() 구현 (3pts)
- [ ] **Canvas Context 조립**: assembleCanvasContext() 구현 (3pts)
  - CanvasManagementService.getBlocksByIds() 직접 호출
  - 선택 블럭, 주변 블럭 조회
  - 의미적 블럭 조회 (MVP에서 선택적)
- [ ] **Agent 입력 포맷 변환**: formatForAgent() 구현 (2pts)
- [ ] **병렬 컨텍스트 조립**: Promise.all 최적화 (1pt)
- [ ] **권한 검증 및 필터링**: 권한 없는 블럭 제외 (1pt)

#### ToolExecutionService 구현 (13pts)
- [ ] **Service 인터페이스**: ToolExecutionService 인터페이스 정의 (1pt)
- [ ] **BlockManagementService 연동**: 블럭 CRUD 직접 호출 (3pts)
  - createBlock(), deleteBlock(), updateProperty(), executeBlockAction()
- [ ] **CanvasManagementService 연동**: 캔버스 조작 직접 호출 (3pts)
  - connectBlocks(), searchByHop(), searchByKeyword()
- [ ] **툴 실행 결과 파싱**: parseToolResult() 구현 (2pts)
- [ ] **에러 처리**: 권한 오류, 네트워크 오류 처리 (2pts)
- [ ] **재시도 로직**: 재시도 가능한 에러 최대 3회 재시도 (1pt)
- [ ] **Event Log 저장**: 툴 호출 이벤트 로깅 (1pt)

---

### Database Tasks
- [ ] **ai_event_logs 테이블 생성**: Drizzle migration (2pts)
- [ ] **event_type enum 생성**: user_utterance, ai_response, tool_call, block_change (1pt)
- [ ] **BM25 인덱스 생성**: GIN 인덱스 (to_tsvector) (1pt)
- [ ] **JSONB 인덱스 생성**: jsonb_path_ops 인덱스 (1pt)
- [ ] **RLS 정책 적용**: 페이지별 접근 제어 (2pts)
- [ ] **복합 인덱스**: (page_id, created_at) 복합 인덱스 (1pt)

---

### Testing Tasks
- [ ] **단위 테스트**: Value Objects, Entities, Aggregates (커버리지 85% 이상) (5pts)
- [ ] **통합 테스트**: Repository, Services (3pts)
  - EventLogRepository (BM25 검색, 메타데이터 필터링)
  - MemorySearchService (하이브리드 검색, 시간 가중치)
  - ContextAssemblyService (3가지 컨텍스트 조립)
  - ToolExecutionService (외부 도메인 연동)

---

## 🔗 의존성 및 리스크

### 의존성
- **외부 도메인**:
  - ✅ Block Management Domain (75% 완료, 필요한 기능 사용 가능)
  - ✅ Canvas Management Domain (완료)
- **데이터베이스**: PostgreSQL BM25 전문 검색 기능
- **인프라**: Drizzle ORM, Supabase

### 리스크

#### 기술적 리스크
1. **BM25 검색 성능**
   - **리스크**: PostgreSQL BM25 검색 성능이 기대에 미치지 못할 수 있음
   - **대응**: GIN 인덱스 최적화, 쿼리 튜닝, 필요시 Elasticsearch 검토
   - **우선순위**: High

2. **도메인 간 연동 복잡도**
   - **리스크**: Block/Canvas Management 서비스 직접 호출 시 에러 처리 복잡도 증가
   - **대응**: 명확한 에러 타입 정의, 재시도 로직 구현, 통합 테스트 강화
   - **우선순위**: Medium

3. **시간 가중치 알고리즘**
   - **리스크**: exp(-t/τ) 알고리즘이 실제 사용 패턴과 맞지 않을 수 있음
   - **대응**: τ 값을 조정 가능하도록 설계, 실험을 통한 최적값 도출
   - **우선순위**: Low

#### 일정 리스크
1. **Story Points 과다**
   - **리스크**: 55pts가 2주 내 완료 불가능할 수 있음
   - **대응**: Phase 2의 일부(ToolExecutionService)를 Sprint 015로 이동 가능
   - **우선순위**: Medium

2. **학습 곡선**
   - **리스크**: BM25 전문 검색, JSONB 인덱스 등 새로운 기술 학습 필요
   - **대응**: 사전 학습, PoC 구현, 페어 프로그래밍
   - **우선순위**: Medium

---

## 🎯 완료 기준 (Definition of Done)

### 기능적 완료
- [ ] **Event Log Aggregate**: 모든 Commands & Events 정상 동작
- [ ] **EventLogRepository**: BM25 검색 + JSONB 필터링 정상 동작
- [ ] **MemorySearchService**: 하이브리드 검색 + 시간 가중치 정상 동작
- [ ] **ContextAssemblyService**: 3가지 컨텍스트 조립 정상 동작
- [ ] **ToolExecutionService**: 외부 도메인 연동 정상 동작
- [ ] **Database**: 모든 테이블, 인덱스, RLS 정책 적용 완료

### 기술적 완료
- [ ] **단위 테스트**: 커버리지 85% 이상
- [ ] **통합 테스트**: Repository, Services 테스트 통과
- [ ] **코드 리뷰**: 시니어 개발자 승인 완료
- [ ] **성능 테스트**: 
  - BM25 검색 응답 시간 < 500ms
  - 컨텍스트 조립 시간 < 2초
  - 툴 실행 시간 < 1초 (대부분)

### 품질 완료
- [ ] **RLS 정책**: ai_event_logs 테이블 페이지별 접근 제어 적용
- [ ] **권한 검증**: ContextAssemblyService, ToolExecutionService 권한 검증 구현
- [ ] **에러 처리**: 모든 에러 케이스에 대한 명확한 에러 메시지
- [ ] **문서화**: 각 Service의 사용법 및 제약사항 문서화
- [ ] **보안 취약점**: 0개

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **11/12 (월)**: Sprint Planning 완료, EventId/EventType VO 구현
- [ ] **11/13 (화)**: 나머지 VO + EventLog Entity 구현
- [ ] **11/14 (수)**: EventLogAggregate 구현 + 테스트
- [ ] **11/15 (목)**: EventLogRepository 구현
- [ ] **11/16 (금)**: 인덱스 생성 + Week 1 검토
- [ ] **11/19 (월)**: MemorySearchService 구현
- [ ] **11/20 (화)**: MemorySearchService 완료 + 테스트
- [ ] **11/21 (수)**: ContextAssemblyService 구현
- [ ] **11/22 (목)**: ContextAssemblyService 완료 + 테스트
- [ ] **11/23 (금)**: ToolExecutionService 구현 시작
- [ ] **11/25 (월)**: ToolExecutionService 완료 + Sprint 회고

### 주간 체크포인트
- [ ] **Week 1 종료 (11/16)**: Phase 1 완료 (Event Log Foundation)
  - EventLog Aggregate, EventLogRepository, MemorySearchService 구현 완료
  - Database 마이그레이션 완료
  - 단위 테스트 커버리지 85% 이상
- [ ] **Week 2 종료 (11/25)**: Phase 2 완료 (Context & Tool Execution)
  - ContextAssemblyService, ToolExecutionService 구현 완료
  - 통합 테스트 통과
  - Sprint 014 목표 달성

---

## 📁 관련 문서

### Epic & Story
- [Epic 004: Basic AI Context Engineering](../epics/epic-004-basic-ai-context-engineering.md)
- [Story AI-001: AI Agent 기반 자연어 작업 자동화](../stories/ai-management/story-ai-001-agent-based-automation.md)

### Domain Documentation
- [AI Management Domain - Software Design](../../event-domain-design/domains/ai-management-domain/03-software-design.md)
- [AI Management Domain - Technical Specification](../../event-domain-design/domains/ai-management-domain/04-technical-specification.md)
- [AI Management Domain - Database Schema](../../event-domain-design/domains/ai-management-domain/04-db-schema.md)

### Testing
- [AI Management Domain - Testing Strategy](../../event-domain-design/domains/ai-management-domain/05-testing-strategy.md) (작성 예정)

---

## 💡 Sprint 회고 준비

### Start (새로 시작할 것)
- TBD (Sprint 종료 시 작성)

### Stop (중단할 것)
- TBD (Sprint 종료 시 작성)

### Continue (계속할 것)
- TBD (Sprint 종료 시 작성)

---

## 📝 노트

- **BM25 검색 성능**: 초기 구현 후 성능 테스트를 통해 인덱스 최적화 필요
- **의미적 블럭 조회**: MVP에서는 선택적 구현, Phase 2에서 제외 가능
- **ToolExecutionService**: 일정 지연 시 Sprint 015로 이동 가능
- **페어 프로그래밍**: BM25 검색 구현 시 페어 프로그래밍 권장

---

**Sprint 014 시작일**: 2025-11-12 (수)  
**Sprint 014 종료일**: 2025-11-25 (월)  
**다음 Sprint**: Sprint 015 - Agent Integration

