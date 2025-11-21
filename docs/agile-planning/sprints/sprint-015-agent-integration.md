# Sprint 015: Agent Integration

## 🎯 Sprint 개요
**목표**: 2주 동안 AIQueryHandler, Server API Route, Frontend Hook 및 UI 컴포넌트를 구현하여 AI Agent의 End-to-End 플로우를 완성한다

**기간**: 2025-11-26 (화) ~ 2025-12-09 (월) (2주)  
**팀**: 시니어 개발자 1명 + 주니어 개발자 1명  
**Sprint 유형**: Implementation Sprint  
**Story Points**: 34pts  

## 📋 포함 Story

### Story AI-001: AI Agent 기반 자연어 작업 자동화 (Phase 3: 34pts)

**Phase 3: Agent Integration (34pts)**
- AIQueryHandler 구현 (13pts)
- Server API Route 구현 (8pts)
- Frontend Hook 구현 (8pts)
- AIAgentRunner 컴포넌트 구현 (5pts)

**참조 문서**: [Story AI-001](../stories/ai-management/story-ai-001-agent-based-automation.md)

---

## 📅 Sprint 일정

### Week 1 (2025-11-26 ~ 2025-12-02)

#### 화요일 (11/26)
- Sprint Planning 회의 (1.5시간)
- AIQueryHandler 설계 검토
- Use Case 조율 로직 설계

#### 수요일 (11/27)
- AIQueryHandler 구현 시작
- 발화 처리 플로우 구현
- ContextAssemblyService 통합

#### 목요일 (11/28)
- Vercel AI SDK 통합 (`streamText`)
- Agent Loop 관리 (maxSteps: 10)
- 타임아웃 처리 (30초)

#### 금요일 (11/29)
- 이벤트 로깅 오케스트레이션
- AIQueryHandler 통합 테스트 작성
- Week 1 진행 상황 검토

---

### Week 2 (2025-12-02 ~ 2025-12-09)

#### 월요일 (12/02)
- `/api/agent/route.ts` 구현 시작
- Client Context 추출 (metadata에서)
- System Prompt 빌더 구현

#### 화요일 (12/03)
- 툴 스키마 정의 (`inputSchema`, execute 없음)
- Vercel AI SDK 통합 검증
- Server API Route 테스트

#### 수요일 (12/04)
- `useAIAgent` Hook 구현 (`useChat` 래핑)
- `onToolCall` 구현
- `addToolOutput` 구현

#### 목요일 (12/05)
- Client Context 수집 및 전달 로직
- AIAgentRunner 컴포넌트 구현
- Conversation UI 연동

#### 금요일 (12/06)
- Message/Task/Tool 컴포넌트 렌더링
- 실시간 상태 표시 구현
- Frontend 통합 테스트

#### 월요일 (12/09)
- E2E 테스트 작성 및 실행
- 버그 수정 및 최적화
- Sprint 015 완료 및 회고

---

## 📋 상세 Task 목록

### Phase 3: Agent Integration (34pts)

#### AIQueryHandler 구현 (13pts)
- [ ] **Service 인터페이스**: AIQueryHandler 인터페이스 정의 (1pt)
- [ ] **발화 처리 플로우**: handleUserUtterance() 구현 (2pts)
  - 발화를 Event Log에 저장
  - ContextAssemblyService 호출
- [ ] **Vercel AI SDK 통합**: streamText() 호출 (3pts)
  - LLM 모델 설정 (OpenAI gpt-4-turbo)
  - System Prompt 전달
  - messages 변환 (convertToModelMessages)
- [ ] **Agent Loop 관리**: maxSteps 제한 (2pts)
  - 최대 10회 루프
  - 루프 카운트 추적
  - 초과 시 강제 종료
- [ ] **타임아웃 처리**: 30초 타임아웃 (1pt)
- [ ] **툴 호출 조율**: ToolExecutionService 연동 (2pts)
- [ ] **AI 응답 로깅**: AI 응답을 Event Log에 저장 (1pt)
- [ ] **에러 처리**: Agent 실행 중 에러 처리 (1pt)

#### Server API Route 구현 (8pts)
- [ ] **/api/agent/route.ts 생성**: Next.js API Route 구현 (1pt)
- [ ] **Client Context 추출**: metadata에서 pageId, selectedBlockIds, visibleBlockIds 추출 (1pt)
- [ ] **System Prompt 빌더**: buildSystemPrompt() 구현 (2pts)
  - Short-Term Memory, Long-Term Memory, Canvas Context 포함
  - 선택 블럭, 주변 블럭 정보 포함
  - 툴 사용 가이드라인 포함
- [ ] **툴 스키마 정의**: tools 객체 정의 (2pts)
  - addBlock, deleteBlock, updateProperty, connectBlocks, executeBlockAction
  - searchByHop, searchByKeyword, searchBlockActions
  - inputSchema (Zod 스키마)
  - execute 없음 (클라이언트에서 처리)
- [ ] **Stream 반환**: toUIMessageStreamResponse() (1pt)
- [ ] **에러 처리**: API Route 에러 처리 (1pt)

#### Frontend Hook 구현 (8pts)
- [ ] **useAIAgent Hook 생성**: useChat 래핑 (1pt)
- [ ] **onToolCall 구현**: 툴 호출 처리 (3pts)
  - ToolExecutionService 호출
  - 툴 실행 결과 파싱
  - addToolOutput 호출
- [ ] **addToolOutput 구현**: 툴 결과 전달 (1pt)
  - 성공 시: { tool, toolCallId, output }
  - 실패 시: { tool, toolCallId, state: 'output-error', errorText }
- [ ] **Client Context 수집**: ClientContext DTO 구성 (2pts)
  - pageId, workspaceId, organizationId
  - selectedBlockIds, visibleBlockIds, recentlyModifiedBlockIds
  - 프론트엔드에서 이미 계산된 블럭 ID만 전달
- [ ] **에러 처리**: Hook 에러 처리 및 재시도 (1pt)

#### AIAgentRunner 컴포넌트 구현 (5pts)
- [ ] **AIAgentRunner 컴포넌트 생성**: 기본 구조 (1pt)
- [ ] **Conversation UI 연동**: conversation.tsx 연동 (1pt)
  - 호버 시 높이 증가, 선명도 증가
  - 호버 해제 시 축소, 흐릿하게 표시
- [ ] **Message 렌더링**: message.parts 사용 (1pt)
  - 사용자 발화 표시
  - AI 응답 표시
- [ ] **Task/Tool 렌더링**: Task 컴포넌트로 툴 호출 표시 (1pt)
  - "⏳ 툴명 실행 중" 상태 표시
  - "✓ 툴명 완료" 완료 상태 표시
- [ ] **실시간 상태 표시**: Shimmer 애니메이션 (1pt)
  - "Thinking..." 표시
  - Reasoning 컴포넌트 연동

---

## 🔗 의존성 및 리스크

### 의존성
- **선행 Sprint**: Sprint 014 (AI Foundation) 완료 필수
  - EventLogRepository
  - MemorySearchService
  - ContextAssemblyService
  - ToolExecutionService
- **외부 라이브러리**: Vercel AI SDK (`ai` 패키지, `@ai-sdk/openai`)
- **UI 컴포넌트**: Conversation, Message, Task, Tool, Reasoning 컴포넌트 (기존)

### 리스크

#### 기술적 리스크
1. **Vercel AI SDK 학습 곡선**
   - **리스크**: 새로운 SDK의 API 이해 및 통합에 시간 소요
   - **대응**: 사전 학습, PoC 구현, 공식 문서 참조
   - **우선순위**: High

2. **Server Reasoning + Client Execution 아키텍처**
   - **리스크**: 서버와 클라이언트 간 툴 실행 조율 복잡도
   - **대응**: 명확한 프로토콜 정의, 에러 처리 강화, 디버깅 로그 추가
   - **우선순위**: High

3. **Agent Loop 무한 루프 위험**
   - **리스크**: Agent가 무한 루프에 빠질 가능성
   - **대응**: maxSteps 제한 (10회), 타임아웃 설정 (30초), 강제 종료 로직
   - **우선순위**: Medium

#### 일정 리스크
1. **Vercel AI SDK 통합 지연**
   - **리스크**: API 이해 부족으로 통합 지연 가능
   - **대응**: Week 1에 집중 학습 및 PoC 구현
   - **우선순위**: High

2. **UI 컴포넌트 통합 복잡도**
   - **리스크**: Conversation UI 호버 동작, 실시간 상태 표시 구현 복잡도
   - **대응**: 기존 컴포넌트 재사용, 단계적 구현
   - **우선순위**: Medium

---

## 🎯 완료 기준 (Definition of Done)

### 기능적 완료
- [ ] **AIQueryHandler**: 발화 처리 → Agent 실행 → 응답 로깅 플로우 정상 동작
- [ ] **Server API Route**: Client Context 추출 → System Prompt 빌더 → Agent 실행
- [ ] **Frontend Hook**: 툴 호출 → 툴 실행 → 결과 전달 정상 동작
- [ ] **AIAgentRunner**: Conversation UI, Message/Task/Tool 렌더링 정상 동작
- [ ] **End-to-End 플로우**: 사용자 발화 → Agent 실행 → 블럭 생성 정상 동작

### 기술적 완료
- [ ] **단위 테스트**: AIQueryHandler, useAIAgent Hook (커버리지 85% 이상)
- [ ] **통합 테스트**: Server API Route, Frontend Hook 통합 테스트 통과
- [ ] **E2E 테스트**: 
  - 사용자 발화 → Agent 실행 → 블럭 생성 플로우
  - Agent Loop 제한 시나리오
  - 타임아웃 시나리오
- [ ] **성능 요구사항**: 
  - 평균 응답 시간 < 5초
  - Agent Loop 최대 10회
  - 타임아웃 30초
- [ ] **코드 리뷰**: 시니어 개발자 승인 완료

### 품질 완료
- [ ] **Agent Loop 제한**: maxSteps 10회, 타임아웃 30초 적용
- [ ] **에러 처리**: 
  - Agent Loop 초과 시 명확한 메시지
  - 타임아웃 시 현재까지 작업 결과 표시
  - 툴 실행 실패 시 명확한 에러 메시지
- [ ] **UI/UX**: 
  - Conversation 호버 동작 구현
  - 실시간 상태 표시 (Thinking, 툴 실행 중, 완료)
  - Message/Task/Tool 컴포넌트 렌더링
- [ ] **보안 취약점**: 0개
- [ ] **접근성**: 키보드 포커스, 스크린 리더 지원

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **11/26 (화)**: Sprint Planning 완료, AIQueryHandler 설계
- [ ] **11/27 (수)**: AIQueryHandler 구현 시작
- [ ] **11/28 (목)**: Vercel AI SDK 통합
- [ ] **11/29 (금)**: AIQueryHandler 완료 + Week 1 검토
- [ ] **12/02 (월)**: Server API Route 구현
- [ ] **12/03 (화)**: 툴 스키마 정의 + API Route 완료
- [ ] **12/04 (수)**: useAIAgent Hook 구현
- [ ] **12/05 (목)**: AIAgentRunner 컴포넌트 구현
- [ ] **12/06 (금)**: Frontend 통합 테스트
- [ ] **12/09 (월)**: E2E 테스트 + Sprint 회고

### 주간 체크포인트
- [ ] **Week 1 종료 (11/29)**: AIQueryHandler + Server API Route 완료
  - AIQueryHandler 구현 완료
  - Server API Route 구현 진행 중
  - 통합 테스트 작성 시작
- [ ] **Week 2 종료 (12/09)**: Frontend Hook + UI 컴포넌트 완료
  - useAIAgent Hook 구현 완료
  - AIAgentRunner 컴포넌트 구현 완료
  - E2E 테스트 통과
  - Sprint 015 목표 달성

---

## 📁 관련 문서

### Epic & Story
- [Epic 004: Basic AI Context Engineering](../epics/epic-004-basic-ai-context-engineering.md)
- [Story AI-001: AI Agent 기반 자연어 작업 자동화](../stories/ai-management/story-ai-001-agent-based-automation.md)

### Domain Documentation
- [AI Management Domain - Software Design](../../event-domain-design/domains/ai-management-domain/03-software-design.md)
- [AI Management Domain - Technical Specification](../../event-domain-design/domains/ai-management-domain/04-technical-specification.md)
- [AI Management Domain - Frontend Specification](../../event-domain-design/domains/ai-management-domain/04-frontend-specification.md)
- [AI Management Domain - User Flow](../../event-domain-design/domains/ai-management-domain/03-user-flow.md)
- [Basic AI Context Engineering 설계](../../event-domain-design/discussion/ai-automation/basic-ai-context-engineering.md)

### Previous Sprint
- [Sprint 014: AI Foundation](./sprint-014-ai-foundation.md)

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

- **Vercel AI SDK 학습**: Week 1에 집중 학습 및 PoC 구현 필요
- **Agent Loop 테스트**: 무한 루프 방지를 위한 철저한 테스트 필요
- **UI 컴포넌트**: 기존 Conversation, Message, Task, Tool 컴포넌트 재사용
- **페어 프로그래밍**: Vercel AI SDK 통합 시 페어 프로그래밍 권장

---

**Sprint 015 시작일**: 2025-11-26 (화)  
**Sprint 015 종료일**: 2025-12-09 (월)  
**다음 Sprint**: Sprint 016 - Testing & Polish

