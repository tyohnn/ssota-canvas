# Event Storming: AI Management Domain

## 🎯 개요

**도메인**: AI Management (Vercel AI Agent & Context Engine)  
**작성자**: AI 기능 설계 팀
**작성일**: 2025-11-12  
**최종 업데이트**: 2025-11-12
**버전**: v2.0 (Simplified)

**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 
Vercel AI SDK 기반 Agent를 활용하여 캔버스 컨텍스트를 자동으로 파악하고, 사용자 의도에 맞는 작업을 자율적으로 수행. Cursor IDE처럼 컨텍스트를 지능적으로 활용하되, Agent가 직접 툴을 호출하여 작업을 실행하는 단순하고 강력한 구조.

**다른 도메인과의 관계**:
- **Block Management Domain**: 블럭 CRUD, 속성, 블럭 액션 툴 제공
- **Canvas Management Domain**: 뷰포트, 좌표, 엣지 정보 제공
- **Workspace Management Domain**: 권한 및 페이지 범위 검증

---

## 📝 핵심 개념 정리

### Vercel AI Agent Architecture
사용자 발화를 받아 **Vercel AI SDK의 Agent**가 스스로 툴을 호출하며 작업을 수행합니다.

**핵심 특징**:
- **No Action Chips**: 사용자가 중간에 클릭하지 않고 Agent가 자율 실행
- **Tool-First**: Agent가 캔버스 조작/검색 툴을 직접 호출
- **Event Logging**: 모든 툴 호출이 이벤트 로그에 저장되어 컨텍스트로 활용

### Context Assembly (컨텍스트 구성)

#### 1. Short-Term Memory (숏텀 메모리)
- **최근 작업 이력**: 대화 + 툴 실행 포함
- 페이지 단위로 최근 N개 이벤트 조회

#### 2. Long-Term Memory (롱텀 메모리)
- **발화와 유사성 높은 작업 이력**
- 시맨틱 검색 + 시간 가중치로 과거 맥락 복원

#### 3. Canvas Context (캔버스 컨텍스트)
- **선택 블럭**: 현재 사용자가 선택한 블럭
- **주변 블럭**: 
  - 거리 기반 (좌표 근접성)
  - 그룹 기반 (같은 그룹 소속)
  - 엣지 hop 기반 (1차 연결 블럭)
- **의미적 블럭**: 발화와 블럭 내용 간 시맨틱 유사도

#### 4. Tools (툴)
Agent가 호출할 수 있는 툴:

**캔버스 조작 툴**:
- `addBlock`: 블럭 추가
- `duplicateBlock`: 블럭 복제
- `deleteBlock`: 블럭 삭제
- `connectBlocks`: 엣지 연결
- `updateProperty`: 속성 변경
- `executeBlockAction`: 블럭 액션 실행

**캔버스 검색 툴**:
- `searchByHop`: 엣지 hop 검색
- `searchByKeyword`: 키워드 검색
- `searchBlockActions`: 블럭 액션 검색
- `searchMultimodal`: 멀티모달 검색 (텍스트 + 이미지)

### Agent Loop Execution (에이전트 루프 실행)

```
User Utterance
  ↓
Agent Receives Context
  ├─ Short-Term Memory
  ├─ Long-Term Memory
  ├─ Canvas Context (Selected, Nearby, Semantic Blocks)
  └─ Available Tools
  ↓
LLM Reasoning Loop
  ├─ Decide Next Action
  ├─ Call Tool (Canvas Manipulation or Search)
  ├─ Observe Result
  ├─ Log Tool Call to Event Store
  └─ Continue or Finish
  ↓
Task Completed
```

---

## 🟠 Domain Events (시간 순서)

### 1. User Interaction & Context Preparation
- 사용자가 AI Agent에게 요청했다 (User Utterance Received)
- 숏텀 메모리가 조회되었다 (Short-Term Memory Retrieved)
- 롱텀 메모리가 검색되었다 (Long-Term Memory Searched)
- 캔버스 컨텍스트가 수집되었다 (Canvas Context Assembled)
  - 선택 블럭 식별됨
  - 주변 블럭 (거리/그룹/엣지) 수집됨
  - 의미적 블럭 (시맨틱 유사도) 발견됨
- 사용 가능한 툴 목록이 Agent에게 전달되었다 (Available Tools Provided)

### 2. Agent Loop & Tool Execution
- Agent가 LLM 추론을 시작했다 (Agent Reasoning Started)
- Agent가 다음 액션을 결정했다 (Agent Decided Next Action)
- Agent가 툴을 호출했다 (Tool Invoked by Agent)
  - 캔버스 조작 툴 실행됨
  - 캔버스 검색 툴 실행됨
- 툴 실행 결과가 Agent에게 반환되었다 (Tool Result Returned)
- 툴 호출이 이벤트 로그에 저장되었다 (Tool Call Logged to Event Store)
- Agent가 작업 완료 여부를 판단했다 (Agent Evaluated Completion)
- Agent가 추가 액션을 수행하거나 작업을 종료했다 (Agent Continued or Finished)

### 3. Block Action Integration (이것도 그냥 Tool Call)
- Agent가 블럭 액션 실행을 결정했다 (Agent Decided to Execute Block Action)
- 블럭 액션이 트리거되었다 (Block Action Triggered)
- 블럭 액션 실행이 시작되었다 (Block Action Execution Started)
- 블럭 액션 결과가 생성되었다 (Block Action Result Generated)
- 결과 블럭이 캔버스에 반영되었다 (Result Block Created)

### 4. Memory & Learning
- 전체 대화 세션이 이벤트 로그에 저장되었다 (Session Logged to Unified History)
- 발화 및 응답이 임베딩되어 벡터 저장소에 저장되었다 (Utterance and Response Embedded)
- 사용자가 결과를 평가했다 (User Feedback Collected)
- 피드백이 학습 데이터로 저장되었다 (Feedback Stored for Learning)

---

## 🔵 Commands & Actors

### 주요 시나리오: 사용자 발화 입력

#### 단일 시나리오 플로우
- **사용자가 발화 입력하기** (User) → User Utterance Received
- **시스템이 메모리 조회하기** (Memory Service) → Short-Term & Long-Term Memory Retrieved
- **시스템이 캔버스 컨텍스트 수집하기** (Context Manager) → Canvas Context Assembled
- **Agent가 LLM 추론 시작하기** (AI Agent) → Agent Reasoning Started
- **Agent가 툴 호출하기** (AI Agent) → Tool Invoked by Agent
- **시스템이 툴 실행하기** (Tool Executor) → Tool Executed
- **시스템이 툴 결과 반환하기** (Tool Executor) → Tool Result Returned
- **Agent가 완료 판단하기** (AI Agent) → Agent Evaluated Completion
- **시스템이 세션 저장하기** (Memory Service) → Session Logged to Unified History

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **Canvas User**: 캔버스에서 AI Agent와 대화하며 작업하는 사용자

#### System Actors (내부 시스템)
- **AI Agent**: Vercel AI SDK 기반 Agent로 LLM 추론 및 툴 호출 수행
- **Context Manager**: 숏텀/롱텀 메모리 및 캔버스 컨텍스트 조립
- **Tool Executor**: Agent가 요청한 툴 실행 및 결과 반환
- **Memory Service**: 이벤트 로그 저장 및 시맨틱 검색
- **Block Action Service**: 블럭 액션 AI 실행

#### External Systems (외부 도메인)
- **Block Management Domain**: 블럭 CRUD 및 블럭 액션 제공
- **Canvas Management Domain**: 캔버스 상태, 엣지, 하이라이트
- **Workspace Management Domain**: 권한 및 페이지 범위
- **LLM Provider**: Vercel AI SDK 백엔드 LLM (OpenAI, Anthropic 등)
- **Vector Database**: 임베딩 저장 및 시맨틱 검색 (pgvector 등)

---

## 🟠 Bounded Context 정의

### AI Management Context (단일 컨텍스트)

**책임**: 
사용자 발화를 받아 Vercel AI Agent가 캔버스 컨텍스트와 메모리를 바탕으로 자율적으로 작업을 수행하고, 모든 실행 내역을 데이터로 저장합니다.

**핵심 언어**: 
Utterance, Context, Short-Term Memory, Long-Term Memory, Canvas Context, Tool, Agent Loop, Tool Call, Event Log, Feedback

**핵심 용어 및 개념**:
- **Utterance**: 사용자가 입력한 자연어 요청
- **Context**: Agent에게 전달되는 메모리 + 캔버스 정보 조합
- **Short-Term Memory**: 최근 N개 작업 이력 (대화 + 툴 실행)
- **Long-Term Memory**: 발화와 유사성 높은 과거 이력 (시맨틱 검색)
- **Canvas Context**: 선택/주변/의미적 블럭 정보
- **Tool**: Agent가 호출 가능한 캔버스 조작/검색 함수
- **Agent Loop**: LLM 추론 → 툴 호출 → 결과 관찰 → 반복 또는 종료
- **Tool Call**: Agent가 실행한 툴 호출 기록
- **Event Log**: 통합 이벤트 저장소 (대화, 툴 실행, 블럭 변경 모두 포함)
- **Feedback**: 사용자의 평가 및 행동 로그

**내부 서브시스템** *(Process Model에서 상세화)*:
- Context Assembly (메모리 + 캔버스 컨텍스트 조립)
- Tool Execution (Agent 툴 호출 처리)
- Semantic Memory (벡터 검색 및 임베딩 관리)

**포함 이벤트**:
- User Interaction & Context Preparation (5개 + 컨텍스트 세부 3개)
- Agent Loop & Tool Execution (8개)
- Block Action Integration (툴 콜 5개)
- Memory & Learning (4개)

**총 24개 이벤트**

---

## 🔗 도메인 간 관계 및 통합점

### AI Management ↔ Block Management Domain
- **연결점**: 툴 실행에 따른 블럭 CRUD, 블럭 액션 트리거
- **데이터 흐름**: 
  - `Tool Invoked` (addBlock, updateProperty 등) → `Block Created/Updated`
  - `Block Action Triggered` → Block Management가 액션 실행 및 결과 블럭 생성
- **통합 방식**: 동기적 서비스 호출 + 이벤트 구독

### AI Management ↔ Canvas Management Domain
- **연결점**: 캔버스 상태 수집, 엣지 생성, 검색 툴 실행
- **데이터 흐름**: 
  - `Canvas Context Assembled` ← 선택/주변 블럭 정보, 뷰포트 상태
  - `Tool Invoked` (connectBlocks, searchByHop) → 엣지 생성 및 검색 수행
- **통합 방식**: 클라이언트 상태 + 서버 액션

### AI Management ↔ Workspace Management Domain
- **연결점**: 권한 검증, 페이지 범위, 멤버 정보
- **데이터 흐름**: 
  - 컨텍스트 수집 시 권한 필터링
  - 툴 실행 시 권한 범위 검증
- **통합 방식**: RLS 기반 권한 검증

### AI Management ↔ LLM Provider & Vector Database
- **연결점**: Vercel AI SDK를 통한 LLM 호출, 임베딩 저장/검색
- **데이터 흐름**: 
  - `Agent Reasoning Started` → Vercel AI SDK → LLM API 호출
  - `Session Logged` → 임베딩 생성 → Vector DB 저장
  - `Long-Term Memory Searched` ← Vector DB 시맨틱 검색
- **통합 방식**: Vercel AI SDK, Vector DB SDK/SQL

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **Agent Loop 무한 실행 위험**
   - 문제: Agent가 적절히 종료하지 못하고 툴을 반복 호출할 수 있습니다.
   - 영향: LLM 비용 폭발, 사용자 대기 시간 증가, 캔버스 과도한 변경
   - 해결: 최대 루프 횟수 제한 (예: 10회), 타임아웃 설정, 명시적 종료 조건 강화

2. **Context Assembly 지연**
   - 문제: 메모리 검색 + 캔버스 컨텍스트 수집이 1초 이상 걸리면 체감 품질 저하
   - 영향: Agent 시작 지연 → 사용자 이탈
   - 해결: 선택 블럭 우선 수집, 시맨틱 검색 비동기화, 컨텍스트 캐싱

3. **Tool Execution 실패 시 Agent 혼란**
   - 문제: 툴 실행 실패 시 Agent가 어떻게 복구해야 할지 판단하기 어렵습니다.
   - 영향: 작업 중단, 부분 완료 상태 방치
   - 해결: 명확한 에러 메시지 반환, 재시도 로직, Undo 제안

### 우선순위: 중간

4. **Semantic Memory 스케일링**
   - 문제: 페이지당 누적되는 이벤트 로그와 임베딩이 급증합니다.
   - 영향: 검색 속도 저하, 저장 비용 상승
   - 해결: 중요도 기반 필터링, 보존 정책, 샘플링

5. **Tool Call 과도한 로깅 부하**
   - 문제: 모든 툴 호출을 로깅하면 DB 부하가 증가합니다.
   - 영향: 쓰기 성능 저하
   - 해결: 배치 저장, 비동기 로깅, 중요 이벤트만 즉시 저장

6. **권한 필터링 복잡성**
   - 문제: 컨텍스트 수집 시 권한 체크가 복잡하고 느릴 수 있습니다.
   - 영향: 컨텍스트 조립 지연, 잘못된 블럭 노출 위험
   - 해결: RLS 활용, 권한 캐싱, "AI 제외" 플래그

### 우선순위: 낮음

7. **사용자 피드백 수집 부족**
   - 문제: Agent가 자율 실행하면 사용자가 중간 과정을 평가하기 어렵습니다.
   - 영향: 학습 데이터 품질 저하
   - 해결: 실행 후 요약 제공, 피드백 UI, 주요 액션만 하이라이트

8. **LLM 비용 증가**
   - 문제: Agent 루프마다 LLM 호출이 발생합니다.
   - 영향: 운영 비용 증가
   - 해결: 컨텍스트 압축, 캐싱, 간단한 작업은 규칙 기반 처리

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **Agent 실행 시각화**
   - 기회: Agent가 어떤 툴을 호출하고 있는지 실시간 표시
   - 구현: 툴 호출 로그를 UI에 스트리밍, 현재 작업 상태 표시

2. **Tool Call Undo 지원**
   - 기회: 잘못된 툴 실행을 즉시 되돌리기
   - 구현: 툴 실행 후 Undo 버튼 제공, Undo 스택 자동 생성

3. **피드백 루프 기본화**
   - 기회: Agent 실행 완료 후 "잘했나요?" 평가 수집
   - 구현: 완료 후 피드백 UI, 부정 피드백 시 재실행 옵션

4. **Context 시각화**
   - 기회: Agent가 참조한 블럭과 이력 하이라이트
   - 구현: 컨텍스트 패널, 참조 블럭 하이라이트 토글

### 향후 구현 (Post-MVP)

5. **개인화된 컨텍스트 가중치** *(메모)*
   - 사용자별 선택/근접/시맨틱 가중치 학습

6. **Multi-Agent 협업** *(메모)*
   - 복잡한 작업을 여러 Agent가 분담 처리

7. **음성 인터페이스** *(메모)*
   - 음성 발화 입력 및 Agent 실행 상태 TTS 안내

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. Context Assembly (컨텍스트 조립)
- Q: 선택/주변/의미적 블럭을 어떤 우선순위와 개수로 수집할 것인가?
- Q: 숏텀 메모리는 몇 개까지? 롱텀 메모리 시맨틱 검색 임계값은?
- Q: 클라이언트와 서버 중 어디서 컨텍스트를 조립할 것인가?

### 2. Agent Loop 제어
- Q: Agent 최대 루프 횟수와 타임아웃을 어떻게 설정할 것인가?
- Q: Agent가 종료 조건을 명확히 판단하도록 프롬프트를 어떻게 설계할 것인가?
- Q: 툴 실행 실패 시 Agent가 어떻게 복구하도록 유도할 것인가?

### 3. Tool Execution (툴 실행)
- Q: 각 툴의 권한 검증과 파라미터 검증은 어떻게 수행할 것인가?
- Q: 툴 실행 결과를 Agent에게 어떤 형식으로 반환할 것인가?
- Q: 툴 실행 실패 시 에러 메시지를 어떻게 표준화할 것인가?

### 4. Semantic Memory & Event Logging
- Q: 어떤 이벤트를 임베딩 대상으로 삼고, 중요도 기준은?
- Q: 롱텀 메모리 검색 시 시간 가중치를 어떻게 적용할 것인가?
- Q: 툴 호출 로깅을 동기/비동기 중 어떻게 처리할 것인가?

### 5. LLM & 비용 최적화
- Q: Vercel AI SDK 설정 (모델, 온도, 최대 토큰)은?
- Q: 컨텍스트 압축 및 캐싱 전략은?
- Q: 간단한 작업을 규칙 기반으로 처리할 기준은?

### 6. 권한 & 보안
- Q: 컨텍스트 수집 시 권한 필터링을 어느 레이어에서 수행할 것인가?
- Q: "AI 제외" 플래그를 어떻게 구현하고 적용할 것인가?
- Q: Agent 툴 호출을 감사 로그로 어떻게 기록할 것인가?

---

## 📝 Process Model 준비 상태

AI Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: Agent 툴 호출 및 이벤트 트리거 액션 상세화
2. **Policy** 정의: 
   - Context Assembly 규칙 (선택/주변/의미적 블럭 우선순위 및 개수)
   - Agent Loop 제어 정책 (최대 루프, 타임아웃, 종료 조건)
   - Tool Execution 정책 (권한 검증, 에러 처리, Undo)
   - Semantic Memory 정책 (임베딩 대상, 시간 가중치, 보존 기간)
3. **Read Model** 명시: 
   - Canvas Context 조회 (선택/주변/의미적 블럭)
   - Memory 검색 (숏텀 N개, 롱텀 시맨틱 검색)
   - Tool Call 이력 조회
   - 피드백 및 메트릭 대시보드
4. **External System**: 
   - Vercel AI SDK 통합
   - Vector DB 통합 (pgvector)
   - Block/Canvas/Workspace Management Domain 연동

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025-11-12  
**참가자**: 
- **도메인 전문가**: AI 기능 설계 팀
- **PM**: 제품 전략 팀
- **시니어 개발자**: 백엔드/프론트엔드 리드

**워크샵 결과물**:
- [x] Vercel AI Agent 기반 단순화된 구조로 재설계
- [x] 액션칩 제거, Agent 자율 실행 방식 채택
- [x] 이벤트 목록 완성 (24개 이벤트)
- [x] 단일 시나리오 (사용자 발화 입력) 정의
- [x] Bounded Context 정의 (AI Management 단일 컨텍스트)
- [x] Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling 질문 정리 완료

**주요 의사결정**:
1. ✅ Vercel AI SDK Agent 사용
2. ✅ 액션칩 제거 → Agent 직접 툴 호출
3. ✅ Two-Line Response 제거 → Agent 자율 실행
4. ✅ 모든 툴 호출을 이벤트 로그에 저장
5. ✅ 단순화된 컨텍스트 구성 (숏텀/롱텀/캔버스)

---

## 🔗 연관 도메인

### Block Management Domain과의 관계
- **연결점**: Agent 툴 실행에 따른 블럭 CRUD, 블럭 액션 트리거
- **이벤트 흐름**: 
  - AI Management → Block Management: `Tool Invoked` (addBlock 등) → `Block Created`
  - AI Management → Block Management: `Block Action Triggered` → `Block Action Executed`
- **통합 방식**: 동기적 서비스 호출 + 이벤트 구독

### Canvas Management Domain과의 관계
- **연결점**: 캔버스 상태 수집, 엣지 생성, 검색 툴
- **이벤트 흐름**: 
  - Canvas Management → AI Management: 선택/주변 블럭 정보 제공
  - AI Management → Canvas Management: `Tool Invoked` (connectBlocks, searchByHop)
- **통합 방식**: 클라이언트 상태 + 서버 액션

### Workspace Management Domain과의 관계
- **연결점**: 권한 검증, 페이지 범위
- **이벤트 흐름**: 
  - AI Management → Workspace Management: 권한 필터링, 멤버 정보 조회
- **통합 방식**: RLS 기반 권한 검증

---

*이 Event Storming 문서는 Vercel AI Agent 기반 단순화된 AI Management Domain의 Process Model 작성을 위한 기반 자료입니다.*
