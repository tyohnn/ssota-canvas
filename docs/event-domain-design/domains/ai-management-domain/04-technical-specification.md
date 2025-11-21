# Technical Specification: AI Management Domain

## 🎯 개요

**도메인**: AI Management Domain  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-11-12  
**버전**: v2.0 (Simplified - Vercel AI Agent)

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 구현 (TDD Implementation)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-technical-specification-guide.md`  
> **작성 시점**: Software Design 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

AI Management Domain은 **Vercel AI Agent 기반 AI 어시스턴트**의 핵심 도메인입니다. 사용자 발화를 처리하고, 컨텍스트를 자동 조립하며, Agent가 자율적으로 툴을 호출하여 작업을 수행합니다. **세션 없는 Append-Only Audit Log** 패턴을 채택하여 모든 이벤트(발화, AI 응답, 툴 호출, 블럭 변경)를 통합 저장하고, **BM25 전문 검색 + 메타데이터 필터링** 전략으로 Long-Term Memory를 복원합니다.

### Software Design 연결점

- **입력**: `03-software-design.md` - Event Log Aggregate (5개 Commands, 4개 Events)
- **입력**: `02-process-model.md` - 1개 주요 시나리오 (AI Query Processing)
- **입력**: `basic-ai-context-engineering.md` - 설계 회의록 (컨텍스트 전략, Agent 아키텍처)
- **출력**: 구현 수도코드 + 테스트 수도코드

### 핵심 설계 결정 (Software Design 반영)

1. **Vercel AI SDK 채택**: Agent Loop 자동 관리, 툴 호출 표준화
2. **액션칩 제거**: Agent가 직접 툴 호출 (사용자 중간 클릭 불필요)
3. **컨텍스트 단순화**: Short-Term + Long-Term + Canvas (3가지만)
4. **세션 없는 Audit Log**: 모든 이벤트 독립 저장, 세션 시작/종료 개념 제거
5. **통합 이벤트 로그**: 발화 + AI 응답 + 툴 실행 + 블럭 변경 통합
6. **BM25 + 메타데이터 필터링**: 임베딩 제거, PostgreSQL 내장 기능 활용

### TDD 구현 순서 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 7개
  - EventId, PageId, UserId
  - EventType (user_utterance, ai_response, tool_call, block_change)
  - UtteranceContent, AIResponse, ToolCallResult
  - EventPayload (타입별 Value Objects)

Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 1개
  - EventLog Entity

Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 1개
  - EventLogAggregate (Append-Only)

Phase 4: Repository (⭐️⭐️⭐️⭐️) - 1개
  - EventLogRepository (BM25 + JSONB 인덱스)

Phase 5: Domain Services (⭐️⭐️⭐️⭐️) - 3개
  - ContextAssemblyService (컨텍스트 조립)
  - ToolExecutionService (툴 실행)
  - MemorySearchService (Long-Term Memory 검색)

Phase 6: Application Services (⭐️⭐️⭐️⭐️⭐️) - 1개
  - AIQueryHandler (Use Case 조율)

Phase 7: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 2개
  - submitUtteranceAction (발화 제출 및 Agent 실행)
  - getConversationHistoryAction (대화 히스토리 조회)

Phase 8: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 3개
  - 사용자 발화 처리 시나리오
  - Agent 툴 호출 시나리오
  - Long-Term Memory 검색 시나리오
```

---

## 🧩 DDD Components

> **가이드 참조**: Phase 2.2 - DDD 컴포넌트 수도코드 작성

### 1. Value Objects 수도코드

#### EventId VO

- **파일 위치**: `src/domains/ai-management/shared/value-objects/event-id.vo.ts`
- **역할**: Event Log의 고유 식별자를 표현하고 유효성을 검증
- **주요 기능**:
  - UUID 형식 유효성 검사 (RFC 4122 준수)
  - 다른 EventId 객체와의 동등성 비교
  - 문자열 변환 및 직렬화 지원
- **에러 처리**: 잘못된 UUID 형식 시 `AIManagementError` 발생
- **비즈니스 규칙**: 모든 이벤트는 고유한 UUID를 가져야 함

**사용 시나리오**:
- 이벤트 생성 시 새로운 UUID 생성
- 이벤트 조회 시 ID 검증
- 이벤트 참조 시 타입 안전성 확보

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### PageId VO (다른 도메인에서 재사용)

- **파일 위치**: `src/domains/workspace-management/shared/value-objects/page-id.vo.ts` (재사용)
- **역할**: 페이지 ID의 유효성을 검증하고 이벤트 격리 단위를 표현
- **사용 방법**: 
  ```typescript
  import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
  ```
- **비즈니스 규칙**: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨

**사용 시나리오**:
- 이벤트 로깅 시 페이지 ID 검증
- Long-Term Memory 검색 시 페이지 범위 제한
- 권한 검증 시 페이지 소유권 확인

**우선순위**: ⭐️⭐️⭐️⭐️⭐️ (재사용, 구현 불필요)  
**Testing Strategy 참조**: workspace-management 도메인에서 이미 테스트됨

---

#### EventType VO

- **파일 위치**: `src/domains/ai-management/shared/value-objects/event-type.vo.ts`
- **역할**: 이벤트 타입의 유효성을 검증하고 타입별 처리 규칙을 제공
- **주요 기능**:
  - 지원되는 이벤트 타 검증 (`user_utterance`, `ai_response`, `tool_call`, `block_created`, `block_updated`, `block_deleted`)
  - 타입별 페이로드 스키마 검증 규칙 제공
  - 자연어 이벤트 여부 판단 (BM25 검색 대상)
  - 정형 이벤트 여부 판단 (메타데이터 필터링 대상)
- **에러 처리**: 지원되지 않는 타입 시 `INVALID_EVENT_TYPE` 에러 발생
- **비즈니스 규칙**: enum으로 정의된 타입만 허용

**사용 시나리오**:
- 이벤트 생성 시 타입 선택 검증입
- Long-Term Memory 검색 시 타입별 전략 선택 (BM25 vs 메타데이터)
- Short-Term Memory 조회 시 타입 필터링

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### UtteranceContent VO

- **파일 위치**: `src/domains/ai-management/shared/value-objects/utterance-content.vo.ts`
- **역할**: 사용자 발화 내용의 유효성을 검증하고 텍스트 정규화를 수행
- **주요 기능**:
  - 발화 내용 길이 검증 (1-10,000자)
  - 공백 정규화 (연속 공백 제거, trim)
  - 다른 UtteranceContent 객체와의 동등성 비교
  - BM25 검색을 위한 텍스트 추출
- **에러 처리**: 빈 발화 또는 길이 초과 시 `INVALID_UTTERANCE` 에러 발생
- **비즈니스 규칙**: 발화는 1자 이상, 10,000자 이하여야 함

**사용 시나리오**:
- 사용자 발화 입력 시 검증
- Long-Term Memory 검색 시 쿼리 텍스트 추출
- 발화 내용 저장 및 조회

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### AIResponse VO

- **파일 위치**: `src/domains/ai-management/shared/value-objects/ai-response.vo.ts`
- **역할**: AI 응답 내용의 유효성을 검증하고 응답 메타데이터를 캡슐화
- **주요 기능**:
  - 응답 내용 길이 검증 (1-50,000자)
  - Agent Loop 횟수 검증 (1-10회)
  - 공백 정규화
  - BM25 검색을 위한 텍스트 추출
  - 응답 완료 여부 판단
- **에러 처리**: 빈 응답 또는 길이 초과 시 `INVALID_AI_RESPONSE` 에러 발생
- **비즈니스 규칙**: 응답은 1자 이상, 50,000자 이하여야 하며, Agent Loop는 최대 10회

**사용 시나리오**:
- AI 응답 생성 시 검증
- Long-Term Memory 검색 시 응답 텍스트 추출
- Agent Loop 횟수 추적

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

#### ToolCallResult VO

- **파일 위치**: `src/domains/ai-management/shared/value-objects/tool-call-result.vo.ts`
- **역할**: 툴 호출 결과의 유효성을 검증하고 실행 메타데이터를 캡슐화
- **주요 기능**:
  - 툴 이름 검증 (허용된 툴 목록: `addBlock`, `deleteBlock`, `updateProperty`, `connectBlocks`, `searchByHop`, `searchByKeyword`, `executeBlockAction`)
  - 파라미터 JSONB 검증
  - 실행 결과 저장 (성공/실패)
  - 실행 시간 추적 (타임아웃 30초)
  - 에러 메시지 캡슐화
- **에러 처리**: 지원되지 않는 툴 또는 타임아웃 시 에러 발생
- **비즈니스 규칙**: 툴 실행은 최대 30초, 결과는 JSONB 형식으로 저장

**사용 시나리오**:
- Agent 툴 호출 시 결과 검증 및 저장
- Long-Term Memory 검색 시 유사 툴 호출 패턴 복원
- 툴 실행 통계 및 성능 분석

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Value Objects 테스트 케이스

---

### 2. Entities 수도코드

#### EventLog Entity

- **파일 위치**: `src/domains/ai-management/shared/entities/event-log.entity.ts`
- **역할**: Event Log 도메인 엔티티로 이벤트의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: EventId Value Object로 고유 식별자 (불변)
  - pageId: PageId Value Object로 페이지 격리 단위 (불변)
  - userId: UserId Value Object로 이벤트 발생 사용자 (불변)
  - eventType: EventType Value Object (불변)
  - payload: JSONB 이벤트 페이로드 (불변)
    - 사용자 발화: `{ utterance: string, selectedBlockIds?: string[], nearbyBlockIds?: string[] }`
    - AI 응답: `{ response: string, relatedUtteranceEventId: string, agentLoopCount: number }`
    - 툴 호출: `{ toolName: string, params: object, result: object, executionTime: number, agentExecutionId: string }`
    - 블럭 변경: `{ changeType: 'created' | 'updated' | 'deleted', blockId: string, changeDetails: object }`
  - searchableText: 전문 검색용 텍스트 (자연어 이벤트만, 불변)
  - timestamp: 이벤트 발생 시간 (불변)
  - createdAt: 로그 생성 시간 (불변)
- **주요 메서드**:
  - create(): EventLog 생성 (타입별 페이로드 검증)
  - extractSearchableText(): 자연어 이벤트에서 검색 텍스트 추출
  - isNaturalLanguageEvent(): 자연어 이벤트 여부 판단 (BM25 검색 대상)
  - isStructuredEvent(): 정형 이벤트 여부 판단 (메타데이터 필터링 대상)
  - toShortTermMemoryFormat(): Short-Term Memory 포맷으로 변환
  - toLongTermMemoryFormat(): Long-Term Memory 포맷으로 변환
- **비즈니스 규칙**: 
  - 이벤트는 생성 후 수정/삭제 불가 (Append-Only, Immutable)
  - 페이로드는 타입별 스키마를 따라야 함
  - 자연어 이벤트는 searchableText 필수
  - timestamp는 createdAt 이전이어야 함 (이벤트 발생 시점 ≤ 로그 생성 시점)

**사용 시나리오**:
- 이벤트 생성 시 타입별 페이로드 검증
- Long-Term Memory 검색 시 자연어/정형 이벤트 구분
- Short-Term/Long-Term Memory 조회 시 포맷 변환

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Entities 테스트 케이스

---

### 3. Aggregates 수도코드

#### EventLogAggregate

- **파일 위치**: `src/domains/ai-management/shared/aggregates/event-log.aggregate.ts`
- **역할**: Event Log 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root (Append-Only Audit Log)
- **주요 기능**:
  - Event Log 생성 시 모든 관련 검증 수행 (Append-Only)
  - 비즈니스 규칙 검증 및 정책 실행
  - 도메인 이벤트 발생 및 관리
  - 페이지 격리 보장
- **주요 메서드**:
  **이벤트 로깅 (Append-Only)**:
  - logUserUtterance(): 사용자 발화 로깅 및 UserUtteranceLogged 이벤트 발행
    - Input: utterance (UtteranceContent), pageId, userId, selectedBlockIds?, nearbyBlockIds?
  - logAIResponse(): AI 응답 로깅 및 AIResponseLogged 이벤트 발행
    - Input: response (AIResponse), pageId, userId, relatedUtteranceEventId, agentLoopCount
  - logToolCall(): 툴 호출 로깅 및 ToolCallLogged 이벤트 발행
    - Input: toolCallResult (ToolCallResult), pageId, userId, agentExecutionId
  - logBlockChange(): 블럭 변경 로깅 및 BlockChangeLogged 이벤트 발행
    - Input: changeType, blockId, pageId, userId, changeDetails
  
  **이벤트 조회 (Read-Only)**:
  - getEventById(): 이벤트 ID로 조회
  - validatePageAccess(): 페이지 접근 권한 검증
  - getUncommittedEvents(): 발행된 이벤트 목록 반환
  - markEventsAsCommitted(): 이벤트 커밋 처리
  
- **비즈니스 로직**:
  - Append-Only: Event Log는 생성 후 수정/삭제 불가
  - 페이지 격리: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨
  - Temporal Ordering: Event는 timestamp 기준으로 정렬 가능해야 함
  - 타입별 페이로드 검증: EventType에 따라 페이로드 스키마 검증
  - 자연어 이벤트 searchableText 생성: 발화, AI 응답은 전문 검색 텍스트 자동 생성

- **불변식(Invariants)**:
  1. **Append-Only**: Event Log는 생성 후 수정/삭제 불가 (Immutable Audit Log)
  2. **Page Isolation**: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨
  3. **Search Boundary**: Long-Term Memory 검색은 페이지 범위로 제한됨 (권한 보호)
  4. **Temporal Ordering**: Event는 timestamp 기준으로 정렬 가능해야 함
  5. **Searchable Content**: 자연어 이벤트(발화, AI 응답)는 전문 검색 가능해야 함
  6. **Event Type Consistency**: payload 구조는 eventType과 일치해야 함

**사용 시나리오**:
- 사용자 발화 시 UserUtteranceLogged 이벤트 발행
- AI 응답 완료 시 AIResponseLogged 이벤트 발행
- Agent 툴 호출 시 ToolCallLogged 이벤트 발행
- Block Domain 이벤트 구독 시 BlockChangeLogged 이벤트 발행
- Long-Term Memory 검색 시 페이지 격리 보장

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Aggregates 테스트 케이스  
**Process Model 매핑**: Scenario 1 - AI Query Processing

---

### 4. Commands & Events 수도코드

#### Commands (5개)

**이벤트 로깅**:
- **LogUserUtteranceCommand**: 사용자 발화 로깅
  - utterance: UtteranceContent (1-10,000자)
  - pageId: PageId
  - userId: UserId
  - selectedBlockIds?: string[] (선택된 블럭 ID 목록, 선택적)
  - nearbyBlockIds?: string[] (주변 블럭 ID 목록, 선택적)

- **LogAIResponseCommand**: AI 응답 로깅
  - response: AIResponse (1-50,000자)
  - pageId: PageId
  - userId: UserId
  - relatedUtteranceEventId: EventId (연관된 발화 이벤트 ID)
  - agentLoopCount: number (1-10회)

- **LogToolCallCommand**: 툴 호출 로깅
  - toolCallResult: ToolCallResult (툴 이름, 파라미터, 결과, 실행 시간)
  - pageId: PageId
  - userId: UserId
  - agentExecutionId: string (Agent 실행 ID)

- **LogBlockChangeCommand**: 블럭 변경 로깅
  - changeType: 'created' | 'updated' | 'deleted'
  - blockId: string
  - pageId: PageId
  - userId: UserId
  - changeDetails: object (변경 상세 정보)

**Long-Term Memory 검색**:
- **SearchLongTermMemoryCommand**: Long-Term Memory 검색
  - queryText: string (검색 쿼리 텍스트)
  - pageId: PageId (페이지 범위 제한)
  - topK: number (반환할 최대 이벤트 개수, 기본값 10)
  - timeWeightFactor?: number (시간 가중치 τ, 기본값 7일)
  - searchStrategy: 'bm25' | 'metadata' | 'hybrid' (검색 전략)
  - eventTypeFilter?: EventType[] (이벤트 타입 필터)

#### Events (4개)

**이벤트 로깅**:
- **UserUtteranceLoggedEvent**: 사용자 발화가 로깅됨
  - eventId: EventId
  - pageId: PageId
  - userId: UserId
  - utterance: string
  - selectedBlockIds?: string[]
  - nearbyBlockIds?: string[]
  - occurredAt: Date

- **AIResponseLoggedEvent**: AI 응답이 로깅됨
  - eventId: EventId
  - pageId: PageId
  - userId: UserId
  - response: string
  - relatedUtteranceEventId: EventId
  - agentLoopCount: number
  - occurredAt: Date

- **ToolCallLoggedEvent**: 툴 호출이 로깅됨
  - eventId: EventId
  - pageId: PageId
  - userId: UserId
  - toolName: string
  - params: object
  - result: object
  - executionTime: number
  - agentExecutionId: string
  - occurredAt: Date

- **BlockChangeLoggedEvent**: 블럭 변경이 로깅됨
  - eventId: EventId
  - pageId: PageId
  - userId: UserId
  - changeType: 'created' | 'updated' | 'deleted'
  - blockId: string
  - changeDetails: object
  - occurredAt: Date

---

### 5. Error Types 수도코드

#### AIManagementError 클래스

- **파일 위치**: `src/domains/ai-management/shared/errors/ai-management.error.ts`
- **역할**: AI Management 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (AIManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### AIManagementErrorCode 타입

- **역할**: AI Management 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - EVENT_NOT_FOUND: 이벤트를 찾을 수 없을 때
  - INVALID_EVENT_TYPE: 지원되지 않는 이벤트 타입일 때
  - INVALID_PAGE_ID: 잘못된 페이지 ID일 때
  - INVALID_UTTERANCE: 잘못된 발화 내용 (빈 값, 길이 초과)
  - INVALID_AI_RESPONSE: 잘못된 AI 응답 (빈 값, 길이 초과)
  - INVALID_TOOL_NAME: 지원되지 않는 툴 이름
  - TOOL_EXECUTION_TIMEOUT: 툴 실행 타임아웃 (30초 초과)
  - PAGE_ACCESS_DENIED: 페이지 접근 권한이 없을 때
  - AGENT_LOOP_EXCEEDED: Agent Loop 최대 횟수 초과 (10회 초과)
  - AGENT_TIMEOUT: Agent 실행 타임아웃 (30초 초과)
  - CONTEXT_ASSEMBLY_FAILED: 컨텍스트 조립 실패
  - LONG_TERM_MEMORY_SEARCH_FAILED: Long-Term Memory 검색 실패
  - LLM_API_ERROR: LLM API 호출 에러
  - UNAUTHORIZED_ACCESS: 권한 부족 시
  - DATABASE_CONNECTION_FAILED: 데이터베이스 연결 실패 시

#### 에러 메시지 매핑

- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

**사용 시나리오**:
- 비즈니스 규칙 위반 시 사용자에게 친화적 메시지
- Agent 실행 실패 시 로그 기록
- 권한 부족 시 적절한 에러 코드 반환

---

## 🔧 Infrastructure Layer

> **가이드 참조**: Phase 2.3 - Service/Repository 수도코드 작성

### 1. Repository 수도코드

#### EventLogRepository

- **파일 위치**: `src/domains/ai-management/infrastructure/repositories/event-log.repository.ts`
- **역할**: EventLog Aggregate의 영속성을 담당하는 Repository 인터페이스 및 Drizzle ORM 구현체
- **주요 메서드**:
  - save(): Aggregate를 데이터베이스에 저장 (생성만, Append-Only)
  - findById(): ID로 EventLog 조회
  - findByPageId(): 페이지별 이벤트 목록 조회
  - findRecentEventsByPage(): 최근 N개 이벤트 조회 (Short-Term Memory)
  - searchByBM25(): BM25 전문 검색 (자연어 이벤트)
    - Input: queryText, pageId, topK, timeWeightFactor
    - Output: 검색된 이벤트 목록 (시간 가중치 적용)
  - searchByMetadata(): 메타데이터 패턴 매칭 (정형 이벤트)
    - Input: metadataFilters, pageId, topK, timeWeightFactor
    - Output: 필터링된 이벤트 목록 (시간 가중치 적용)
  - searchHybrid(): BM25 + 메타데이터 하이브리드 검색
    - Input: queryText, metadataFilters, pageId, topK, timeWeightFactor
    - Output: BM25 결과 + 시간 윈도우 내 관련 툴 호출 패턴
  - countEventsByType(): 타입별 이벤트 개수 조회
- **DB 연동**: Drizzle ORM을 사용한 PostgreSQL 연결
- **RLS 정책**: 페이지 멤버십 기반 데이터 접근 제어
- **특징**:
  - Append-Only 저장 (수정/삭제 메서드 없음)
  - BM25 전문 검색 (PostgreSQL `to_tsvector`, `ts_rank`)
  - JSONB GIN 인덱스 활용 (메타데이터 필터링)
  - 시간 가중치 함수 (`exp(-(NOW() - timestamp) / τ)`)
  - 페이지 ID + timestamp 복합 인덱스

**사용 시나리오**:
- Application Service에서 이벤트 저장
- Memory Search Service에서 Long-Term Memory 검색
- Context Assembly Service에서 Short-Term Memory 조회
- Read Model에서 대화 히스토리 조회

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Repository 통합 테스트 케이스

---

### 2. 외부 도메인 서비스 직접 호출

**설계 원칙**: ACL 레이어 없이 다른 도메인의 서비스 함수를 직접 호출합니다.

**호출 방식**:
- Block Management Domain: `BlockManagementService` 직접 호출
- Canvas Management Domain: `CanvasManagementService` 직접 호출
- 도메인 간 경계는 서비스 인터페이스로 관리

**주요 서비스 호출**:

#### Block Management Domain 서비스 호출

- **파일 위치**: `src/domains/block-management/application/services/block-management.service.ts`
- **주요 메서드**:
  - `createBlock()`: 블럭 생성
  - `deleteBlock()`: 블럭 삭제
  - `updateProperty()`: 블럭 속성 업데이트
  - `executeBlockAction()`: 블럭 액션 실행
- **사용 위치**: ToolExecutionService에서 Agent 툴 호출 시 직접 호출

#### Canvas Management Domain 서비스 호출

- **파일 위치**: `src/domains/canvas-management/application/services/canvas-management.service.ts`
- **주요 메서드**:
  - `getBlocksByIds()`: 선택된 블럭 정보 조회
  - `getBlocksByIds()`: 주변 블럭 정보 조회 (visibleBlockIds로 전달)
  - `getSemanticallySimilarBlocks()`: 의미적으로 유사한 블럭 조회 (Vector Search)
    - Input: pageId, referenceBlockIds, topK
    - Output: 유사 블럭 정보 목록 (시맨틱 유사도순)
    - ⚠️ **MVP에서는 미구현 가능** (향후 확장 가능)
  - `connectBlocks()`: 블럭 연결
  - `searchByHop()`: Hop 검색
  - `searchByKeyword()`: 키워드 검색
- **사용 위치**: ContextAssemblyService에서 Canvas Context 조립 시 직접 호출

**특징**:
- ✅ **단순성**: ACL 레이어 없이 직접 호출로 코드 단순화
- ✅ **타입 안전성**: TypeScript 타입으로 도메인 간 인터페이스 관리
- ✅ **의존성 관리**: 서비스 인터페이스로 도메인 간 결합도 관리

## 🚀 Application Layer

> **가이드 참조**: Phase 2.3, 2.4 - Service 및 Server Actions 수도코드

### 1. Domain Services 수도코드

#### ContextAssemblyService

- **파일 위치**: `src/domains/ai-management/application/services/context-assembly.service.ts`
- **역할**: 3가지 컨텍스트(Short-Term, Long-Term, Canvas)를 병렬로 수집하고 조합하는 Domain Service
- **주요 의존성**:
  - EventLogRepository: Event Log 조회
  - MemorySearchService: Long-Term Memory 검색
  - CanvasManagementService: Canvas Context 조회 (직접 호출, ACL 없음)
- **주요 메서드**:
  - assembleContext(): 전체 컨텍스트 조립
    - Input: pageId, userId, utterance, selectedBlockIds?, visibleBlockIds?
    - Output: AssembledContext (Short-Term + Long-Term + Canvas)
  - assembleShortTermMemory(): Short-Term Memory 조립
    - Input: pageId, limit (기본값 20)
    - Output: 최근 N개 이벤트 (메타데이터 필터링)
  - assembleLongTermMemory(): Long-Term Memory 조립
    - Input: queryText, pageId, topK (기본값 10), timeWeightFactor (기본값 7일)
    - Output: BM25 검색 결과 + 시간 가중치
  - assembleCanvasContext(): Canvas Context 조립
    - Input: pageId, selectedBlockIds?, visibleBlockIds?, referenceBlockIds?
    - Output: 선택/주변/의미적 블럭 정보
    - 로직:
      1. 선택 블럭 조회 (CanvasManagementService.getBlocksByIds(selectedBlockIds))
      2. 주변 블럭 조회 (CanvasManagementService.getBlocksByIds(visibleBlockIds))
      3. 의미적 블럭 조회 (CanvasManagementService.getSemanticallySimilarBlocks(referenceBlockIds, topK=5))
         - referenceBlockIds: 선택 블럭 또는 최근 생성/수정된 블럭
         - 시맨틱 유사도 기반 블럭 검색 (Vector Search)
         - ⚠️ **MVP에서는 미구현 가능** (향후 확장 가능)
  - formatForAgent(): Agent 입력 포맷으로 변환
    - Input: AssembledContext
    - Output: Vercel AI SDK Agent 입력 포맷
- **처리 흐름**:
  1. 3가지 컨텍스트 병렬 수집 (Promise.all)
  2. 블럭 읽기 권한 확인 (권한 없는 블럭 제외)
  3. 삭제된 블럭 필터링 (deleted_at이 있는 블럭 제외)
  4. 최대 컨텍스트 크기 제한 (토큰 제한 고려)
  5. Agent 입력 포맷으로 구성
- **실패 대응**:
  - 부분 컨텍스트로라도 Agent 실행 (선택 블럭만)
  - Long-Term Memory 검색 실패 시 Short-Term Memory만 사용
  - 권한 오류 시 사용자에게 안내
- **성능 최적화**:
  - 병렬 처리로 조립 시간 최소화 (< 2초)
  - Redis 캐싱 (컨텍스트 조립 결과)

**사용 시나리오**:
- 사용자 발화 시 컨텍스트 조립
- Agent 실행 전 필요한 모든 컨텍스트 수집
- 컨텍스트 시각화 (어떤 블럭과 이력이 참조되었는지)

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Domain Services 통합 테스트 케이스

---

#### ToolExecutionService

- **파일 위치**: `src/domains/ai-management/application/services/tool-execution.service.ts`
- **역할**: Agent 툴 호출을 실행하고 결과를 반환하는 Domain Service
- **주요 의존성**:
  - BlockManagementService: 블럭 CRUD 및 블럭 액션 실행 (직접 호출, ACL 없음)
  - CanvasManagementService: 엣지 생성 및 캔버스 검색 (직접 호출, ACL 없음)
  - EventLogRepository: 툴 호출 로그 저장
- **주요 메서드**:
  - executeTool(): 툴 실행 및 결과 반환
    - Input: toolName, params, pageId, userId, agentExecutionId
    - Output: ToolCallResult (성공/실패, 실행 시간)
  - addBlock(): 블럭 생성 툴
  - deleteBlock(): 블럭 삭제 툴
  - updateProperty(): 블럭 속성 업데이트 툴
  - connectBlocks(): 블럭 연결 툴
  - executeBlockAction(): 블럭 액션 실행 툴
  - searchByHop(): Hop 검색 툴
  - searchByKeyword(): 키워드 검색 툴
  - searchBlockActions(): 블럭 액션 검색 툴
  - searchMultimodal(): 멀티모달 검색 툴
  - validateToolParams(): 툴 파라미터 검증
  - logToolCall(): 툴 호출 로그 저장
- **처리 흐름**:
  1. 툴 실행 권한 확인
  2. 툴 파라미터 검증
  3. 블럭 존재 확인 (필요 시)
  4. 외부 도메인 서비스 직접 호출 (BlockManagementService 또는 CanvasManagementService)
  5. 툴 실행 결과 파싱
  6. Event Log에 저장
  7. Agent에게 결과 반환
- **실패 대응**:
  - 명확한 에러 메시지를 Agent에게 반환
  - 재시도 가능한 에러(네트워크 에러 등): 최대 3회 자동 재시도
  - 권한 오류: "이 작업을 수행할 권한이 없습니다" 메시지 반환
  - Agent가 에러 메시지를 보고 다른 액션 선택 가능
- **성능 최적화**:
  - 툴 실행 타임아웃 30초
  - 빠른 응답: 대부분의 툴 실행 < 1초

**사용 시나리오**:
- Agent가 툴 호출 결정 시 실행
- 툴 실행 상태를 실시간 스트리밍
- Undo 지원 (잘못된 툴 실행 되돌리기)

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Domain Services 통합 테스트 케이스

---

#### MemorySearchService

- **파일 위치**: `src/domains/ai-management/application/services/memory-search.service.ts`
- **역할**: Long-Term Memory 검색을 담당하는 Domain Service (BM25 + 메타데이터 필터링)
- **주요 의존성**:
  - EventLogRepository: BM25 검색 및 메타데이터 필터링
- **주요 메서드**:
  - searchLongTermMemory(): Long-Term Memory 검색
    - Input: queryText, pageId, topK, timeWeightFactor, searchStrategy
    - Output: 검색된 이벤트 목록 (시간 가중치 적용)
  - searchByBM25(): BM25 전문 검색 (자연어 이벤트)
    - Input: queryText, pageId, topK, timeWeightFactor
    - Output: 검색된 발화 + AI 응답 (시간 가중치 적용)
  - searchByMetadata(): 메타데이터 패턴 매칭 (정형 이벤트)
    - Input: metadataFilters (toolName, blockType 등), pageId, topK, timeWeightFactor
    - Output: 필터링된 툴 호출 + 블럭 변경 (시간 가중치 적용)
  - searchHybrid(): BM25 + 메타데이터 하이브리드 검색
    - Input: queryText, metadataFilters, pageId, topK, timeWeightFactor
    - Output: BM25 결과 + 시간 윈도우 내 관련 툴 호출 패턴
  - applyTimeWeighting(): 시간 가중치 적용
    - Input: events, timeWeightFactor
    - Output: 시간 가중치가 적용된 이벤트 목록 (`exp(-(NOW() - timestamp) / τ)`)
- **처리 흐름**:
  1. 검색 전략 선택 (BM25 / 메타데이터 / 하이브리드)
  2. 페이지 범위 제한
  3. EventLogRepository 호출
  4. 시간 가중치 적용
  5. 상위 topK개 반환
- **실패 대응**:
  - 검색 실패 시 빈 배열 반환
  - 로그 기록 및 모니터링
- **성능 최적화**:
  - BM25 GIN 인덱스 활용
  - JSONB GIN 인덱스 활용 (메타데이터)
  - 페이지 ID + timestamp 복합 인덱스

**사용 시나리오**:
- Context Assembly Service에서 Long-Term Memory 조립
- 유사한 과거 발화 및 툴 호출 패턴 복원
- 비선형 기억 (시간순이 아닌 유사도순)

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Domain Services 통합 테스트 케이스

---

### 2. Application Service 수도코드

#### AIQueryHandler

- **파일 위치**: `src/domains/ai-management/application/services/ai-query-handler.service.ts`
- **역할**: 사용자 발화 처리 전체 Use Case를 조율하는 Application Service
- **주요 의존성**:
  - EventLogRepository: 이벤트 저장
  - ContextAssemblyService: 컨텍스트 조립
  - ToolExecutionService: 툴 실행
  - MemorySearchService: Long-Term Memory 검색
  - Vercel AI SDK: Agent 실행 및 LLM 추론
- **주요 메서드**:
  - handleUserUtterance(): 사용자 발화 처리
    - Input: utterance, pageId, userId, selectedBlockIds?, nearbyBlockIds?
    - Output: AI 응답 스트림 (Vercel AI SDK streamText)
  - executeAgentLoop(): Agent Loop 실행
    - Input: utterance, context, pageId, userId
    - Output: AI 응답 + 툴 호출 목록
  - validatePageAccess(): 페이지 접근 권한 검증
  - logUserUtterance(): 사용자 발화 로그 저장
  - logAIResponse(): AI 응답 로그 저장
  - logToolCall(): 툴 호출 로그 저장
- **트랜잭션**: 하나의 발화 처리는 하나의 Agent 실행 단위 (세션 개념 없음)
- **특징**:
  - 얇은 Application Layer: 도메인 로직은 Domain Service에 위임
  - Vercel AI SDK 통합: Agent Loop 자동 관리
  - 스트리밍 응답 지원: 실시간 AI 응답 표시
  - 의존성 주입: 테스트 용이성 확보

**처리 흐름**:
1. 발화 검증 및 Event Log 저장
2. 페이지 접근 권한 검증
3. Context Assembly Service 호출 (컨텍스트 조립)
4. Vercel AI Agent 실행 (streamText)
5. Agent Loop:
   - Agent가 툴 호출 결정
   - Tool Execution Service 호출
   - 툴 실행 결과를 Agent에게 전달
   - Agent가 다음 액션 결정 (최대 10회)
6. AI 응답 완료 시 Event Log 저장
7. 스트리밍 응답 반환

**실패 대응**:
- Agent 타임아웃 시: "작업 시간이 초과되었습니다. 다시 시도해주세요." 안내 (이벤트 로그 저장)
- Agent Loop 초과 시: "너무 복잡한 작업입니다. 작업을 나눠서 요청해주세요." 안내 (이벤트 로그 저장)
- LLM API 실패 시: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 안내 (이벤트 로그 저장)
- 툴 실행 실패 시: Agent에게 에러 메시지 전달 (이벤트 로그 저장)

**즐거운 사용자 경험**:
- Agent 실행 상태를 실시간 표시: "생각 중...", "블럭 생성 중...", "검색 중..."
- 툴 호출 목록 시각화: Agent가 어떤 작업을 수행했는지 표시
- 피드백 수집: 👍/👎 버튼으로 Agent 성능 평가
- 작업 기록 확인: Event Log를 통해 과거 작업 이력 조회

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Application Services 통합 테스트 케이스

---

### 3. Server Actions 수도코드

#### submitUtteranceAction

- **파일 위치**: `src/domains/ai-management/actions/ai.actions.ts`
- **역할**: 사용자 발화 제출 및 Agent 실행 기능을 제공하는 Next.js Server Action
- **주요 기능**:
  - Supabase Auth를 통한 사용자 인증 확인
  - 의존성 주입 패턴으로 AIQueryHandler 활용
  - 스트리밍 응답 반환 (Vercel AI SDK)
  - Event Log 저장 (발화, AI 응답, 툴 호출)
- **입력**: SubmitUtteranceRequest
  - utterance: string (1-10,000자)
  - pageId: string (UUID)
  - orgId: string (조직 ID, 권한 검증용)
  - selectedBlockIds?: string[] (선택된 블럭 ID 목록)
  - nearbyBlockIds?: string[] (주변 블럭 ID 목록)
- **출력**: ReadableStream<AIResponseChunk>
  - type: 'text' | 'tool_call' | 'tool_result' | 'error'
  - content: string | object
  - agentExecutionId: string
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → UnauthorizedError
  - 권한 부족 → PageAccessDeniedError
  - 도메인 규칙 위반 → AIManagementError
  - Agent 타임아웃 → AgentTimeoutError
  - LLM API 에러 → LLMAPIError
- **특징**:
  - `'use server'` 지시어 사용
  - Vercel AI SDK streamText 통합
  - 실시간 스트리밍 응답
  - 의존성 주입으로 테스트 용이성 확보

**처리 흐름**:
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. 조직 권한 확인: verifyAccess()로 접근 권한 검증
3. 입력 파라미터 검증: Zod 스키마로 런타임 검증
4. 의존성 주입: Repository, Service 인스턴스 생성
5. AIQueryHandler.handleUserUtterance() 호출
6. 스트리밍 응답 반환 (ReadableStream)
7. 클라이언트가 스트림 소비

**사용 시나리오**:
- AI 채팅 UI에서 발화 제출
- 실시간 AI 응답 표시
- Agent 툴 호출 상태 표시

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: Server Actions 통합 테스트 케이스

---

### 4. Cross-Domain 이벤트 처리

#### Block Management Domain 이벤트 처리

- **파일 위치**: `src/domains/ai-management/application/event-handlers/block-events.handler.ts`
- **역할**: Block Management Domain에서 발생한 블럭 변경 이벤트를 구독하고 Event Log에 저장
- **주요 핸들러**:
  - onBlockCreated: 블럭 생성 시 BlockChangeLogged 이벤트 발행
    - Input: BlockCreatedEvent
    - Output: BlockChangeLoggedEvent (changeType: 'created')
  - onBlockUpdated: 블럭 업데이트 시 BlockChangeLogged 이벤트 발행
    - Input: BlockUpdatedEvent
    - Output: BlockChangeLoggedEvent (changeType: 'updated')
  - onBlockDeleted: 블럭 삭제 시 BlockChangeLogged 이벤트 발행
    - Input: BlockDeletedEvent
    - Output: BlockChangeLoggedEvent (changeType: 'deleted')
- **이벤트 처리 패턴**:
  - 비동기 처리: 이벤트 수신 즉시 반환 (큐 사용)
  - 재시도 로직: 실패 시 3회 재시도
  - 멱등성 보장: 동일 이벤트 중복 처리 방지
- **특징**:
  - 도메인 간 느슨한 결합
  - 이벤트 기반 비동기 통신
  - Eventually Consistent 보장

**처리 흐름**:
1. 이벤트 수신: EventBus로부터 블럭 변경 이벤트 전달
2. 이벤트 검증: 필수 데이터 확인 (blockId, pageId, changeType)
3. EventLogAggregate.logBlockChange() 호출
4. Event Log 저장
5. 결과 처리: 성공/실패 로그 기록
6. 실패 시 재시도: Dead Letter Queue로 이동

**사용 시나리오**:
- Agent 툴 호출로 블럭 생성 시 자동 로깅
- 수동 블럭 편집 시 자동 로깅
- Long-Term Memory 검색 시 블럭 변경 이력 복원

---

## 🎨 UI & Hook 전략

> **가이드 참조**: Phase 3.1 - 문서 구조 (섹션 5)

### React Hooks 사용

**사용할 Hook**:
- `useOptimistic`: 발화 제출 시 낙관적 업데이트 (대화 목록에 즉시 추가)
- `useTransition`: Agent 실행 시 비동기 상태 관리
- `useFormStatus`: 발화 입력 폼 제출 상태
- `useCallback`: 툴 호출 최적화
- `useStreamText`: Vercel AI SDK 스트리밍 응답 처리

**낙관적 업데이트 로직**:
```typescript
function useAIConversation(pageId: string) {
  const [optimisticConversations, addOptimisticConversation] = useOptimistic(
    conversations,
    (state, newConversation) => [...state, newConversation]
  );
  
  // 롤백 로직: 실패 시 optimistic 항목 제거
  const submitUtterance = async (utterance: string) => {
    const tempConversation = {
      utteranceEventId: crypto.randomUUID(),
      userUtterance: utterance,
      aiResponse: '생각 중...',
      timestamp: new Date().toISOString(),
    };
    
    addOptimisticConversation(tempConversation);
    
    try {
      const stream = await submitUtteranceAction({ utterance, pageId, orgId });
      // 스트림 소비 및 실시간 업데이트
    } catch (error) {
      // 롤백: optimistic 항목 제거
    }
  };
}
```

### UI Component 연동

**Server Action 연결**:
- 발화 입력 폼 → submitUtteranceAction → 스트리밍 응답 처리
- 대화 히스토리 → getConversationHistoryAction → 목록 표시
- 로딩/에러 상태 표시
- 접근성 고려 (aria-label, role 등)

**스트리밍 응답 처리**:
```typescript
const { messages, append, isLoading } = useChat({
  api: '/api/ai/chat', // submitUtteranceAction 호출
  onResponse: (response) => {
    // Agent 실행 상태 표시
  },
  onToolCall: ({ toolName, params }) => {
    // 툴 호출 상태 표시
  },
  onFinish: (message) => {
    // AI 응답 완료
  },
  onError: (error) => {
    // 에러 처리
  },
});
```

---

## 📋 TDD 구현 순서

> **가이드 참조**: Phase 3.2 - TDD 구현 순서 정의

### Phase별 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. EventId VO
   - 테스트 작성 (RED)
   - 최소 구현 (GREEN)
   - 리팩토링 (REFACTOR)
2. PageId VO
3. EventType VO
4. UtteranceContent VO
5. AIResponse VO
6. ToolCallResult VO
7. EventPayload VO (타입별)

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. EventLog Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. EventLogAggregate (Append-Only)

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. EventLogRepository (통합 테스트)
   - BM25 전문 검색 테스트
   - JSONB 메타데이터 필터링 테스트
   - 시간 가중치 테스트

### Phase 5: Domain Services (⭐️⭐️⭐️⭐️)
1. MemorySearchService (통합 테스트)
2. ContextAssemblyService (통합 테스트)
3. ToolExecutionService (통합 테스트)

### Phase 6: Application Services (⭐️⭐️⭐️⭐️⭐️)
1. AIQueryHandler (통합 테스트)
   - Vercel AI SDK 통합 테스트
   - Agent Loop 테스트

### Phase 7: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. submitUtteranceAction (통합 테스트)
2. getConversationHistoryAction (통합 테스트)

### Phase 8: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 사용자 발화 처리 시나리오
2. Agent 툴 호출 시나리오
3. Long-Term Memory 검색 시나리오
```

### TDD 사이클 적용 방법

```bash
# 1. RED: 테스트 먼저 작성
$ touch src/domains/ai-management/shared/value-objects/__tests__/event-id.test.ts
# 테스트 코드 작성
$ pnpm test event-id.test.ts
# 결과: FAIL

# 2. GREEN: 최소 구현
$ touch src/domains/ai-management/shared/value-objects/event-id.vo.ts
# 최소 구현 코드 작성
$ pnpm test event-id.test.ts
# 결과: PASS

# 3. REFACTOR: 코드 개선
# 검증 로직 추가, 코드 정리
$ pnpm test event-id.test.ts
# 결과: PASS (리팩토링 후에도 통과)
```

### 커버리지 목표 달성 전략

```markdown
Testing Strategy 목표 참조:
- Value Objects: 95% 이상 → RED-GREEN-REFACTOR 철저히 적용
- Entities: 95% 이상 → 모든 public 메서드 테스트
- Aggregates: 90% 이상 → 비즈니스 로직 중심 테스트
- Domain Services: 85% 이상 → 통합 테스트로 플로우 검증
- Application Services: 85% 이상 → Vercel AI SDK Mocking 테스트
- Repositories: 80% 이상 → DB 연동 테스트 (BM25, JSONB)
- Server Actions: 85% 이상 → 인증, 에러 처리 포함
```

---

## ✅ 검증 체크리스트

### 구현 수도코드 검증
- [ ] Software Design의 모든 Aggregate가 수도코드로 작성되었는가? (EventLogAggregate)
- [ ] Process Model의 모든 시나리오가 구현 수도코드로 반영되었는가? (AI Query Processing)
- [ ] 모든 컴포넌트에 구현 수도코드가 있는가?
- [ ] Block/Canvas Management Domain과의 연동 구조가 명시되었는가?

### 테스트 수도코드 검증
- [ ] Given-When-Then 패턴이 일관되게 적용되었는가?
- [ ] Happy Path와 Edge Case가 모두 포함되었는가?
- [ ] 불변식 검증이 테스트에 포함되었는가?

### TDD 준비 검증
- [ ] TDD 구현 순서가 명확한가?
- [ ] 커버리지 목표가 명시되었는가?
- [ ] 각 Phase별 우선순위가 표시되었는가?
- [ ] Vercel AI SDK 통합 테스트 전략이 포함되었는가?

### Software Design 완전 반영 검증
- [ ] 5개 Commands가 모두 구현 수도코드로 작성되었는가? (LogUserUtterance, LogAIResponse, LogToolCall, LogBlockChange, SearchLongTermMemory)
- [ ] 4개 Events가 모두 구현 수도코드로 작성되었는가? (UserUtteranceLogged, AIResponseLogged, ToolCallLogged, BlockChangeLogged)
- [ ] 핵심 Invariants가 구현 수도코드로 반영되었는가? (Append-Only, Page Isolation, Search Boundary)
- [ ] BM25 + 메타데이터 필터링 전략이 반영되었는가?
- [ ] Vercel AI SDK 통합이 반영되었는가?

### 외부 시스템 통합 검증
- [ ] Vercel AI SDK 통합이 명시되었는가?
- [ ] Block Management Domain 서비스 직접 호출이 명시되었는가? (ACL 없음)
- [ ] Canvas Management Domain 서비스 직접 호출이 명시되었는가? (ACL 없음)
- [ ] PostgreSQL BM25 + JSONB 인덱스 전략이 명시되었는가?

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - Vercel AI SDK 통합 테스트
  - Block/Canvas Management Domain 연동 테스트
  - 코드 리뷰 및 PR

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] Software Design과 일관성 확인
- [ ] 외부 도메인 연동 검증
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Technical Specification을 따라 **Vercel AI Agent 기반 AI Management Domain**을 구현할 수 있습니다! 🚀

