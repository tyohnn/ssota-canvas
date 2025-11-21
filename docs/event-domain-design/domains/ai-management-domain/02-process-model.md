# Process Model: AI Management Domain

## 🎯 개요

**도메인**: AI Management  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: 2025-11-12  
**버전**: v2.0 (Simplified - Vercel AI Agent)

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend)

---

## 🎯 Process Modeling Overview

AI Management Domain은 **Vercel AI SDK Agent**를 활용하여 사용자 발화를 자율적으로 처리하는 시스템입니다. 복잡한 액션칩 패턴 대신 Agent가 직접 툴을 호출하여 작업을 수행합니다.

### 📝 핵심 설계 원칙

#### ✅ Vercel AI Agent 기반 자율 실행
- 사용자 발화 입력 → Agent가 스스로 툴 호출
- 액션칩 제거 (중간 사용자 클릭 불필요)
- 모든 툴 호출이 이벤트 로그에 저장되어 컨텍스트로 활용

#### ✅ 단순화된 컨텍스트 구성
- **Short-Term Memory**: 최근 N개 작업 이력
- **Long-Term Memory**: 발화와 유사성 높은 과거 이력 (시맨틱 검색)
- **Canvas Context**: 선택/주변/의미적 블럭

#### ✅ 툴 중심 아키텍처
- **캔버스 조작 툴**: addBlock, deleteBlock, updateProperty, connectBlocks, executeBlockAction
- **캔버스 검색 툴**: searchByHop, searchByKeyword, searchBlockActions, searchMultimodal

### 🔄 시퀀스 기반 상호작용 순서

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

### 🟪 External System 1: LLM Provider (Vercel AI SDK)

AI Management는 **Vercel AI SDK**를 통해 LLM을 AI 추론 엔진으로 사용합니다:
- **역할**: Agent Loop 실행, 툴 호출 결정, 자연어 이해
- **SSOT**: LLM Provider가 AI 모델 및 추론 결과의 Single Source of Truth
- **통합**: Vercel AI SDK를 통한 실시간 Agent 실행

### 🟪 External System 2: Vector Database

AI Management는 **Vector DB (pgvector 등)**를 시맨틱 검색 엔진으로 사용합니다:
- **역할**: 블럭 임베딩 저장, 이벤트 로그 임베딩 저장, 시맨틱 유사도 검색
- **SSOT**: Vector DB가 임베딩 벡터의 Single Source of Truth
- **통합**: SQL/API를 통한 벡터 저장 및 검색

### 🟪 External Domain 1: Block Management Domain

AI Management는 **Block Management Domain**의 블럭 데이터를 활용합니다:
- **역할**: 블럭 CRUD, 블럭 액션 실행
- **통합**: Agent 툴 호출을 통한 동기적 호출
- **데이터 흐름**: 
  - AI Agent → Block Management: 툴 호출 (addBlock, updateProperty 등)
  - Block Management → AI Management: 블럭 변경 이벤트 (이벤트 로그 저장)

### 🟪 External Domain 2: Canvas Management Domain

AI Management는 **Canvas Management Domain**의 캔버스 상태를 활용합니다:
- **역할**: 캔버스 좌표, 엣지 정보, 선택/주변 블럭 정보
- **통합**: 컨텍스트 조립 시 동기적 호출
- **데이터 흐름**: 
  - AI Management → Canvas Management: 캔버스 상태 조회
  - AI Agent → Canvas Management: 툴 호출 (connectBlocks, searchByHop 등)

---

## 📍 Scenario 1: 사용자 발화 입력 → Agent 자율 실행

### Sequence 1: 사용자가 AI Agent에게 발화 입력

**Trigger Event**: 사용자가 AI 입력창에 발화 입력

```
👤 사용자: "캔버스에서 AI Agent에게 작업을 요청하고 싶어"
```

**Policy**: 
- "Whenever 사용자가 발화 입력함, then always 발화 임베딩 생성하기"
- "Whenever 발화 임베딩 생성됨, then always 컨텍스트 조립 시작하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- AI 입력창
- *UI Hint: AI 채팅 인터페이스* (선택사항)

**Command**: 발화 제출 (사용자가 입력하는 정보)
- utterance: 사용자 발화 내용
- pageId: 현재 페이지 ID
- selectedBlockIds?: 사용자가 선택한 블럭 ID 목록 (옵션)
- 발화 제출 확인

**System**: AI Query Handler (Backend - Security Enforcement)

- 비즈니스 로직: 발화 임베딩 생성, 컨텍스트 조립 트리거
- 검증 로직: 발화 길이 제한 (최대 2000자), 페이지 접근 권한 확인
- 처리 로직: 발화 저장, 임베딩 생성 요청, 컨텍스트 조립 시작

**Events**:
1. 발화가 제출되었다 (Utterance Submitted)
2. 발화 임베딩이 생성되었다 (Utterance Embedding Created)
3. 컨텍스트 조립이 시작되었다 (Context Assembly Started)

### Sequence 2: 컨텍스트 자동 조립 (Short-Term, Long-Term, Canvas)

**Trigger Event**: 컨텍스트 조립이 시작되었다

```
🔧 시스템: "숏텀/롱텀 메모리와 캔버스 컨텍스트를 자동으로 수집"
```

**Policy**: 
- "Whenever 컨텍스트 조립이 시작되었다, then always 3가지 컨텍스트 병렬 수집하기"
- "Whenever 선택 블럭이 있다면, then 선택 블럭을 우선 포함하기"
- "Whenever 컨텍스트 수집 완료됨, then always Agent에게 전달하기"

**Command**: 컨텍스트 조립 요청 (자동 실행)
- utteranceId: 발화 ID
- pageId: 페이지 ID
- selectedBlockIds?: 프론트엔드가 발화와 함께 전달한 현재 선택 블럭 ID 목록
- nearbyBlocks?: 프론트엔드가 계산해 전달한 주변 블럭 목록 (거리/그룹/엣지 hop 기반 메타 포함)
- 조립 확인

**System**: Context Manager (Backend)

- 비즈니스 로직:
  - **Short-Term Memory**: 최근 N개(예: 20개) 이벤트 조회 (대화 + 툴 실행)
  - **Long-Term Memory**: 발화 임베딩으로 Vector DB 시맨틱 검색 + 시간 가중치 (exp(-t/τ))
  - **Canvas Context**:
    - 선택 블럭: 프론트엔드가 발화와 함께 전달한 현재 선택 블럭 (최우선)
    - 주변 블럭: 프론트엔드가 발화 시점에 계산해 전달한 거리/그룹/엣지 hop 기반 블럭
    - 의미적 블럭: 발화와 블럭 내용 시맨틱 유사도 상위 N개
- 검증 로직: 블럭 읽기 권한 확인, 삭제된 블럭 제외
- 처리 로직: 병렬 컨텍스트 수집, 우선순위 정리, Agent 입력 포맷 구성

**Events**:
1. Short-Term Memory가 조회되었다 (Short-Term Memory Retrieved)
2. Long-Term Memory가 검색되었다 (Long-Term Memory Searched)
3. Canvas Context가 수집되었다 (Canvas Context Assembled)
4. 컨텍스트 조립이 완료되었다 (Context Assembly Completed)

### Sequence 3: Vercel AI Agent Loop 실행

**Trigger Event**: 컨텍스트 조립이 완료되었다

```
🔧 시스템: "Vercel AI Agent가 LLM 추론을 시작하고 스스로 툴을 호출"
```

**Policy**: 
- "Whenever 컨텍스트 조립이 완료되었다, then always Agent 실행하기"
- "Whenever Agent가 툴 호출함, then always 툴 실행하고 결과 반환하기"
- "Whenever Agent가 작업 완료 판단함, then always Agent Loop 종료하기"
- "If Agent Loop가 10회 초과함, then 강제 종료하고 타임아웃 처리하기"

**Command**: Agent 실행 요청 (자동 실행)
- utterance: 사용자 발화
- context: 조립된 컨텍스트 (Short-Term + Long-Term + Canvas)
- availableTools: 사용 가능한 툴 목록
- maxLoops: 최대 루프 횟수 (기본값: 10)
- timeout: 타임아웃 시간 (기본값: 30초)
- 실행 확인

**System**: Vercel AI Agent → LLM Provider System (External System)

- 비즈니스 로직:
  - Vercel AI SDK를 통한 Agent 실행
  - LLM 추론: 다음 액션 결정
  - 툴 호출: Agent가 선택한 툴 실행
  - 결과 관찰: 툴 실행 결과를 Agent에게 반환
  - 반복 또는 종료: Agent가 작업 완료 여부 판단
- 검증 로직: 최대 루프 횟수 확인, 타임아웃 확인
- 처리 로직: Agent Loop 실행, 툴 호출 로깅, 결과 수집

**Events**:
1. Agent 추론이 시작되었다 (Agent Reasoning Started)
2. Agent가 다음 액션을 결정했다 (Agent Decided Next Action)
3. Agent가 툴을 호출했다 (Tool Invoked by Agent)
4. 툴 실행 결과가 반환되었다 (Tool Result Returned)
5. 툴 호출이 이벤트 로그에 저장되었다 (Tool Call Logged to Event Store)
6. Agent가 작업 완료 여부를 판단했다 (Agent Evaluated Completion)
7. Agent가 추가 액션을 수행하거나 작업을 종료했다 (Agent Continued or Finished)

### Sequence 4: 세션 저장 및 임베딩 생성

**Trigger Event**: Agent가 작업을 종료했다

```
🔧 시스템: "전체 대화 세션과 툴 호출 이력을 이벤트 로그에 저장하고 임베딩 생성"
```

**Policy**: 
- "Whenever Agent가 작업을 종료했다, then always 세션 저장하기"
- "Whenever 세션 저장됨, then always 임베딩 생성하기"
- "Whenever 임베딩 생성 완료됨, then always Vector DB에 저장하기"

**Command**: 세션 저장 요청 (자동 실행)
- sessionId: 세션 ID
- utterance: 사용자 발화
- toolCalls: Agent가 실행한 툴 호출 목록
- timestamp: 세션 종료 시간
- 저장 확인

**System**: Memory Service → Vector DB System (External System)

- 비즈니스 로직: 세션 이벤트 로그 저장, 임베딩 생성, Vector DB 저장
- 검증 로직: 세션 데이터 유효성 검증
- 처리 로직: 이벤트 저장, 임베딩 생성, Vector DB 저장

**Events**:
1. 세션이 이벤트 로그에 저장되었다 (Session Logged to Unified History)
2. 발화 및 응답이 임베딩되었다 (Utterance and Response Embedded)
3. 임베딩이 Vector DB에 저장되었다 (Embedding Stored to Vector DB)

---

## 📍 Scenario 2: Agent 툴 실행 - 캔버스 조작

### Sequence 1: Agent가 addBlock 툴 호출

**Trigger Event**: Agent가 블럭 생성 결정함

```
🔧 Agent: "사용자 요청을 처리하기 위해 새 블럭을 생성해야 해"
```

**Policy**: 
- "Whenever Agent가 addBlock 툴 호출함, then always 블럭 생성 권한 검증하기"
- "Whenever 블럭 생성 완료됨, then always 툴 결과 반환하기"

**Command**: addBlock 툴 실행 요청 (Agent 자동 실행)
- blockType: 블럭 타입 (예: 'markdown', 'code', 'shape')
- content: 블럭 내용
- position: 생성 위치 { x: number, y: number }
- 실행 확인

**System**: Tool Executor → Block-Management Domain (External Domain)

- 비즈니스 로직: Block Management Domain에 블럭 생성 요청
- 검증 로직: 블럭 생성 권한 확인, 블럭 타입 유효성 검증
- 처리 로직: 블럭 생성, 결과 반환, 툴 호출 로깅

**Events**:
1. 블럭이 생성되었다 (Block Created)
2. 툴 실행이 완료되었다 (Tool Execution Completed)
3. 툴 결과가 Agent에게 반환되었다 (Tool Result Returned to Agent)

### Sequence 2: Agent가 connectBlocks 툴 호출

**Trigger Event**: Agent가 블럭 연결 결정함

```
🔧 Agent: "두 블럭을 엣지로 연결해야 해"
```

**Policy**: 
- "Whenever Agent가 connectBlocks 툴 호출함, then always 블럭 존재 여부 확인하기"
- "Whenever 엣지 생성 완료됨, then always 툴 결과 반환하기"

**Command**: connectBlocks 툴 실행 요청 (Agent 자동 실행)
- sourceBlockId: 소스 블럭 ID
- targetBlockId: 타겟 블럭 ID
- edgeType?: 엣지 타입 (옵션)
- label?: 엣지 라벨 (옵션)
- 실행 확인

**System**: Tool Executor → Canvas-Management Domain (External Domain)

- 비즈니스 로직: Canvas Management Domain에 엣지 생성 요청
- 검증 로직: 블럭 존재 여부 확인, 엣지 생성 권한 확인
- 처리 로직: 엣지 생성, 결과 반환, 툴 호출 로깅

**Events**:
1. 엣지가 생성되었다 (Edge Created)
2. 툴 실행이 완료되었다 (Tool Execution Completed)
3. 툴 결과가 Agent에게 반환되었다 (Tool Result Returned to Agent)

### Sequence 3: Agent가 executeBlockAction 툴 호출

**Trigger Event**: Agent가 블럭 액션 실행 결정함

```
🔧 Agent: "이 블럭에 대해 AI 작업(리팩터링, 요약 등)을 실행해야 해"
```

**Policy**: 
- "Whenever Agent가 executeBlockAction 툴 호출함, then always 블럭 액션 정의 조회하기"
- "Whenever 블럭 액션 실행 완료됨, then always 결과 블럭 생성하기"
- "Whenever 결과 블럭 생성됨, then always 툴 결과 반환하기"

**Command**: executeBlockAction 툴 실행 요청 (Agent 자동 실행)
- blockId: 대상 블럭 ID
- action: 액션 이름 (예: 'refactor', 'summarize', 'extract_script')
- params?: 추가 파라미터 (옵션)
- 실행 확인

**System**: Tool Executor → Block-Management Domain (External Domain)

- 비즈니스 로직:
  - Block Management Domain에 블럭 액션 실행 요청
  - 블럭 액션 AI 트리거 (LLM 호출)
  - 결과 블럭 생성 또는 기존 블럭 업데이트
- 검증 로직: 블럭 액션 실행 권한 확인, 블럭 타입과 액션 호환성 확인
- 처리 로직: 블럭 액션 실행, 결과 반환, 툴 호출 로깅

**Events**:
1. 블럭 액션이 트리거되었다 (Block Action Triggered)
2. 블럭 액션이 실행되었다 (Block Action Executed)
3. 결과 블럭이 생성되었다 (Result Block Created)
4. 툴 실행이 완료되었다 (Tool Execution Completed)
5. 툴 결과가 Agent에게 반환되었다 (Tool Result Returned to Agent)

---

## 📍 Scenario 3: Agent 툴 실행 - 캔버스 검색

### Sequence 1: Agent가 searchByHop 툴 호출

**Trigger Event**: Agent가 엣지 연결 탐색 결정함

```
🔧 Agent: "이 블럭과 연결된 블럭들을 찾아야 해"
```

**Policy**: 
- "Whenever Agent가 searchByHop 툴 호출함, then always 엣지 연결 블럭 검색하기"
- "Whenever 검색 완료됨, then always 툴 결과 반환하기"

**Command**: searchByHop 툴 실행 요청 (Agent 자동 실행)
- startBlockId: 시작 블럭 ID
- hops: N-hop 연결 (예: 1)
- edgeType?: 엣지 타입 필터 (옵션)
- 실행 확인

**System**: Tool Executor → Canvas-Management Domain (External Domain)

- 비즈니스 로직: 엣지 연결을 따라 N-hop 블럭 검색
- 검증 로직: 블럭 읽기 권한 확인
- 처리 로직: 그래프 탐색, 결과 수집, 툴 호출 로깅

**Events**:
1. 엣지 연결 블럭이 검색되었다 (Connected Blocks Found)
2. 툴 실행이 완료되었다 (Tool Execution Completed)
3. 툴 결과가 Agent에게 반환되었다 (Tool Result Returned to Agent)

### Sequence 2: Agent가 searchByKeyword 툴 호출

**Trigger Event**: Agent가 키워드 검색 결정함

```
🔧 Agent: "특정 키워드가 포함된 블럭을 찾아야 해"
```

**Policy**: 
- "Whenever Agent가 searchByKeyword 툴 호출함, then always 키워드 검색 실행하기"
- "Whenever 검색 완료됨, then always 툴 결과 반환하기"

**Command**: searchByKeyword 툴 실행 요청 (Agent 자동 실행)
- keyword: 검색 키워드
- blockTypes?: 블럭 타입 필터 (옵션)
- 실행 확인

**System**: Tool Executor → Block-Management Domain (External Domain)

- 비즈니스 로직: 블럭 내용에서 키워드 검색
- 검증 로직: 블럭 읽기 권한 확인
- 처리 로직: 전체 텍스트 검색, 결과 수집, 툴 호출 로깅

**Events**:
1. 키워드 매칭 블럭이 검색되었다 (Keyword Matched Blocks Found)
2. 툴 실행이 완료되었다 (Tool Execution Completed)
3. 툴 결과가 Agent에게 반환되었다 (Tool Result Returned to Agent)

---

## 📍 Scenario 4: 블럭 변경 이벤트 로그 자동 저장

### Sequence 1: 블럭이 생성/수정/삭제될 때 이벤트 로그 저장

**Trigger Event**: 블럭이 변경되었다 (Block Management Domain에서 이벤트 발생)

```
🔧 시스템: "블럭 변경 이벤트를 감지하고 로그로 저장"
```

**Policy**: 
- "Whenever 블럭이 변경되었다, then always 변경 이벤트 로그 저장하기"
- "Whenever 변경 이벤트 로그 저장됨, then always 이벤트 내용 임베딩 생성하기"
- "Whenever 임베딩 생성 완료됨, then always Vector DB에 저장하기"

**Command**: 변경 이벤트 로그 저장 요청 (자동 실행)
- eventType: 이벤트 타입 (예: 'block_created', 'block_updated', 'block_deleted')
- blockId: 블럭 ID
- userId: 변경한 사용자 ID
- pageId: 페이지 ID
- changes: 변경 내용 (diff)
- timestamp: 변경 시간
- 저장 확인

**System**: Change Event Logger → Vector DB System (External System)

- 비즈니스 로직: 변경 이벤트 로그 저장, 변경 내용 텍스트 추출, 임베딩 생성, Vector DB 저장
- 검증 로직: 변경 이벤트 유효성 검증
- 처리 로직: 이벤트 저장, 임베딩 생성, Vector DB 저장

**Events**:
1. 변경 이벤트 로그가 저장되었다 (Change Event Logged)
2. 변경 이벤트 임베딩이 생성되었다 (Change Event Embedding Created)
3. 변경 이벤트 임베딩이 Vector DB에 저장되었다 (Change Event Embedding Stored)

---

## 📍 Scenario 5: Agent 실행 실패 처리

### Sequence 1: Agent Loop 무한 실행 방지

**Trigger Event**: Agent Loop가 최대 횟수 초과함

```
🔧 시스템: "Agent가 10회 이상 반복 실행하여 강제 종료 필요"
```

**Policy**: 
- "Whenever Agent Loop가 최대 횟수 초과함, then immediately 강제 종료하기"
- "Whenever Agent 강제 종료됨, then always 사용자에게 타임아웃 알림 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- Agent 타임아웃 알림 메시지
- 실행된 툴 호출 목록 표시
- *UI Hint: 에러 알림* (선택사항)

**Command**: Agent 타임아웃 처리 요청 (자동 실행)
- sessionId: 세션 ID
- loopCount: 실행된 루프 횟수
- toolCalls: 실행된 툴 호출 목록
- 처리 확인

**System**: Agent Loop Controller (Backend)

- 비즈니스 로직: 최대 루프 횟수 확인, 강제 종료, 타임아웃 이벤트 로깅
- 검증 로직: 루프 횟수 검증
- 처리 로직: Agent 종료, 에러 로깅, 사용자 알림

**Events**:
1. Agent Loop가 타임아웃되었다 (Agent Loop Timed Out)
2. 타임아웃이 이벤트 로그에 저장되었다 (Timeout Logged)

### Sequence 2: 툴 실행 실패 시 Agent 복구

**Trigger Event**: 툴 실행이 실패함

```
🔧 시스템: "툴 실행 실패 시 Agent에게 에러 메시지 반환하여 복구 시도"
```

**Policy**: 
- "Whenever 툴 실행이 실패함, then always 명확한 에러 메시지 반환하기"
- "Whenever 에러 메시지 반환됨, then Agent가 재시도 또는 다른 액션 선택하기"
- "If 재시도 3회 실패함, then Agent Loop 종료하기"

**Command**: 툴 실행 에러 처리 요청 (자동 실행)
- toolName: 실패한 툴 이름
- error: 에러 메시지
- retryCount: 재시도 횟수
- 처리 확인

**System**: Tool Executor (Backend)

- 비즈니스 로직: 에러 메시지 생성, Agent에게 반환, 재시도 로직
- 검증 로직: 재시도 횟수 확인
- 처리 로직: 에러 로깅, 에러 메시지 반환, 재시도 또는 종료

**Events**:
1. 툴 실행이 실패했다 (Tool Execution Failed)
2. 에러 메시지가 Agent에게 반환되었다 (Error Message Returned to Agent)
3. Agent가 재시도를 결정했다 (Agent Decided to Retry)

---

## 💡 핵심 Policy 정리

### 컨텍스트 조립 관련
1. **자동 임베딩 생성**: 페이지 진입 시 모든 블럭의 임베딩 자동 생성
2. **3가지 컨텍스트 수집**: Short-Term Memory + Long-Term Memory + Canvas Context
3. **시맨틱 서치 + 시간 가중치**: 롱텀 메모리를 시맨틱 검색으로 찾고 시간 가중치 적용 (exp(-t/τ))
4. **선택 블럭 우선**: 사용자가 명시적으로 선택한 블럭은 무조건 컨텍스트에 포함

### Agent 실행 관련
5. **Vercel AI SDK 기반**: Agent Loop는 Vercel AI SDK가 자동 관리
6. **툴 중심 아키텍처**: Agent가 직접 툴을 호출하여 작업 수행
7. **최대 루프 제한**: 10회 초과 시 강제 종료하여 무한 루프 방지
8. **타임아웃 설정**: 30초 초과 시 강제 종료

### 툴 실행 관련
9. **권한 검증**: 모든 툴 실행 시 권한 확인
10. **에러 처리**: 툴 실행 실패 시 명확한 에러 메시지 반환
11. **재시도 로직**: 네트워크 에러 등은 자동 재시도 (최대 3회)
12. **툴 호출 로깅**: 모든 툴 호출이 이벤트 로그에 저장되어 컨텍스트로 활용

### 이벤트 로그 관련
13. **통합 이벤트 로그**: 블럭 변경, 대화, 툴 호출 모두 이벤트 로그로 저장
14. **임베딩 자동 생성**: 모든 이벤트 로그의 임베딩 자동 생성 및 Vector DB 저장
15. **시맨틱 검색 활용**: 과거 이벤트를 시맨틱 검색으로 복원하여 컨텍스트로 활용

---

## 🔧 기술 권장사항

### Vercel AI SDK 설정
- **모델 선택**: OpenAI GPT-4 Turbo 또는 Anthropic Claude 3.5 Sonnet
- **온도 설정**: 0.7 (창의성과 정확성 균형)
- **최대 토큰**: 컨텍스트에 따라 동적 조정
- **스트리밍**: 사용자 경험 향상을 위한 스트리밍 응답

### 컨텍스트 조립 최적화
- **병렬 처리**: Short-Term, Long-Term, Canvas Context를 병렬로 수집
- **캐싱**: 블럭 임베딩은 캐싱하여 반복 계산 방지
- **컨텍스트 압축**: 토큰 제한 고려하여 중요도 기반 컨텍스트 선택

### Vector DB 통합
- **배치 임베딩 생성**: 대량 블럭 임베딩은 배치로 생성
- **하이브리드 서치**: 키워드 + 시맨틱 서치 조합으로 정확도 향상
- **필터링**: 시맨틱 서치 시 권한 기반 필터링 적용

### 성능 최적화
- **비동기 처리**: 임베딩 생성, 이벤트 로그 저장은 백그라운드 비동기 처리
- **배치 처리**: 이벤트 로그 저장은 배치 처리
- **인덱싱**: 이벤트 로그 조회 최적화를 위한 적절한 인덱스

---

## 🚀 Next Steps

이제 AI Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (LLM Provider, Vector DB는 External System으로 유지)
2. **Bounded Context 식별**: AI Context, Tool Execution, Memory Service 경계 확인
3. **Integration Points**: Block Management Domain, Canvas Management Domain과의 연결점 정의
4. **Anti-Corruption Layer**: LLM Provider, Vector DB와의 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2025-11-12
**참가자**: 
- **도메인 전문가**: AI 기능 설계 팀
- **시니어 개발자**: 백엔드 리드
- **PM**: 제품 전략 팀

**워크샵 결과물**:
- [x] Vercel AI Agent 기반 단순화된 구조로 재설계
- [x] 모든 핵심 사용자 여정이 시나리오로 정의됨
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] External System과의 통합점이 명확히 정의됨
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨
- [x] Software Design 작성을 위한 충분한 정보 확보

**주요 의사결정**:
1. ✅ Vercel AI SDK 사용
2. ✅ 액션칩 제거 → Agent 직접 툴 호출
3. ✅ 컨텍스트 구성 단순화 (숏텀/롱텀/캔버스)
4. ✅ 모든 툴 호출을 이벤트 로그에 저장
5. ✅ Agent Loop 최대 횟수 제한 (10회)

---

*이 Process Model 문서는 AI Management Domain의 Software Design 작성을 위한 기반 자료입니다.*

