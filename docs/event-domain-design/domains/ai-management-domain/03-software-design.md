# Software Design: AI Management Domain

## 🎯 개요

**도메인**: AI Management  
**작성자**: 시니어개발자 + AI 기능 설계 팀  
**작성일**: 2025-11-12  
**버전**: v2.0 (Simplified - Vercel AI Agent)

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-testing-strategy.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, AI Management Domain의 Bounded Context를 정의합니다.

### 핵심 설계 철학

**Vercel AI Agent 기반 단순화**:
- 액션칩 제거 → Agent가 직접 툴 호출
- 컨텍스트 단순화 → Short-Term + Long-Term + Canvas
- 툴 중심 아키텍처 → 모든 작업은 툴로 표준화
- 이벤트 로그 통합 → 대화, 툴 실행, 블럭 변경 모두 이벤트로 저장

### 🟪 External System 처리

#### LLM Provider (Vercel AI SDK)
- **역할**: AI Agent의 추론 엔진, 툴 호출 결정
- **SSOT**: LLM Provider가 AI 모델 및 추론 결과의 Single Source of Truth
- **통합**: Vercel AI SDK를 통한 실시간 Agent 실행
- **ACL 필요성**: ❌ (Vercel AI SDK가 이미 추상화 레이어 제공)

#### Vector Database (pgvector)
- **역할**: 임베딩 저장 및 시맨틱 검색
- **SSOT**: Vector DB가 임베딩 벡터의 Single Source of Truth
- **통합**: PostgreSQL Extension (pgvector)을 통한 SQL 쿼리
- **ACL 필요성**: ❌ (PostgreSQL 자체 기능이므로 별도 ACL 불필요)

#### Block Management Domain (External Domain)
- **역할**: 블럭 CRUD, 블럭 액션 실행
- **통합**: Agent 툴 호출을 통한 동기적 호출
- **ACL 필요성**: ✅ (도메인 간 경계 보호 필요)

#### Canvas Management Domain (External Domain)
- **역할**: 캔버스 상태, 엣지 정보, 선택/주변 블럭 정보
- **통합**: 컨텍스트 조립 시 동기적 호출
- **ACL 필요성**: ✅ (도메인 간 경계 보호 필요)

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| AI Query Handler | **Application Service** | 사용자 발화 처리 및 Agent 실행 오케스트레이션 |
| Context Manager | **Context Assembly Service** | 컨텍스트 조립 (Domain Service) |
| Vercel AI Agent | **External System** | LLM 추론 및 툴 호출 (Vercel AI SDK) |
| Tool Executor | **Tool Execution Service** | 툴 실행 및 결과 반환 (Domain Service) |
| Memory Service | **Event Log Aggregate** | 이벤트 로그 저장 및 임베딩 관리 (Audit Log) |
| Embedding Generator | **Embedding Service** | 임베딩 생성 (Domain Service) |

### Aggregate vs Service 구분 기준

**Aggregate** (상태 + 불변식):
- **Event Log**: 페이지 내 모든 이벤트(발화, AI 응답, 툴 호출, 블럭 변경) 저장 및 임베딩 관리
  - Append-Only Audit Log 패턴
  - 시맨틱 검색 기능 제공
  - 세션 개념 없음 (모든 이벤트 평등하게 저장)

**Domain Service** (상태 없는 조율):
- Context Assembly: 여러 소스에서 컨텍스트 수집 및 조합
- Tool Execution: Agent 툴 호출 실행 및 외부 도메인 연동
- Embedding Service: 텍스트 → 임베딩 변환

**Application Service** (Use Case 조율):
- AI Query Handler: 발화 입력 → 컨텍스트 조립 → Agent 실행 → 이벤트 로깅의 전체 흐름 조율

---

## 📦 Aggregate 상세 정의

### 1. Event Log Aggregate

**핵심 개념**: "페이지 내에서 발생하는 모든 이벤트(사용자 발화, AI 응답, 툴 호출, 블럭 변경)를 Append-Only 방식으로 저장하는 Audit Log입니다. 이벤트는 시맨틱 임베딩과 함께 저장되어 Long-Term Memory 복원의 기반이 됩니다."

#### Root Entity
- **Event Log** (식별자: EventId)
- 각 이벤트는 독립적이며, 세션 개념 없음
- 모든 이벤트는 페이지 범위로 격리됨

#### Commands (받는 명령)
- **LogUserUtterance**: 사용자 발화 로깅
  - Input: utterance, pageId, userId, selectedBlockIds?, nearbyBlockIds?
- **LogAIResponse**: AI 응답 로깅
  - Input: response, pageId, userId, relatedUtteranceEventId
- **LogToolCall**: 툴 호출 로깅
  - Input: toolName, params, result, pageId, userId, agentExecutionId
- **LogBlockChange**: 블럭 변경 로깅 (Block Domain에서 이벤트 구독)
  - Input: changeType (created/updated/deleted), blockId, pageId, userId, changeDetails
- **SearchLongTermMemory**: Long-Term Memory 검색
  - Input: queryText, pageId, topK, timeWeightFactor (τ), searchStrategy (BM25/metadata/hybrid)

#### Events (발생 이벤트)
- **UserUtteranceLogged**: 사용자 발화가 로깅됨
- **AIResponseLogged**: AI 응답이 로깅됨
- **ToolCallLogged**: 툴 호출이 로깅됨
- **BlockChangeLogged**: 블럭 변경이 로깅됨

#### 핵심 불변식 (Invariants)
1. **Append-Only**: Event Log는 생성 후 수정/삭제 불가 (Immutable Audit Log)
2. **Page Isolation**: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨
3. **Search Boundary**: Long-Term Memory 검색은 페이지 범위로 제한됨 (권한 보호)
4. **Temporal Ordering**: Event는 timestamp 기준으로 정렬 가능해야 함
5. **Searchable Content**: 자연어 이벤트(발화, AI 응답)는 전문 검색 가능해야 함

#### 속성 (Properties)
- **식별자**: eventId (이벤트 고유 식별자), pageId (페이지 ID, 격리 단위), userId (이벤트 발생 사용자)
- **이벤트 타입**: user_utterance, ai_response, tool_call, block_created, block_updated, block_deleted
- **페이로드**: 이벤트 타입별 상세 데이터
  - 사용자 발화: 발화 내용, 선택된 블럭 ID 목록, 주변 블럭 ID 목록
  - AI 응답: 응답 내용, 연관된 발화 이벤트 ID, Agent 루프 횟수
  - 툴 호출: 툴 이름, 파라미터, 실행 결과, 실행 시간, Agent 실행 ID
  - 블럭 변경: 변경 타입, 블럭 ID, 변경 상세 정보
- **검색용 텍스트**: 자연어 이벤트(발화, AI 응답)의 경우 전문 검색을 위한 텍스트 필드
- **시간 정보**: timestamp (이벤트 발생 시간), createdAt (로그 생성 시간)

#### Read Models (쿼리 최적화)
- **Short-Term Memory**: 최근 N개 이벤트를 시간순으로 조회 (메타데이터 필터링)
- **Long-Term Memory**: BM25 전문 검색 또는 메타데이터 패턴 매칭으로 유사 이벤트 조회 후 시간 가중치 적용

---

## 🔲 Bounded Context 정의

### AI Management Context

**언어적 특징**:
- "Utterance" = 사용자가 AI에게 입력한 자연어 요청
- "Context" = Agent에게 전달되는 메모리 + 캔버스 정보
- "Tool Call" = Agent가 실행한 캔버스 조작/검색 함수
- "Event Log" = Audit Log 방식의 통합 이벤트 저장소 (발화, AI 응답, 툴 실행, 블럭 변경)
- "Short-Term Memory" = 최근 N개 이벤트 (시간순, 메타데이터 필터링)
- "Long-Term Memory" = 전문 검색(BM25) 또는 메타데이터 패턴 매칭으로 복원한 과거 이벤트 + 시간 가중치
- "Agent Execution" = 하나의 발화에 대한 Agent Loop 실행 단위 (세션 개념 없음)

**핵심 책임**:
1. **사용자 발화 처리**: 발화 수신 및 이벤트 로깅
2. **컨텍스트 자동 조립**: Short-Term, Long-Term, Canvas Context 수집 및 조합
3. **Vercel AI Agent 실행 오케스트레이션**: Agent Loop 실행 관리
4. **툴 호출 실행**: Agent 툴 호출 실행 및 외부 도메인 연동
5. **이벤트 로깅**: 모든 이벤트 Append-Only 저장 (Audit Log)
6. **Long-Term Memory 검색**: BM25 전문 검색 및 메타데이터 패턴 매칭으로 과거 이벤트 복원

**포함된 Aggregates**:
- **Event Log** (이벤트 로그 저장 및 검색, Audit Log)

**포함된 Domain Services**:
- **Context Assembly Service** (컨텍스트 조립)
- **Tool Execution Service** (툴 실행)
- **Memory Search Service** (Long-Term Memory 검색: BM25 + 메타데이터 필터링)

**Application Services**:
- **AI Query Handler** (발화 처리 전체 Use Case 조율)

**External System Integration**:
- **Vercel AI SDK (LLM Provider)**: Agent 실행 및 LLM 추론
  - Agent Loop 실행
  - 툴 호출 결정
  - 자연어 이해
- **PostgreSQL (Event Log Storage)**: 이벤트 로그 저장 및 검색
  - BM25 전문 검색 (자연어 이벤트)
  - JSONB 메타데이터 필터링 (정형 이벤트)
  - 시간 범위 쿼리
- **Block Management Domain**: 블럭 CRUD 및 블럭 액션 실행
  - Agent 툴 호출 (addBlock, deleteBlock, updateProperty, executeBlockAction)
  - 블럭 변경 이벤트 구독 (이벤트 로그 저장)
- **Canvas Management Domain**: 캔버스 상태 및 엣지 정보
  - 컨텍스트 조립 시 선택/주변 블럭 정보 조회
  - Agent 툴 호출 (connectBlocks, searchByHop, searchByKeyword)

---

## 🔀 다른 Context와의 경계

### Block Management Domain과의 경계

**언어적 차이**:
| AI Management Context | Block Management Domain |
|---------------------|-------------------|
| "Tool Call (addBlock)" | "Create Block Command" |
| "Tool Call (updateProperty)" | "Update Property Command" |
| "Tool Call (executeBlockAction)" | "Execute Block Action Command" |
| "Event Log (Block Change)" | "Block Domain Event" |

**통합 이벤트**:
- `ToolCallLogged` (AI Management) → `CreateBlock`, `UpdateProperty`, `DeleteBlock` (Block Management)
- `BlockCreated`, `BlockUpdated`, `BlockDeleted` (Block Management) → `BlockChangeLogged` (AI Management)

**통합 패턴**: Customer-Supplier + ACL
- AI Management (Downstream) ← Block Management (Upstream)
- AI Management가 Block Management Service를 ACL로 감싸서 호출
- Block Management의 블럭 변경 이벤트를 AI Management가 구독

### Canvas Management Domain과의 경계

**언어적 차이**:
| AI Management Context | Canvas Management Domain |
|---------------------|-------------------|
| "Canvas Context (Selected Blocks)" | "Selected Node IDs" |
| "Canvas Context (Nearby Blocks)" | "Proximity Nodes" |
| "Tool Call (connectBlocks)" | "Create Edge Command" |

**통합 이벤트**:
- `ContextAssemblyStarted` (AI Management) → Canvas 상태 조회 (Canvas Management)
- `ToolCallLogged` (AI Management) → `CreateEdge`, `SearchByHop` (Canvas Management)

**통합 패턴**: Customer-Supplier
- AI Management (Downstream) ← Canvas Management (Upstream)
- AI Management가 Canvas Management Service를 직접 호출

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI Management Context                         │
│                                                                 │
│         ┌─────────────────────────────────────┐                │
│         │   AI Query Handler                  │                │
│         │   (Application Service)             │                │
│         └──────────────┬──────────────────────┘                │
│                        │                                       │
│         ┌──────────────┼──────────────┐                        │
│         │              │              │                        │
│         ▼              ▼              ▼                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │Context      │ │Tool         │ │Embedding    │              │
│  │Assembly     │ │Execution    │ │Service      │              │
│  │Service      │ │Service      │ │             │              │
│  └─────────────┘ └─────────────┘ └──────┬──────┘              │
│         │              │                 │                     │
│         └──────────────┼─────────────────┘                     │
│                        │                                       │
│                        ▼                                       │
│                ┌───────────────┐                               │
│                │  Event Log    │                               │
│                │  Aggregate    │                               │
│                └───────────────┘                               │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Integration Events
                             ▼
     ┌──────────────────────────────────────────────────┐
     │            Integration Events                     │
     ├──────────────────────────────────────────────────┤
     │ • UserUtteranceLogged                            │
     │ • ToolCallLogged                                 │
     │ • BlockChangeLogged                              │
     │ • AIResponseLogged                               │
     └──────────────────────────────────────────────────┘
                    │                  │
        ┌───────────┘                  └───────────┐
        ▼                                          ▼
┌─────────────────────┐                  ┌──────────────────────┐
│ Block Management    │                  │ Canvas Management    │
│ Domain              │                  │ Domain               │
│ (Upstream)          │                  │ (Upstream)           │
└─────────────────────┘                  └──────────────────────┘
                    │
                    │ ACL
                    ▼
            ┌──────────────────┐
            │ LLM Provider     │
            │ (Vercel AI SDK)  │
            │ (External System)│
            └──────────────────┘
                    │
                    │
                    ▼
            ┌──────────────────┐
            │ PostgreSQL       │
            │ (Event Log DB)   │
            │ (External System)│
            └──────────────────┘
```

### Context Relationships

**AI Management Context (Core Domain)**
- Customer-Supplier + ACL → Block Management Domain (Upstream)
- Customer-Supplier → Canvas Management Domain (Upstream)
- External System Integration → Vercel AI SDK (LLM Provider)
- External System Integration → PostgreSQL (Event Log Storage & Search)

---

## 💡 핵심 설계 결정

### 1. Vercel AI SDK 채택

**문제**: Agent Loop를 직접 구현할 경우 복잡도 증가 및 유지보수 어려움

**해결**: Vercel AI SDK 사용
- Agent Loop 자동 관리
- 툴 호출 인터페이스 표준화
- LLM Provider 추상화 (OpenAI, Anthropic 등 쉽게 전환)

**대안**:
- 자체 Agent Loop 구현 (복잡도 높음)
- LangChain 사용 (무거운 프레임워크)

**결정 이유**: 
- 단순성: Vercel AI SDK가 Agent Loop를 자동 관리
- 표준화: 툴 인터페이스가 명확히 정의됨
- 유연성: LLM Provider 쉽게 교체 가능
- 성능: 스트리밍 응답 지원

---

### 2. 액션칩 제거 및 Agent 자율 실행

**문제**: 액션칩 패턴은 사용자 중간 개입이 필요하여 UX 복잡도 증가

**해결**: Agent가 직접 툴을 호출하여 작업 수행
- 사용자는 발화만 입력
- Agent가 스스로 툴 호출 결정
- 중간 클릭 불필요

**대안**:
- Two-Line Response + 액션칩 (이전 설계)
- Command Chain 수동 실행

**결정 이유**:
- 단순성: 사용자는 발화만 입력
- 자율성: Agent가 스스로 작업 수행
- 효율성: 중간 클릭 단계 제거

---

### 3. 컨텍스트 구성 단순화

**문제**: 복잡한 Context Area System (BlockType, SemanticSim, Recency, Proximity, Attention)은 구현 및 튜닝 복잡도 높음

**해결**: 3가지로 단순화
- Short-Term Memory: 최근 N개 이벤트
- Long-Term Memory: 시맨틱 검색 + 시간 가중치
- Canvas Context: 선택/주변/의미적 블럭

**대안**:
- 5개 Context Area 시스템 (이전 설계)
- 단순 최근 N개만 (시맨틱 검색 없음)

**결정 이유**:
- 단순성: 구현 및 튜닝 복잡도 감소
- 실용성: 핵심 컨텍스트만 수집
- 성능: 컨텍스트 조립 시간 단축

---

### 4. 세션 없는 Audit Log 패턴

**문제**: 세션 기반 관리는 세션 시작/종료 개념이 필요하고, 이벤트 간 경계가 모호함

**해결**: 세션 개념 제거, Append-Only Audit Log 패턴 채택
- 모든 이벤트는 독립적으로 저장 (발화, AI 응답, 툴 호출, 블럭 변경)
- 세션 상태 관리 불필요
- 이벤트는 타임스탬프와 페이지 ID로만 격리
- Short-Term Memory: 최근 N개 이벤트로 조회
- Long-Term Memory: 시맨틱 검색으로 조회

**대안**:
- 세션 기반 대화 관리 (이전 설계)
- Request-Response 쌍 저장

**결정 이유**:
- 단순성: 세션 시작/종료 관리 불필요
- 유연성: 모든 이벤트가 평등하게 저장됨
- 감사성: Audit Log로 활용 가능

---

### 5. 통합 이벤트 로그 (발화 + AI 응답 + 툴 실행 + 블럭 변경)

**문제**: 이벤트를 분리 저장하면 시맨틱 검색 시 통합 어려움

**해결**: 모든 이벤트를 통합 저장
- 사용자 발화 이벤트
- AI 응답 이벤트
- 툴 호출 이벤트
- 블럭 변경 이벤트
- 모두 동일한 Event Log 테이블에 저장
- 모두 임베딩 생성 및 시맨틱 검색 대상

**대안**:
- 이벤트 타입별 테이블 분리 (발화, 툴 호출, 블럭 변경)
- 대화 전용 메모리 (블럭 변경 제외)

**결정 이유**:
- 통합성: 모든 이벤트를 통합 검색 가능
- 시맨틱 검색: 과거 작업 패턴 복원
- 비선형 기억: 시간순이 아닌 유사도순 검색

---

### 6. Long-Term Memory 검색 전략: BM25 + 메타데이터 필터링

**문제**: 이벤트 로그의 대부분이 정형 데이터(툴 호출, 블럭 변경)이며, 자연어 텍스트는 일부(발화, AI 응답)에 불과함. 임베딩 기반 검색은 비용 대비 효과가 낮을 수 있음.

**해결**: BM25 전문 검색 + 메타데이터 패턴 매칭 전략 채택
- **자연어 이벤트(발화, AI 응답)**: BM25 전문 검색으로 키워드 기반 검색
- **정형 이벤트(툴 호출, 블럭 변경)**: 메타데이터 필터링으로 패턴 매칭 (toolName, blockType 등)
- **하이브리드 검색**: 유사 발화 주변의 툴 호출 패턴을 시간 윈도우로 복원
- **시간 가중치**: 검색 결과에 시간 가중치(exp(-t/τ)) 적용

**대안**:
- 임베딩 기반 시맨틱 검색 (모든 이벤트에 임베딩 생성)
- 키워드 매칭만 사용 (BM25 없음)
- 세션 단위 메모리 (검색 없음)

**결정 이유**:
- **비용 효율성**: PostgreSQL 내장 기능으로 추가 비용 없음
- **실용성**: 80% 이상의 이벤트가 정형 데이터로 메타데이터 필터링이 더 효과적
- **확장성**: 필요시 선택적으로 임베딩 추가 가능 (하이브리드 전략)
- **성능**: BM25는 키워드 기반 검색에 충분히 강력하며, 한국어 전문 검색도 지원

---

### 7. Agent Loop 최대 횟수 제한 (10회)

**문제**: Agent가 무한 루프에 빠질 위험

**해결**: 최대 루프 횟수 제한
- 최대 10회 루프
- 타임아웃 30초
- 초과 시 강제 종료

**대안**:
- 무제한 루프 (위험)
- 사용자가 매번 승인 (UX 나쁨)

**결정 이유**:
- 안전성: 무한 루프 방지
- 비용 절감: LLM 호출 횟수 제한
- 사용자 보호: 장시간 대기 방지

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다.

### Context Assembly Service (컨텍스트 조립 서비스)

**업무 시나리오 연결**:
- 사용자 발화가 들어오면, 3가지 컨텍스트(Short-Term, Long-Term, Canvas)를 **병렬로 수집**합니다.
- Short-Term Memory는 최근 20개 이벤트를 시간순으로 조회합니다 (메타데이터 필터링).
- Long-Term Memory는 Memory Search Service를 통해 BM25 전문 검색 또는 메타데이터 패턴 매칭으로 유사 이벤트를 조회하고, 시간 가중치(exp(-t/τ))를 적용합니다.
- Canvas Context는 프론트엔드에서 전달받은 선택/주변 블럭에 의미적 블럭(시맨틱 유사도)을 추가합니다.
- 수집된 컨텍스트를 Agent 입력 포맷으로 구성하여 반환합니다.

**규칙 준수 확인**:
- 블럭 읽기 권한 확인: 권한 없는 블럭은 컨텍스트에서 제외
- 삭제된 블럭 제외: deleted_at이 있는 블럭은 필터링
- 최대 컨텍스트 크기: 토큰 제한 고려하여 상위 N개만 선택

**외부 파트너 연동**:
- Canvas Management Domain: 선택/주변 블럭 정보 조회
- Memory Search Service: Long-Term Memory 검색 (BM25 + 메타데이터)
- Block Management Domain: 블럭 읽기 권한 검증

**실패 대응 전략**:
- 컨텍스트 조립 실패 시: 부분 컨텍스트로라도 Agent 실행 (선택 블럭만)
- Long-Term Memory 검색 실패 시: Short-Term Memory만으로 진행
- 권한 오류 시: 사용자에게 "접근 권한이 없는 블럭은 제외되었습니다" 안내

**즐거운 사용자 경험**:
- 병렬 처리로 컨텍스트 조립 시간 최소화 (< 2초)
- 선택 블럭은 즉시 포함 (프론트엔드에서 전달)
- 컨텍스트 시각화: 어떤 블럭과 이력이 참조되었는지 표시

---

### Tool Execution Service (툴 실행 서비스)

**업무 시나리오 연결**:
- Agent가 툴 호출을 결정하면, 해당 툴을 실행하고 결과를 반환합니다.
- 캔버스 조작 툴(addBlock, deleteBlock, updateProperty, connectBlocks, executeBlockAction)은 Block/Canvas Management Domain을 호출합니다.
- 캔버스 검색 툴(searchByHop, searchByKeyword, searchBlockActions, searchMultimodal)은 Canvas Management Domain을 호출합니다.
- 툴 실행 결과를 Agent에게 명확한 포맷으로 반환합니다.
- 모든 툴 호출을 이벤트 로그에 저장합니다.

**규칙 준수 확인**:
- 툴 실행 권한 확인: 사용자가 해당 툴을 실행할 권한이 있는지 검증
- 파라미터 검증: 툴 파라미터가 유효한지 확인
- 블럭 존재 확인: 대상 블럭이 존재하는지 확인

**외부 파트너 연동**:
- Block Management Domain: 블럭 CRUD 및 블럭 액션 실행
- Canvas Management Domain: 엣지 생성 및 캔버스 검색

**실패 대응 전략**:
- 툴 실행 실패 시: 명확한 에러 메시지를 Agent에게 반환
- 재시도 가능한 에러(네트워크 에러 등): 최대 3회 자동 재시도
- 권한 오류: "이 작업을 수행할 권한이 없습니다" 메시지 반환
- Agent가 에러 메시지를 보고 다른 액션 선택 가능

**즐거운 사용자 경험**:
- 툴 실행 상태를 실시간 스트리밍: "블럭 생성 중...", "검색 중..."
- 빠른 응답: 대부분의 툴 실행 < 1초
- Undo 지원: 잘못된 툴 실행은 즉시 되돌리기

---

### AI Query Handler (Application Service)

**업무 시나리오 연결**:
- 사용자 발화가 제출되면, 전체 Use Case를 조율합니다.
- 발화를 Event Log에 저장합니다.
- Context Assembly Service를 호출하여 컨텍스트를 조립합니다.
- 조립된 컨텍스트와 발화를 Vercel AI Agent에게 전달하여 Agent Loop를 시작합니다.
- Agent가 툴을 호출하면, Tool Execution Service를 통해 툴을 실행하고 Event Log에 저장합니다.
- Agent가 응답을 완료하면, AI 응답을 Event Log에 저장합니다.

**규칙 준수 확인**:
- Agent Loop 최대 횟수: 10회 초과 시 강제 종료
- 타임아웃: 30초 초과 시 강제 종료
- 권한 검증: 모든 툴 실행 시 권한 확인
- 페이지 격리: 모든 이벤트는 페이지 범위로 격리

**외부 파트너 연동**:
- Vercel AI SDK (LLM Provider): Agent 실행 및 LLM 추론
- Context Assembly Service: 컨텍스트 조립
- Tool Execution Service: 툴 실행
- Event Log Aggregate: 이벤트 저장
- Memory Search Service: Long-Term Memory 검색

**실패 대응 전략**:
- Agent 타임아웃 시: "작업 시간이 초과되었습니다. 다시 시도해주세요." 안내 (이벤트 로그 저장)
- Agent Loop 초과 시: "너무 복잡한 작업입니다. 작업을 나눠서 요청해주세요." 안내 (이벤트 로그 저장)
- LLM API 실패 시: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 안내 (이벤트 로그 저장)
- 툴 실행 실패 시: Agent에게 에러 메시지 전달 (이벤트 로그 저장)

**즐거운 사용자 경험**:
- Agent 실행 상태를 실시간 표시: "생각 중...", "블럭 생성 중...", "검색 중..."
- 툴 호출 목록 시각화: Agent가 어떤 작업을 수행했는지 표시
- 피드백 수집: 👍/👎 버튼으로 Agent 성능 평가
- 작업 기록 확인: Event Log를 통해 과거 작업 이력 조회

---

## 🛡️ Anti-Corruption Layer Design

### Block Management Domain 통합

#### BlockManagementAdapter Interface

Block Management Domain과의 통합을 추상화하는 인터페이스:

**주요 메서드**:
- 블럭 생성: blockType, content, position을 파라미터로 받아 블럭 생성
- 블럭 삭제: blockId를 받아 블럭 삭제
- 블럭 속성 업데이트: blockId, propertyPath, value를 받아 속성 업데이트
- 블럭 액션 실행: blockId, action, params를 받아 블럭 액션 실행

#### Translation Layer

Block Management Domain 데이터와 AI Management 도메인 모델 간 변환:

**변환 책임**:
- Block Management Domain의 블럭 데이터를 AI Management 도메인의 블럭 모델로 변환
- Block Management Domain의 액션 결과를 툴 실행 결과로 변환
- AI Management 도메인의 툴 호출을 Block Management Domain의 명령으로 변환

#### Benefits
1. **도메인 순수성**: Block Management Domain API가 AI Management Domain에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Block Management 구현 변경 시 ACL만 수정
4. **장애 격리**: Block Management 장애 시 AI Management 도메인 로직 보호

---

### Canvas Management Domain 통합

#### CanvasManagementAdapter Interface

Canvas Management Domain과의 통합을 추상화하는 인터페이스:

**주요 메서드**:
- 캔버스 상태 조회: pageId를 받아 캔버스 상태 반환
- 선택/주변 블럭 조회: pageId, selectedBlockIds, nearbyBlockIds를 받아 블럭 정보 목록 반환
- 엣지 생성: sourceBlockId, targetBlockId, edgeType, label을 받아 엣지 생성
- Hop 검색: 시작 블럭 ID와 hop 수를 받아 연결된 블럭 검색
- 키워드 검색: 키워드와 블럭 타입 필터를 받아 블럭 검색

#### Benefits
1. **도메인 순수성**: Canvas Management Domain API가 AI Management Domain에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Canvas Management 구현 변경 시 ACL만 수정
4. **장애 격리**: Canvas Management 장애 시 AI Management 도메인 로직 보호

---

## 📖 Read Models (Query Side)

### AIEventLogView

**목적**: 이벤트 로그 조회 및 AI 대화 히스토리 표시

**Query Handler 책임**:
- 페이지별 이벤트 로그 조회 (최근 N개)
- 이벤트 타입 필터링 (발화, AI 응답, 툴 호출, 블럭 변경)
- 시간 범위 필터링
- BM25 전문 검색 또는 메타데이터 패턴 매칭 (유사 이벤트 찾기)
- Agent 실행 단위로 그룹핑 (agentExecutionId)

**최적화 포인트**:
- 이벤트 로그는 페이지 ID + 시간 범위 복합 인덱스
- BM25 전문 검색은 GIN 인덱스 (to_tsvector)
- JSONB 메타데이터 필터링은 GIN 인덱스 (jsonb_path_ops)
- 최근 1주일 이벤트만 실시간 조회, 이전 이벤트는 아카이브
- Redis 캐싱: 최근 20개 이벤트 (TTL: 1분)

---

### ConversationHistoryView

**목적**: AI 대화 히스토리를 사용자 친화적으로 표시 (발화 + AI 응답 쌍)

**주요 필드**:
- pageId: 페이지 ID
- conversations: 대화 목록 (발화 이벤트 ID, 사용자 발화, AI 응답, 툴 호출 요약, 타임스탬프, Agent 실행 ID)
- 툴 호출 요약: 툴 이름 및 실행 요약 (예: "블럭 3개 생성")

**Query Handler 책임**:
- 페이지별 대화 히스토리 조회 (발화 + AI 응답 쌍으로 구성)
- Agent 실행 단위로 그룹핑
- 툴 호출 요약 생성
- 페이지네이션 (최근 50개)

**최적화 포인트**:
- 발화와 AI 응답을 agentExecutionId로 조인
- 툴 호출은 agentExecutionId로 그룹핑
- Redis 캐싱: 최근 10개 대화 (TTL: 5분)

---

### ContextView

**목적**: Agent에게 전달된 컨텍스트 시각화 (디버깅 및 투명성)

**주요 필드**:
- agentExecutionId: Agent 실행 ID
- pageId: 페이지 ID
- shortTermMemory: 숏텀 메모리 (최근 N개 이벤트)
- longTermMemory: 롱텀 메모리 (시맨틱 검색 결과)
- canvasContext: 캔버스 컨텍스트 (선택 블럭, 주변 블럭, 의미적 블럭)
- assembledAt: 컨텍스트 조립 시간

**Query Handler 책임**:
- Agent 실행별 컨텍스트 조회
- 컨텍스트 시각화 데이터 제공

**최적화 포인트**:
- 컨텍스트는 세션 생성 시 캐싱
- 디버깅 모드에서만 조회

---

## ✅ 검증 체크리스트

- [x] 각 Aggregate가 명확한 경계와 책임을 가지는가?
- [x] Process Model의 모든 System이 Aggregate 또는 Service로 적절히 매핑되었는가?
- [x] External System 처리가 적절한가? (Vercel AI SDK, pgvector는 External System으로 유지)
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (ACL 사용)
- [x] 핵심 불변식이 올바르게 정의되었는가?
- [x] Cross-Domain 이벤트가 적절히 설계되었는가? (BlockChangeLogged 등)

---

## 📊 성과 측정 지표

1. **Agent 성공률**: Agent가 사용자 요청을 성공적으로 완료한 비율 (목표: > 85%)
2. **평균 응답 시간**: 발화부터 Agent 완료까지의 시간 (목표: < 5초)
3. **툴 호출 평균 횟수**: Agent가 평균적으로 호출하는 툴 개수 (목표: 2-5개)
4. **컨텍스트 조립 시간**: 컨텍스트 수집 및 조합 시간 (목표: < 2초)
5. **사용자 만족도**: 피드백 👍 비율 (목표: > 80%)
6. **LLM 비용**: 세션당 평균 LLM 비용 (목표: < $0.10)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- [Basic AI Context Engineering 설계](../../discussion/ai-automation/basic-ai-context-engineering.md)

---

이 Software Design 문서는 AI Management Domain의 구현을 위한 완전한 설계 지침입니다.

