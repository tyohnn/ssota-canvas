# User Flow: AI Management Domain

## 🎯 개요

**도메인**: AI Management  
**작성자**: UX/UI 디자이너 + 기획자  
**작성일**: 2025-11-12  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: `04-frontend-specification.md`

---

### 문서 목적

이 문서는 AI Management Domain의 사용자 여정을 정의합니다.  
Process Model의 Vercel AI Agent 기반 비즈니스 프로세스를 실제 화면 흐름과 사용자 인터랙션으로 구체화합니다.

**범위**:
- 사용자 화면 흐름 정의
- UI 컴포넌트 및 인터랙션 명세
- AI Agent 실행 상태 표시 방법
- 에러 처리 및 피드백 방법

**제외 사항** (Frontend Specification에서 다룸):
- React 컴포넌트 구현 상세
- 상태 관리 방법 (Vercel AI SDK 통합)
- Server Actions 연동
- Event Log 저장 로직

---

## 📍 Scenario 1: 사용자 발화 입력 → Agent 자율 실행

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 1 in `02-process-model.md`
- **사용자 목표**: AI Agent에게 자연어로 작업을 요청하고, Agent가 자동으로 캔버스 조작 및 블럭 액션을 실행하도록 함
- **주요 제약**: 
  - Agent Loop 최대 10회 제한
  - 타임아웃 30초
  - 페이지 접근 권한 필요
  - 선택 블럭 및 주변 블럭은 프론트엔드에서 계산하여 전달

---

### Screen 1: AI 입력창 (초기 상태)

**화면 구성**:
- **입력 영역**: AI 채팅 인터페이스 (하단 고정)
- **컨텍스트 힌트**: 현재 선택된 블럭 수, 주변 블럭 수 표시 (옵션)

**UI 컴포넌트**:
- **AI 입력 컴포넌트** (PromptInput)
  - 컴포넌트: `prompt-input.tsx` 사용
  - 플레이스홀더: "AI에게 작업을 요청하세요... (예: 선택한 블럭을 3개 복제해줘)"
  - 제한 없음
  - 자동 높이 조절 (최대 5줄)
  - Enter 키로 전송, Shift+Enter로 줄바꿈
- **선택 블럭 표시** (Chip)
  - 예: "선택된 블럭 2개"
  - 클릭 시 선택 블럭 목록 확인 가능 (옵션)

**인터랙션**:
- 텍스트 입력 → PromptInput 컴포넌트 내부 상태 업데이트
- Enter 키 → 발화 전송 및 Screen 2 (메시지 박스) 전환
- Shift+Enter → 줄바꿈
- ESC 키 → 입력창 초기화 (확인 다이얼로그 표시 옵션)

**화면 전환**:
- **조건**: Enter 키 입력
- **전환**: Screen 1 → Screen 2
- **전환 방식**: 메시지 박스 표시 (발화가 메시지 박스에 표시됨)

**접근성**:
- 키보드 포커스: 입력창에 자동 포커스
- 스크린 리더: "AI에게 작업 요청하기"
- 키보드 단축키: Cmd/Ctrl + K로 입력창 포커스

---

### Screen 2: Agent 실행 중 (메시지 박스)

**화면 구성**:
- **입력창**: 비활성화 상태 (입력 불가)
- **대화 영역**: Conversation 컴포넌트로 Agent 실행 상태 및 진행 상황 표시
- **캔버스**: Agent가 생성/수정한 블럭 실시간 표시

**UI 컴포넌트**:
- **Conversation 컴포넌트** (`conversation.tsx`)
  - **초기 상태**: 엔터 입력 후 사용자 발화가 Message 컴포넌트로 표시됨
  - **호버 상태**:
    - 마우스 호버 시: 높이 증가, 선명도 증가 (명확하게 표시)
    - 호버 없음: 높이 축소, 흐릿하게 표시 (배경으로 이동)
  - **철학**: "메시지는 휘발되고 데이터는 캔버스에 남는다"
    - Conversation은 일시적 정보 표시
    - 실제 결과는 캔버스에 영구적으로 반영됨

- **Message 컴포넌트** (`message.tsx`)
  - **사용자 발화**: 사용자가 입력한 발화를 Message 컴포넌트로 표시
  - **AI 응답**: Agent의 최종 응답을 Message 컴포넌트로 표시
  - **툴 호출 결과**: 각 툴 실행 결과를 Message 컴포넌트 내부에 표시

- **Reasoning 컴포넌트** (`reasoning.tsx`)
  - **Agent 추론 과정**: "Thinking..." (Shimmer 애니메이션)
  - **추론 내용**: Agent의 사고 과정을 Collapsible로 표시
  - **자동 접기**: 추론 완료 후 일정 시간 후 자동으로 접힘
  - **지속 시간 표시**: "Thought for N seconds"

- **Task 컴포넌트** (`task.tsx`)
  - **툴 호출 목록**: Agent가 실행한 툴을 Task 컴포넌트로 표시
  - **툴 실행 상태**: "⏳ addBlock 실행 중", "✓ searchByKeyword 완료"
  - **툴 실행 결과**: 각 툴의 실행 결과를 TaskContent에 표시
  - **Collapsible**: 기본적으로 펼쳐져 있음, 클릭하여 접기/펼치기 가능

- **Shimmer 컴포넌트** (`shimmer.tsx`)
  - **로딩 상태**: "Thinking..." 텍스트에 Shimmer 애니메이션 적용
  - **툴 실행 중**: 툴 실행 중 상태 표시에 Shimmer 사용

**Agent 상태별 표시**:
- **컨텍스트 조립 중**: Message 컴포넌트에 "작업 준비 중..." 표시 (1-2초)
- **Agent 추론 중**: Reasoning 컴포넌트에 "Thinking..." (Shimmer) 및 추론 내용 표시
- **툴 실행 중**: Task 컴포넌트에 툴 호출 목록 표시, Shimmer로 로딩 상태 표시
- **툴 실행 완료**: Task 컴포넌트에 "✓ 블럭 3개 생성 완료" 등 완료 상태 표시
- **작업 완료 판단 중**: Message 컴포넌트에 "작업 확인 중..." 표시

**인터랙션**:
- Conversation 호버 → 높이 증가, 선명도 증가 (상세 정보 확인)
- Conversation 호버 해제 → 높이 축소, 흐릿하게 전환 (배경으로 이동)
- Reasoning 컴포넌트 클릭 → 추론 내용 펼침/접기
- Task 컴포넌트 클릭 → 툴 호출 상세 정보 펼침/접기
- Reasoning 자동 접기: 추론 완료 후 1초 후 자동으로 접힘
- 자동 완료 → Screen 3 (결과 피드백) 전환

**화면 전환**:
- **조건**: Agent 작업 완료 또는 타임아웃
- **전환**: Screen 2 → Screen 3
- **전환 방식**: Conversation 포커싱 (높이 증가, 선명도 증가)

**애니메이션**:
- Conversation 높이 변화: 트랜지션 (300ms, ease-out)
- Conversation 선명도 변화: opacity 트랜지션 (200ms)
- Message 추가 시 슬라이드 인 (200ms)
- Reasoning 펼침/접기: slide-in-from-top-2 애니메이션
- Task 펼침/접기: slide-in-from-top-2 애니메이션
- Shimmer 애니메이션: 무한 반복 (2초 duration)

**타임아웃 처리**:
- **30초 타임아웃**: 자동으로 Screen 3 (타임아웃 피드백) 전환
- **10회 루프 초과**: 자동으로 Screen 3 (루프 초과 피드백) 전환

---

### Screen 3: 결과 피드백

**성공 시**:
- **Conversation 포커싱**: 
  - 완료 시 Conversation이 자동으로 포커싱됨
  - 높이 증가: 축소된 상태에서 확장됨
  - 선명도 증가: 흐릿한 상태에서 선명하게 표시됨
  - 완료 상태 안내: Message 컴포넌트에 "작업이 완료되었습니다" 또는 Agent의 최종 응답 텍스트 표시
- **UI 반응**: 
  - 입력창 초기화 및 활성화 (다음 발화 입력 가능)
  - 캔버스 자동 업데이트 (생성/수정된 블럭 표시)
- **툴 호출 요약**: 
  - 예: "블럭 3개 생성, 엣지 2개 연결"
  - Task 컴포넌트에 요약 표시 (호버 시 상세 확인 가능)
- **다음 액션**: 
  - 생성된 블럭 자동 선택 (옵션)
  - Conversation은 일정 시간 후 다시 축소 및 흐릿하게 전환 (배경으로 이동)

**실패 시**:
- **Conversation 포커싱**: 
  - 실패 시 Conversation이 자동으로 포커싱됨
  - 높이 증가, 선명도 증가
  - 에러 메시지 표시: Message 컴포넌트에 "작업 중 오류가 발생했습니다: [에러 메시지]" 표시
  - 예: "블럭 생성 권한이 없습니다"
- **UI 반응**: 
  - 입력창 활성화 (재시도 가능)
  - 실패한 툴 호출 Task 컴포넌트에 표시
- **다음 액션**: 
  - 사용자가 발화를 수정하여 재시도
  - Conversation은 일정 시간 후 다시 축소 및 흐릿하게 전환

**타임아웃 시**:
- **Conversation 포커싱**: 
  - 타임아웃 시 Conversation이 자동으로 포커싱됨
  - 높이 증가, 선명도 증가
  - 경고 메시지 표시: Message 컴포넌트에 "작업 시간이 초과되었습니다. 작업을 나눠서 요청해주세요." 표시
  - 실행된 툴 호출 요약: Task 컴포넌트에 "블럭 2개 생성 완료" (부분 완료 표시)
- **UI 반응**: 
  - 입력창 활성화
- **다음 액션**: 
  - 사용자가 작업을 나눠서 재요청
  - Conversation은 일정 시간 후 다시 축소 및 흐릿하게 전환

**Agent Loop 초과 시**:
- **Conversation 포커싱**: 
  - 루프 초과 시 Conversation이 자동으로 포커싱됨
  - 높이 증가, 선명도 증가
  - 경고 메시지 표시: Message 컴포넌트에 "너무 복잡한 작업입니다. 작업을 나눠서 요청해주세요." 표시
  - 루프 횟수: Task 컴포넌트에 "10회 실행 완료" 표시
- **UI 반응**: 
  - 입력창 활성화
- **다음 액션**: 
  - 사용자가 작업을 단순화하여 재요청
  - Conversation은 일정 시간 후 다시 축소 및 흐릿하게 전환

**권한 부족**:
- **Conversation 포커싱**: 
  - 권한 부족 시 Conversation이 자동으로 포커싱됨
  - 높이 증가, 선명도 증가
  - 에러 메시지 표시: Message 컴포넌트에 "이 작업을 수행할 권한이 없습니다" 표시
- **UI 반응**: 
  - 입력창 활성화

---

## 📍 Scenario 2: Agent 툴 실행 - 실시간 피드백

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 2, 3 in `02-process-model.md`
- **사용자 목표**: Agent가 툴을 호출할 때 실시간으로 상태를 확인하고, 결과를 즉시 확인
- **주요 제약**: 
  - 툴 실행은 Agent가 자율적으로 결정
  - 사용자는 중간 개입 불가 (액션칩 없음)

---

### Screen 1: Conversation 내 툴 호출 실시간 표시

**화면 구성**:
- **Conversation**: Screen 2 (Agent 실행 중)의 Conversation 컴포넌트와 동일
- **툴 호출 목록**: Conversation 내부에서 Agent가 실행 중인 툴 실시간 표시

**UI 컴포넌트**:
- **Task 컴포넌트** (`task.tsx`)
  - **툴 호출 아이템**: 각 툴 호출을 Task 컴포넌트로 표시
  - 툴 이름: "addBlock", "connectBlocks", "searchByKeyword" 등
  - 상태 아이콘: ⏳ (실행 중, Shimmer 애니메이션), ✓ (완료), ✗ (실패)
  - 실행 시간: "1.2초"
  - 파라미터 요약: TaskContent에 "blockType: markdown, content: ..." 표시
  - 결과 요약: TaskContent에 "블럭 생성 완료 (ID: block-123)" 표시
  - Collapsible: 기본적으로 펼쳐져 있음, 클릭하여 접기/펼치기 가능

- **Message 컴포넌트** (`message.tsx`)
  - 툴 호출 결과를 Message 컴포넌트 내부에 표시
  - 실패한 툴 호출 에러 메시지 표시

**인터랙션**:
- Conversation 호버 → 높이 증가, 선명도 증가 (툴 호출 상세 정보 확인)
- Conversation 호버 해제 → 높이 축소, 흐릿하게 전환 (요약만 표시)
- Task 컴포넌트 클릭 → 툴 호출 상세 정보 펼침/접기
- 실패한 툴 호출 → Message 컴포넌트에 에러 메시지 표시

**애니메이션**:
- Task 추가 시 슬라이드 인 (200ms)
- Task 상태 변경 시 페이드 인/아웃 (150ms)
- Task 펼침/접기: slide-in-from-top-2 애니메이션
- Shimmer 애니메이션: 툴 실행 중 상태 표시
- Conversation 호버 시 높이 증가 및 선명도 증가 (300ms)

---

### Screen 2: 캔버스 자동 업데이트

**화면 구성**:
- **캔버스**: Agent가 생성/수정한 블럭 실시간 표시
- **Conversation**: 일시적 정보 표시 (호버 시에만 상세 확인)
- **선택 상태**: 새로 생성된 블럭 자동 선택 (옵션)

**UI 컴포넌트**:
- **블럭**: Agent가 생성한 블럭 즉시 표시 (영구적 데이터)
- **엣지**: Agent가 연결한 엣지 즉시 표시 (영구적 데이터)
- **하이라이트**: 새로 생성된 블럭에 하이라이트 효과 (3초간)

**철학 반영**:
- **"메시지는 휘발되고 데이터는 캔버스에 남는다"**
  - Conversation: 일시적 정보 (Agent 추론, 툴 호출 상태)
  - 캔버스: 영구적 데이터 (생성/수정된 블럭, 연결된 엣지)
  - 사용자는 Conversation을 보지 않아도 캔버스에서 결과 확인 가능

**인터랙션**:
- 자동 업데이트 → 사용자 인터랙션 없음
- 새 블럭 생성 → 캔버스 자동 스크롤 (옵션)
- Conversation 호버 → 툴 호출 상세 확인 (일시적)

**애니메이션**:
- 블럭 생성 시 페이드 인 + 스케일 애니메이션 (300ms)
- 엣지 연결 시 그리기 애니메이션 (500ms)

---

## 📍 Scenario 3: Agent 실행 실패 처리

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 5 in `02-process-model.md`
- **사용자 목표**: Agent 실행 실패 시 명확한 피드백 받고 복구
- **주요 제약**: 
  - 툴 실행 실패 시 Agent가 자율적으로 재시도 또는 다른 액션 선택
  - 사용자는 최종 실패 시에만 알림 받음

---

### Screen 1: 툴 실행 실패 피드백

**화면 구성**:
- **에러 Toast**: 툴 실행 실패 즉시 표시 (3초간)
- **툴 호출 목록**: 실패한 툴 호출에 ✗ 아이콘 표시
- **Agent 재시도**: Agent가 자동으로 재시도하거나 다른 액션 선택

**UI 컴포넌트**:
- **에러 Toast** (Toast)
  - 메시지: "블럭 생성 실패: 권한이 없습니다"
  - 액션 버튼: "자세히 보기" (옵션)
- **실패한 툴 호출** (List Item)
  - ✗ 아이콘 (빨간색)
  - 에러 메시지: "권한 부족"
  - 재시도 횟수: "1/3회 재시도"

**인터랙션**:
- 에러 Toast 클릭 → 에러 상세 다이얼로그 표시 (옵션)
- 실패한 툴 호출 클릭 → 에러 메시지 및 파라미터 표시

**Agent 자동 복구**:
- **재시도 가능**: Agent가 자동으로 재시도 (최대 3회)
- **대안 액션**: Agent가 다른 방법으로 작업 수행 시도
- **최종 실패**: 사용자에게 실패 알림 및 재요청 유도

---

### Screen 2: 최종 실패 시 재시도 유도

**화면 구성**:
- **에러 메시지**: 최종 실패 이유 명확히 표시
- **재시도 버튼**: 동일한 발화로 재실행
- **발화 수정 제안**: AI가 제안하는 수정 사항 (옵션)

**UI 컴포넌트**:
- **에러 다이얼로그** (Modal)
  - 제목: "작업 실패"
  - 메시지: "[상세 에러 메시지]"
  - 실패한 툴 호출 목록
  - 재시도 버튼: "다시 시도"
  - 수정 버튼: "발화 수정"

**인터랙션**:
- 재시도 버튼 클릭 → 동일한 발화로 Agent 재실행
- 수정 버튼 클릭 → 입력창에 이전 발화 복원 (수정 가능)
- 취소 버튼 클릭 → 다이얼로그 닫기

---

## 📱 반응형 고려사항

### 데스크톱 (> 1024px)
- **레이아웃**: AI 입력창 우측 사이드바 또는 하단 고정
- **툴 호출 목록**: 우측 패널에 실시간 표시
- **대화 이력**: 좌측 사이드바 또는 모달
- **인터랙션**: 키보드 단축키 (Cmd/Ctrl + K)

### 태블릿 (768px ~ 1024px)
- **레이아웃**: AI 입력창 하단 고정 (전체 너비)
- **툴 호출 목록**: 입력창 상단에 접을 수 있는 패널
- **대화 이력**: 모달 또는 슬라이드 인 패널
- **인터랙션**: 터치 스와이프로 대화 이력 열기/닫기

### 모바일 (< 768px)
- **레이아웃**: AI 입력창 하단 고정 (Bottom Sheet)
- **툴 호출 목록**: 입력창 위에 스크롤 가능한 목록
- **대화 이력**: 전체 화면 모달
- **인터랙션**: 
  - Bottom Sheet 상단 드래그로 펼침/접기
  - 스와이프 제스처로 대화 이력 탐색

---

## 🎨 디자인 시스템 참조

### UI 컴포넌트 라이브러리
- **Radix UI**: Accessible한 기본 컴포넌트 (Dialog, Toast, Accordion)
- **Tailwind CSS**: 스타일링
- **Framer Motion**: 애니메이션

### 색상
- **Primary**: Agent 실행 중 스피너, 전송 버튼
- **Success**: 성공 Toast, 완료된 툴 호출 (녹색)
- **Error**: 실패 Toast, 실패한 툴 호출 (빨간색)
- **Warning**: 타임아웃 Toast (주황색)
- **Neutral**: 입력창 배경, 툴 호출 목록

### 타이포그래피
- **발화 입력**: 16px, Regular
- **상태 메시지**: 14px, Medium
- **툴 호출 목록**: 13px, Regular
- **에러 메시지**: 14px, Medium

### 스페이싱
- **입력창 패딩**: 12px
- **툴 호출 아이템 간격**: 8px
- **Toast 여백**: 16px

---

## 🔗 다음 단계

### Frontend Specification
이 User Flow를 기반으로 프론트엔드 개발자는 다음 작업을 수행합니다:

1. **React 컴포넌트 설계**: 
   - AIInputPanel (입력창)
   - AgentStatusIndicator (실행 상태 표시)
   - ToolCallList (툴 호출 목록)
   - ConversationHistory (대화 이력)

2. **Vercel AI SDK 통합**: 
   - useChat Hook으로 Agent 실행
   - Server Actions로 Backend Agent 호출
   - 실시간 스트리밍 응답 처리

3. **상태 관리**: 
   - Agent 실행 상태 (idle, running, completed, error)
   - 툴 호출 목록 (실시간 업데이트)
   - Event Log 조회 및 캐싱

4. **Canvas 통합**: 
   - Agent가 생성한 블럭 자동 표시
   - 선택 블럭 및 주변 블럭 계산하여 Backend 전달
   - 캔버스 자동 스크롤 및 하이라이트

**참조**: `04-frontend-specification.md`

---

## 📋 문서 변경 이력

### v1.0 (2025-11-12)
- 초안 작성
- Scenario 1~4 화면 흐름 정의
- Vercel AI Agent 기반 인터랙션 정의
- 실시간 툴 호출 피드백 정의
- 대화 이력 조회 UI 정의

---

## 📚 참조 자료

### Process Model
- [Scenario 1: 사용자 발화 입력 → Agent 자율 실행](./02-process-model.md#scenario-1)
- [Scenario 2: Agent 툴 실행 - 캔버스 조작](./02-process-model.md#scenario-2)
- [Scenario 3: Agent 툴 실행 - 캔버스 검색](./02-process-model.md#scenario-3)
- [Scenario 5: Agent 실행 실패 처리](./02-process-model.md#scenario-5)

### Software Design
- [Event Log Aggregate](./03-software-design.md#event-log-aggregate)
- [Context Assembly Service](./03-software-design.md#context-assembly-service)
- [AI Query Handler](./03-software-design.md#ai-query-handler)

### 디자인 시스템
- Radix UI Documentation
- Tailwind CSS Documentation
- Framer Motion Documentation

---

*이 User Flow를 기반으로 직관적이고 반응성 높은 AI Agent 인터페이스를 구현할 수 있습니다! 🤖*

