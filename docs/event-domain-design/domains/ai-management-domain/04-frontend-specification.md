# Frontend Specification: AI Management Domain

## 🎯 개요

**도메인**: AI Management Domain  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-11-12  
**버전**: v1.0

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**설계 회의록 참조**: `basic-ai-context-engineering.md`  
**다음 단계**: 프론트엔드 구현 (TDD)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Vercel AI SDK 통합, Components 정의

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

AI Management Domain은 **Vercel AI SDK 기반 Agent**를 활용하여 사용자 발화를 자연어로 입력받고, Agent가 자율적으로 Canvas 조작 및 Block 액션을 실행하는 시스템입니다. **Server Reasoning + Client Execution** 하이브리드 아키텍처를 사용하며, Conversation UI로 Agent 실행 과정을 실시간 표시합니다.

### User Flow 연결점

- **입력**: `03-user-flow.md` - 3개 주요 화면 흐름
  - Scenario 1: 사용자 발화 입력 → Agent 자율 실행
  - Scenario 2: Agent 툴 실행 - 실시간 피드백
  - Scenario 3: Agent 실행 실패 처리
- **입력**: `03-software-design.md` - AI Query Handler, Context Assembly Service, Event Log Aggregate
- **입력**: `basic-ai-context-engineering.md` - Vercel AI Agent 아키텍처, 컨텍스트 전달 전략, 툴 시스템
- **출력**: React 컴포넌트 (Conversation, Message, Reasoning, Task 등), Hooks (useChat 기반), Server API Route

### 핵심 설계 원칙

- **Server Reasoning + Client Execution**: LLM 추론은 서버, 툴 실행은 클라이언트 (`onToolCall` 및 `addToolOutput`)
- **Context 없음**: Canvas Management Domain과 동일하게 Props 전달 방식 사용
- **Vercel AI SDK 중심**: `useChat` Hook (`@ai-sdk/react`)으로 Agent 실행, `streamText`로 Server Reasoning
- **컨텍스트 전달 전략**: `sendMessage`의 `metadata` 필드로 Client Context 전달, 서버에서 Server Context 조립
- **Conversation UI**: 일시적 정보 표시 (호버 시 상세, 평상시 축소/흐릿)
- **캔버스 영구성**: "메시지는 휘발되고 데이터는 캔버스에 남는다"
- **Agent Loop**: 최대 10회, 타임아웃 30초, Vercel AI SDK `maxSteps` 및 `sendAutomaticallyWhen`으로 자동 관리
- **Optimistic Update**: Agent 실행 중 즉각적 UI 반응, 백그라운드 동기화

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. Vercel AI SDK 내장 타입 사용

**핵심 원칙**: 메시지는 휘발적이며 클라이언트에서만 관리되므로, 서버에서 대화를 불러올 필요가 없습니다.

**Vercel AI SDK 내장 타입 사용**:
- **Message**: `useChat` Hook의 `messages` 배열에서 제공되는 타입 사용
  - `role`: 'user' | 'assistant' | 'system'
  - `content`: string
  - `parts`: MessagePart[] (텍스트, 툴 호출 등)
- **ToolCall**: `message.parts`에서 제공되는 툴 호출 정보 사용
  - `toolCallId`: string
  - `toolName`: string
  - `input`: Record<string, any>
  - `state`: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
- **ToolResult**: `addToolOutput`으로 추가된 결과는 `message.parts`에서 자동 관리됨

**설계 이유**:
- ✅ **휘발성**: 새로고침 시 메시지가 사라지므로 서버에서 불러올 필요 없음
- ✅ **클라이언트 관리**: `useChat` Hook이 메시지 상태를 자동 관리
- ✅ **타입 안전성**: Vercel AI SDK의 내장 타입 사용으로 타입 안전성 보장
- ✅ **단순성**: 불필요한 DTO 정의 제거로 코드 단순화

**참고**: Event Log는 서버에서 저장되지만, 프론트엔드에서 불러오지 않습니다. Long-Term Memory 검색 시에만 서버에서 사용됩니다.

---

### 2. DTO 인터페이스 (필요한 것만)

#### ClientContext DTO

- **파일 위치**: `src/domains/ai-management/shared/dtos/index.ts`
- **역할**: 클라이언트에서 서버로 전달하는 컨텍스트 정보
- **주요 속성**:
  - pageId: string (필수)
  - workspaceId: string (필수)
  - organizationId: string (필수)
  - selectedBlockIds: string[] (선택된 블럭 ID 배열)
  - visibleBlockIds: string[] (현재 화면에 보이는 블럭들, 프론트엔드에서 이미 계산됨)
  - recentlyModifiedBlockIds: string[] (최근 수정한 블럭들)
- **특징**: 
  - `sendMessage`의 `metadata` 필드로 서버에 전달
  - ⚠️ **설계 원칙**: 프론트엔드에서 이미 계산된 블럭 ID만 전달
  - 서버는 전달받은 블럭 ID로 직접 조회하여 컨텍스트 조립
  - 사용자 의도는 `selectedBlockIds`, `visibleBlockIds`, `recentlyModifiedBlockIds`로 충분히 전달됨

**사용 위치**:
- `useAIAgent` Hook: 메시지 전송 시 컨텍스트 수집 및 전달
- Server API Route: 전달받은 블럭 ID로 컨텍스트 조립

---

#### Request DTOs

- **파일 위치**: `src/domains/ai-management/shared/dtos/index.ts`
- **역할**: Server API Route에 전달되는 입력 데이터 구조 정의
- **SendMessageRequest**:
  - text: string (필수, 사용자 발화)
  - metadata: ClientContext (필수, 클라이언트 컨텍스트)
- **특징**: 
  - Vercel AI SDK의 `useChat` Hook (`@ai-sdk/react`)과 호환
  - `sendMessage({ text, metadata })` 형태로 사용
  - `metadata` 필드로 ClientContext 전달
  - ⚠️ **참고**: Vercel AI SDK가 내부적으로 `UIMessage[]` 형태로 변환하여 서버에 전달

**사용 위치**:
- `useAIAgent` Hook: 메시지 전송 시 컨텍스트 수집 및 전달
- Server API Route: `messages` 배열에서 첫 번째 사용자 메시지의 `metadata` 추출

---

### 2. Result 패턴

- **파일 위치**: `src/domains/ai-management/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴
- **주요 속성**:
  - success: boolean (성공 여부)
  - data?: T (성공 시 데이터)
  - error?: E (실패 시 에러)
- **주요 메서드**:
  - isSuccess(): 성공 여부 확인
  - isError(): 실패 여부 확인
- **특징**: try-catch 대신 함수형 에러 처리 패턴 사용

**사용 예시**:
- Server API Route의 반환값으로 사용
- 에러를 명시적으로 처리하여 타입 안전성 확보
- 성공/실패 시나리오를 명확히 분리

---

## 🎯 컴포넌트 설계 (Props 전달 방식)

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계  
> **Canvas Domain 참조**: Canvas Management Domain은 Context 없이 Props 전달 방식 사용  
> **Block Domain 참조**: Block Management Domain도 Context 없이 Props 전달 방식 사용

### 핵심 원칙

AI Management Domain은 **Canvas Management Domain 및 Block Management Domain과 동일하게 Context 없는 Props 전달 방식**을 사용합니다.

1. **Vercel AI SDK = SSOT**: Agent 상태는 `useChat` Hook이 관리
2. **Props 전달**: Context 없이 Props를 통한 데이터 전달로 단순화
3. **Conversation UI**: 일시적 정보 표시, 호버 시 상세 확인
4. **캔버스 영구성**: 실제 결과는 캔버스에 저장

### Context 불필요 분석

**AIManagementContext 불필요**:
- ❌ `messages`: `useChat` Hook이 관리
- ❌ `isAgentRunning`: `useChat`의 `isLoading` 사용
- ❌ `error`: Toast 또는 로컬 상태로 처리
- ❌ `conversationId`: Props로 전달
- ❌ `agentStatus`: `useChat`의 상태 직접 사용

**최종 구조**:
- ✅ Vercel AI SDK의 `useChat` Hook 활용
- ✅ Props를 통한 데이터 전달 (conversationId, pageId 등)
- ✅ Hook에서 직접 Server API Route 호출
- ✅ Conversation은 호버 상태에 따라 렌더링

---

## 🪝 Custom Hooks 설계

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계  
> **Vercel AI SDK 참조**: `useChat` Hook 및 `onToolCall` (최신 API)

AI Management Domain의 Hook은 **Vercel AI SDK의 `useChat` Hook을 래핑**하여 Agent 실행 및 툴 실행을 처리합니다.

### 1. useAIAgent Hook (useChat 래핑)

#### useAIAgent

- **파일 위치**: `src/domains/ai-management/frontend/hooks/use-ai-agent.ts`
- **역할**: Vercel AI SDK의 `useChat` Hook을 래핑하여 Agent 실행 및 툴 실행 처리
- **주요 기능**:
  - Agent 실행: `useChat` Hook (`@ai-sdk/react`)으로 Server API Route 호출
  - 툴 실행: `onToolCall`로 클라이언트에서 툴 실행 후 `addToolOutput`으로 결과 추가 (Canvas & Block Actions 연동)
  - 컨텍스트 수집: Canvas Store에서 선택 블럭, 뷰포트 등 수집
  - Agent 상태: `isLoading`, `error` 등 상태 관리
  - 자동 전송: `sendAutomaticallyWhen`으로 모든 툴 결과 준비 시 자동으로 다음 iteration 시작
- **제공 메서드**:
  - `sendMessage(text, metadata)`: 사용자 발화 전송 (비동기, `metadata`로 컨텍스트 전달)
  - `messages`: 메시지 배열 (Vercel AI SDK 제공, `message.parts` 사용)
  - `isAgentRunning`: Agent 실행 중 여부 (isLoading)
  - `error`: 에러 상태 (Vercel AI SDK 제공)
  - `addToolOutput`: 툴 실행 결과 추가
- **의존성**: 
  - Vercel AI SDK (`@ai-sdk/react`의 `useChat` Hook)
  - `DefaultChatTransport`: 채팅 전송을 위한 transport 설정
  - Canvas Store (선택 블럭, 뷰포트 수집)
  - Block Actions Hook (툴 실행용)
- **특징**:
  - **Server Reasoning + Client Execution**: 서버는 LLM 추론만, 클라이언트는 툴 실행
  - **onToolCall**: 툴 실행 인터셉트하여 Canvas & Block Actions 직접 호출
  - **addToolOutput**: 툴 실행 결과를 `toolCallId`와 함께 추가 (await 없이 - 데드락 방지)
  - **sendAutomaticallyWhen**: `lastAssistantMessageIsCompleteWithToolCalls`로 모든 툴 결과 준비 시 자동 전송
  - **metadata**: `sendMessage`의 `metadata` 필드로 Client Context 전달
  - **기존 Hook 재사용**: `useBlockActions`, `useCanvasBlockLifecycle` 등 기존 Hook 활용
  - **에러 처리**: `addToolOutput`에 `state: 'output-error'` 및 `errorText` 사용

**사용 시나리오**:
- AIAgentRunner: Agent 실행 및 메시지 관리
- PromptInput: 사용자 발화 입력
- Conversation: 메시지 목록 표시

**구현 패턴** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { 
  DefaultChatTransport, 
  lastAssistantMessageIsCompleteWithToolCalls 
} from 'ai';
import { useBlockActions } from '@/hooks/use-block-actions';
import { useCanvasStore } from '@/stores/canvas-store';

export function useAIAgent({ pageId, workspaceId, organizationId }: UseAIAgentProps) {
  const blockActions = useBlockActions();
  const canvasStore = useCanvasStore();
  
  const { messages, sendMessage, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
    
    // ✅ 모든 툴 결과가 준비되면 자동으로 다음 iteration 시작
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    // ✅ 클라이언트에서 툴 실행
    async onToolCall({ toolCall }) {
      // 동적 툴 체크 (TypeScript 타입 가드)
      if (toolCall.dynamic) {
        return;
      }
      
      try {
        switch (toolCall.toolName) {
          case 'addBlock': {
            // ✅ 기존 Canvas 액션 훅 사용!
            const block = await blockActions.addBlock({
              pageId: canvasStore.currentPageId,
              type: toolCall.input.blockType,
              content: toolCall.input.content,
              position: toolCall.input.position,
            });
            
            // ✅ addToolOutput으로 결과 추가 (await 없이 - 데드락 방지)
            addToolOutput({
              tool: 'addBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true, blockId: block.id },
            });
            break;
          }
          
          case 'deleteBlock': {
            await blockActions.deleteBlock(toolCall.input.blockId);
            
            addToolOutput({
              tool: 'deleteBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true },
            });
            break;
          }
          
          case 'connectBlocks': {
            const edge = await blockActions.connectBlocks({
              sourceId: toolCall.input.sourceBlockId,
              targetId: toolCall.input.targetBlockId,
              label: toolCall.input.label,
            });
            
            addToolOutput({
              tool: 'connectBlocks',
              toolCallId: toolCall.toolCallId,
              output: { success: true, edgeId: edge.id },
            });
            break;
          }
          
          // ... 다른 툴들
        }
      } catch (error) {
        // ✅ 에러 처리
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
  
  // ✅ 메시지 전송 시 최신 컨텍스트 포함
  const handleSendMessage = async (text: string) => {
    const currentContext: ClientContext = {
      pageId: canvasStore.currentPageId,
      workspaceId: canvasStore.workspaceId,
      organizationId,
      selectedBlockIds: canvasStore.selectedBlocks.map(b => b.id),
      visibleBlockIds: canvasStore.getVisibleBlockIds(), // 프론트엔드에서 이미 계산됨
      recentlyModifiedBlockIds: canvasStore.getRecentlyModifiedIds(10),
    };
    
    // ✅ metadata로 컨텍스트 전달
    sendMessage({
      text,
      metadata: currentContext,
    });
  };
  
  return {
    sendMessage: handleSendMessage,
    messages,
    isAgentRunning: messages.some(m => m.role === 'assistant' && m.parts.some(p => p.type.startsWith('tool-'))),
    error: null, // 에러는 message.parts에서 확인
    addToolOutput,
  };
}
```

---

### 2. useConversationState Hook

#### useConversationState

- **파일 위치**: `src/domains/ai-management/frontend/hooks/use-conversation-state.ts`
- **역할**: Conversation UI의 호버 상태 및 포커싱 관리
- **주요 기능**:
  - 호버 상태 관리: 마우스 호버 시 높이 증가, 선명도 증가
  - 자동 포커싱: Agent 완료/실패 시 자동으로 포커싱
  - 자동 축소: 일정 시간 후 다시 축소 및 흐릿하게 전환
- **제공 메서드**:
  - `isHovered`: 호버 상태 (boolean)
  - `isFocused`: 포커싱 상태 (boolean)
  - `setHovered(value)`: 호버 상태 설정
  - `focusConversation()`: 수동 포커싱
  - `autoUnfocus()`: 자동 축소 (3초 후)
- **의존성**: 
  - useState, useEffect (React)
- **특징**:
  - **"메시지는 휘발되고 데이터는 캔버스에 남는다"** 철학 반영
  - 호버 시 상세 정보 확인, 평상시 배경으로 이동
  - Agent 완료 시 자동 포커싱하여 결과 확인

**사용 시나리오**:
- Conversation: 호버 및 포커싱 상태 제어
- Message: 애니메이션 트리거

**구현 패턴**:
```typescript
export function useConversationState() {
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);
  
  const focusConversation = () => {
    setFocused(true);
  };
  
  const autoUnfocus = () => {
    setTimeout(() => {
      setFocused(false);
    }, 3000); // 3초 후 자동 축소
  };
  
  return {
    isHovered,
    isFocused,
    setHovered,
    focusConversation,
    autoUnfocus,
  };
}
```

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. AI Agent Runner Component

#### AIAgentRunner

- **파일 위치**: `src/domains/ai-management/frontend/components/ai-agent-runner.tsx`
- **역할**: AI Agent 실행 및 Conversation UI 통합 컴포넌트
- **주요 기능**:
  - Agent 실행: useAIAgent Hook 사용
  - 메시지 표시: Conversation 컴포넌트
  - 입력 처리: PromptInput 컴포넌트
- **Props**:
  - pageId: string (필수)
  - workspaceId: string (필수)
  - organizationId: string (필수)
- **사용 Hook**: 
  - useAIAgent (Agent 실행 및 메시지 관리)
  - useConversationState (Conversation 호버 상태)
- **UI 라이브러리**: Conversation, PromptInput
- **특징**:
  - **통합 컴포넌트**: Agent Runner + Conversation + PromptInput
  - Props로 페이지 정보 전달
  - 에러 처리 및 Toast 알림

**사용 위치**:
- Canvas: 우측 하단 또는 사이드바
- 대화 모드: 전체 화면 모달

**구현 패턴**:
```typescript
export function AIAgentRunner({ pageId, workspaceId, organizationId }: AIAgentRunnerProps) {
  const { sendMessage, messages, isAgentRunning, error } = useAIAgent({ 
    pageId, 
    workspaceId, 
    organizationId 
  });
  const { isHovered, isFocused, setHovered, focusConversation, autoUnfocus } = useConversationState();
  
  // Agent 완료 시 자동 포커싱
  useEffect(() => {
    if (!isAgentRunning && messages.length > 0) {
      focusConversation();
      autoUnfocus();
    }
  }, [isAgentRunning, messages.length]);
  
  return (
    <div className="ai-agent-runner">
      <Conversation 
        messages={messages} 
        isHovered={isHovered}
        isFocused={isFocused}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <PromptInput 
        onSubmit={sendMessage} 
        disabled={isAgentRunning}
      />
      {error && <Toast message={error} />}
    </div>
  );
}
```

---

### 2. Conversation Component

#### Conversation

- **파일 위치**: `packages/ui/src/components/ai-elements/conversation.tsx` (이미 구현됨)
- **역할**: Agent 실행 과정 및 메시지 목록을 표시하는 컨테이너 컴포넌트
- **주요 기능**:
  - 메시지 목록 표시 (Message 컴포넌트)
  - 호버 상태에 따른 높이 및 선명도 조절
  - 자동 스크롤 (새 메시지 추가 시)
- **Props**:
  - messages: MessageView[] (필수)
  - isHovered: boolean (호버 상태)
  - isFocused: boolean (포커싱 상태)
  - onMouseEnter: () => void (호버 시작)
  - onMouseLeave: () => void (호버 종료)
- **UI 라이브러리**: Message, Shimmer
- **특징**:
  - **호버 상태**: 높이 증가, 선명도 증가 (명확하게 표시)
  - **평상시**: 높이 축소, 흐릿하게 표시 (배경으로 이동)
  - **철학**: "메시지는 휘발되고 데이터는 캔버스에 남는다"

**사용 위치**:
- AIAgentRunner: Agent 실행 과정 표시
- Canvas: 우측 하단 또는 사이드바

**애니메이션** (User Flow 기준):
- 높이 변화: 트랜지션 (300ms, ease-out)
- 선명도 변화: opacity 트랜지션 (200ms)
- 메시지 추가 시 슬라이드 인 (200ms)

---

### 3. Message Component

#### Message

- **파일 위치**: `packages/ui/src/components/ai-elements/message.tsx` (이미 구현됨)
- **역할**: 사용자 발화 및 AI 응답을 표시하는 메시지 컴포넌트
- **주요 기능**:
  - 역할별 스타일 구분 (user, assistant, system)
  - 툴 호출 결과 표시 (Task 컴포넌트 사용)
  - 에러 메시지 표시
- **Props**:
  - message: MessageView (필수)
- **UI 라이브러리**: Task, Tool, Shimmer
- **특징**:
  - **사용자 발화**: 우측 정렬, 배경색 구분
  - **AI 응답**: 좌측 정렬, 배경색 구분
  - **툴 호출 목록**: Task 컴포넌트로 표시

**사용 위치**:
- Conversation: 메시지 목록 표시

**구현 패턴** (User Flow 기준):
```typescript
export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={cn('message', isUser && 'user', isAssistant && 'assistant')}>
      <div className="message-content">{message.content}</div>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <Task toolCalls={message.toolCalls} />
      )}
    </div>
  );
}
```

---

### 4. Reasoning Component

#### Reasoning

- **파일 위치**: `packages/ui/src/components/ai-elements/reasoning.tsx` (이미 구현됨)
- **역할**: Agent의 추론 과정을 표시하는 컴포넌트
- **주요 기능**:
  - "Thinking..." 텍스트 (Shimmer 애니메이션)
  - 추론 내용 표시 (Collapsible)
  - 자동 접기 (추론 완료 후 1초 후)
  - 지속 시간 표시 ("Thought for N seconds")
- **Props**:
  - reasoning: string (추론 내용)
  - duration?: number (지속 시간, seconds)
- **UI 라이브러리**: Collapsible, Shimmer
- **특징**:
  - **Shimmer 애니메이션**: 추론 중 로딩 상태 표시
  - **Collapsible**: 클릭하여 펼침/접기
  - **자동 접기**: 추론 완료 후 1초 후 자동으로 접힌다

**사용 위치**:
- Message: Agent 추론 과정 표시

**애니메이션** (User Flow 기준):
- Shimmer 애니메이션: 무한 반복 (2초 duration)
- 펼침/접기: slide-in-from-top-2 애니메이션

---

### 5. Task Component

#### Task

- **파일 위치**: `packages/ui/src/components/ai-elements/task.tsx` (이미 구현됨)
- **역할**: Agent가 실행한 툴 목록을 표시하는 컴포넌트
- **주요 기능**:
  - 툴 호출 목록 표시 (Tool 컴포넌트)
  - 툴 실행 상태 표시 (⏳ 실행 중, ✓ 완료, ✗ 실패)
  - Collapsible: 기본적으로 펼쳐져 있음, 클릭하여 접기/펼치기 가능
- **Props**:
  - toolCalls: ToolCallView[] (필수)
- **UI 라이브러리**: Tool, Collapsible, Shimmer
- **특징**:
  - **툴 실행 상태**: 아이콘으로 구분
  - **Collapsible**: 기본적으로 펼쳐져 있음

**사용 위치**:
- Message: 툴 호출 목록 표시

**애니메이션** (User Flow 기준):
- 추가 시 슬라이드 인 (200ms)
- 상태 변경 시 페이드 인/아웃 (150ms)
- 펼침/접기: slide-in-from-top-2 애니메이션

---

### 6. Tool Component

#### Tool

- **파일 위치**: `packages/ui/src/components/ai-elements/tool.tsx` (이미 구현됨)
- **역할**: 개별 툴 호출 정보를 표시하는 컴포넌트
- **주요 기능**:
  - 툴 이름 표시 (addBlock, deleteBlock 등)
  - 실행 상태 아이콘 (⏳ 실행 중, ✓ 완료, ✗ 실패)
  - 실행 시간 표시 ("1.2초")
  - 파라미터 요약 (Collapsible)
  - 결과 요약 (Collapsible)
- **Props**:
  - toolCall: ToolCallView (필수)
- **UI 라이브러리**: Collapsible, Shimmer, Badge
- **특징**:
  - **실행 중**: Shimmer 애니메이션
  - **완료**: 녹색 ✓ 아이콘
  - **실패**: 빨간색 ✗ 아이콘

**사용 위치**:
- Task: 툴 호출 목록 내 개별 툴

**구현 패턴** (User Flow 기준):
```typescript
export function Tool({ toolCall }: ToolProps) {
  const statusIcon = {
    pending: '⏳',
    executing: '⏳',
    completed: '✓',
    error: '✗',
  }[toolCall.status];
  
  return (
    <div className="tool-call">
      <div className="tool-header">
        <span className="status-icon">{statusIcon}</span>
        <span className="tool-name">{toolCall.toolName}</span>
        {toolCall.executionTime && <span className="execution-time">{toolCall.executionTime}ms</span>}
      </div>
      {toolCall.status === 'executing' && <Shimmer />}
      <Collapsible title="Parameters">
        <pre>{JSON.stringify(toolCall.parameters, null, 2)}</pre>
      </Collapsible>
      {toolCall.result && (
        <Collapsible title="Result">
          <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>
        </Collapsible>
      )}
    </div>
  );
}
```

---

### 7. Shimmer Component

#### Shimmer

- **파일 위치**: `packages/ui/src/components/ai-elements/shimmer.tsx` (이미 구현됨)
- **역할**: 로딩 상태를 표시하는 Shimmer 애니메이션 컴포넌트
- **주요 기능**:
  - "Thinking..." 텍스트에 Shimmer 애니메이션 적용
  - 툴 실행 중 상태 표시에 Shimmer 사용
- **Props**: 없음 (순수 애니메이션 컴포넌트)
- **UI 라이브러리**: CSS 애니메이션
- **특징**:
  - **무한 반복**: 2초 duration
  - **그라데이션**: 좌에서 우로 이동

**사용 위치**:
- Reasoning: "Thinking..." 텍스트
- Tool: 툴 실행 중 상태

**애니메이션** (User Flow 기준):
- Shimmer 애니메이션: 무한 반복 (2초 duration)

---

### 8. PromptInput Component

#### PromptInput

- **파일 위치**: `packages/ui/src/components/ai-elements/prompt-input.tsx` (이미 구현됨)
- **역할**: AI Agent에 발화를 입력하는 입력창 컴포넌트
- **주요 기능**:
  - 자동 높이 조절 (최대 5줄)
  - Enter 키로 전송, Shift+Enter로 줄바꿈
  - ESC 키로 입력창 초기화
  - 선택 블럭 표시 (Chip)
- **Props**:
  - onSubmit: (content: string) => void (필수)
  - disabled: boolean (Agent 실행 중 비활성화)
  - selectedBlockCount?: number (선택된 블럭 수)
- **UI 라이브러리**: Textarea, Button, Chip
- **특징**:
  - **플레이스홀더**: "AI에게 작업을 요청하세요... (예: 선택한 블럭을 3개 복제해줘)"
  - **자동 높이 조절**: 최대 5줄
  - **키보드 단축키**: Cmd/Ctrl + K로 입력창 포커스

**사용 위치**:
- AIAgentRunner: 사용자 발화 입력

**구현 패턴** (User Flow 기준):
```typescript
export function PromptInput({ onSubmit, disabled, selectedBlockCount }: PromptInputProps) {
  const [content, setContent] = useState('');
  
  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setContent('');
    }
  };
  
  return (
    <div className="prompt-input">
      {selectedBlockCount && selectedBlockCount > 0 && (
        <Chip>선택된 블럭 {selectedBlockCount}개</Chip>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="AI에게 작업을 요청하세요... (예: 선택한 블럭을 3개 복제해줘)"
        disabled={disabled}
        maxRows={5}
      />
      <Button onClick={handleSubmit} disabled={disabled || !content.trim()}>
        전송
      </Button>
    </div>
  );
}
```

---

### 9. Chain of Thought Component

#### ChainOfThought

- **파일 위치**: `packages/ui/src/components/ai-elements/chain-of-thought.tsx` (이미 구현됨)
- **역할**: Agent의 사고 과정 체인을 표시하는 컴포넌트
- **주요 기능**:
  - 추론 단계별 표시
  - Collapsible: 기본적으로 접혀 있음
  - 각 단계별 지속 시간 표시
- **Props**:
  - steps: ReasoningStep[] (추론 단계 배열)
- **UI 라이브러리**: Collapsible, Shimmer
- **특징**:
  - **단계별 표시**: 각 추론 단계를 순차적으로 표시
  - **Collapsible**: 기본적으로 접혀 있음, 클릭하여 펼침

**사용 위치**:
- Message: Agent의 복잡한 추론 과정 표시

---

### 10. Sources Component

#### Sources

- **파일 위치**: `packages/ui/src/components/ai-elements/sources.tsx` (이미 구현됨)
- **역할**: Agent가 참고한 소스(블럭, 문서 등) 표시 컴포넌트
- **주요 기능**:
  - 소스 목록 표시
  - 클릭 시 소스 위치로 이동 (Canvas 스크롤)
- **Props**:
  - sources: SourceInfo[] (소스 정보 배열)
- **UI 라이브러리**: Badge, Link
- **특징**:
  - **소스별 Badge**: 블럭 타입별 색상 구분
  - **클릭 시 이동**: Canvas 스크롤 연동

**사용 위치**:
- Message: Agent가 참고한 블럭 목록 표시

---

## 🔗 앱 레벨 통합

> **가이드 참조**: Phase 3.2 - 앱 레벨 통합 설계

### 1. Provider 중첩 순서

**Root Layout 통합** (Context 없음):
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WorkspaceManagementProvider>
            {children}
          </WorkspaceManagementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Provider 순서 원칙**:
- ✅ **AIManagementProvider 불필요**: Vercel AI SDK의 `useChat` Hook이 상태 관리
- ✅ AuthProvider는 가장 상위
- ✅ WorkspaceManagementProvider가 Auth 다음
- ✅ Canvas 페이지에서 ReactFlowProvider + AIAgentRunner 설정

---

### 2. 초기 데이터 전달 (Vercel AI SDK 패턴)

**Server Components에서 페이지 정보 전달**:
```typescript
// page.tsx (Canvas Management Domain)
async function PageContent({ pageId }) {
  // 서버에서 캔버스 데이터 로드
  const pageDataResult = await getCanvasPageDataAction(pageId);
  
  // CanvasClient에 페이지 정보 전달
  return (
    <CanvasClient
      pageId={pageId}
      workspaceId={pageData.workspaceId}
      organizationId={pageData.organizationId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    >
      {/* AIAgentRunner는 CanvasClient 내부에서 렌더링 */}
      <AIAgentRunner 
        pageId={pageId}
        workspaceId={pageData.workspaceId}
        organizationId={pageData.organizationId}
      />
    </CanvasClient>
  );
}
```

**데이터 흐름** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
1. page.tsx (서버) → Server Component → DB 조회 (Canvas Management Domain)
2. page.tsx (서버) → Props 전달 → CanvasClient
3. CanvasClient → AIAgentRunner 렌더링
4. AIAgentRunner → `useAIAgent` Hook → Vercel AI SDK `useChat` Hook (`@ai-sdk/react`)
5. 사용자 인터랙션 → `sendMessage({ text, metadata })` → Server API Route (`/api/agent`) → Agent 실행
6. Agent 실행 → 툴 호출 → `onToolCall` → 클라이언트 툴 실행 (Canvas & Block Actions)
7. 툴 실행 결과 → `addToolOutput` → `sendAutomaticallyWhen`으로 자동 전송 → 다음 reasoning에 활용
8. 메시지 렌더링 → `message.parts`를 사용하여 텍스트 및 툴 호출 상태 표시

---

### 3. 페이지에서 Hook 사용

**Canvas 컴포넌트**:
```typescript
// canvas-client.tsx
export function CanvasClient({ pageId, workspaceId, organizationId, initialNodes, initialEdges, children }) {
  return (
    <ReactFlowProvider>
      <CanvasReactFlowWrapper 
        pageId={pageId} 
        initialNodes={initialNodes} 
        initialEdges={initialEdges} 
      />
      {children}
    </ReactFlowProvider>
  );
}

// ai-agent-runner.tsx (AIAgentRunner 컴포넌트)
export function AIAgentRunner({ pageId, workspaceId, organizationId }: AIAgentRunnerProps) {
  const { sendMessage, messages, isAgentRunning, error } = useAIAgent({ 
    pageId, 
    workspaceId, 
    organizationId 
  });
  const { isHovered, isFocused, setHovered, focusConversation, autoUnfocus } = useConversationState();
  
  return (
    <div className="ai-agent-runner">
      <Conversation 
        messages={messages} 
        isHovered={isHovered}
        isFocused={isFocused}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <PromptInput 
        onSubmit={sendMessage} 
        disabled={isAgentRunning}
      />
    </div>
  );
}
```

### 4. Canvas Management & Block Management 연동

**Canvas 및 Block Actions 연동 패턴** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
```typescript
// src/domains/ai-management/frontend/hooks/use-ai-agent.ts
export function useAIAgent({ pageId, workspaceId, organizationId }) {
  const blockActions = useBlockActions();
  const canvasLifecycle = useCanvasBlockLifecycle({ pageId, orgId: organizationId, workspaceId });
  
  const { messages, sendMessage, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // ✅ 클라이언트에서 툴 실행 (Canvas & Block Actions 연동)
    // ⚠️ 최신 API: experimental_onToolCall → onToolCall로 변경됨 (Vercel AI SDK 최신 버전)
    async onToolCall({ toolCall }) {
      // 동적 툴 체크 (TypeScript 타입 가드)
      if (toolCall.dynamic) {
        return;
      }
      
      try {
        switch (toolCall.toolName) {
          case 'addBlock': {
            // ✅ Canvas Lifecycle Hook 사용
            const result = await canvasLifecycle.createAndMountBlock(
              toolCall.input.blockType, 
              toolCall.input.position
            );
            
            // ✅ addToolOutput으로 결과 추가
            addToolOutput({
              tool: 'addBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true, blockId: result.blockId },
            });
            break;
          }
          
          case 'deleteBlock': {
            // ✅ Block Actions Hook 사용
            await blockActions.deleteBlock(toolCall.input.blockId);
            
            addToolOutput({
              tool: 'deleteBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true },
            });
            break;
          }
          
          case 'updateProperty': {
            // ✅ Block Actions Hook 사용
            await blockActions.updateProperty(
              toolCall.input.blockId, 
              toolCall.input.propertyPath, 
              toolCall.input.value
            );
            
            addToolOutput({
              tool: 'updateProperty',
              toolCallId: toolCall.toolCallId,
              output: { success: true },
            });
            break;
          }
          
          case 'connectBlocks': {
            // ✅ Canvas Actions Hook 사용
            const edge = await blockActions.connectBlocks({
              sourceId: toolCall.input.sourceBlockId,
              targetId: toolCall.input.targetBlockId,
              label: toolCall.input.label,
            });
            
            addToolOutput({
              tool: 'connectBlocks',
              toolCallId: toolCall.toolCallId,
              output: { success: true, edgeId: edge.id },
            });
            break;
          }
          
          case 'searchByKeyword': {
            // ✅ Canvas Store에서 검색
            const blocks = canvasStore.searchBlocksByKeyword(toolCall.input.keyword);
            
            addToolOutput({
              tool: 'searchByKeyword',
              toolCallId: toolCall.toolCallId,
              output: { success: true, blocks },
            });
            break;
          }
          
          // ... 다른 툴들
        }
      } catch (error) {
        // ✅ 에러 처리
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
  
  return { messages, append, isLoading };
}
```

**툴 실행 결과 처리**:
```typescript
// 툴 실행 결과가 Agent의 다음 reasoning에 활용됨
// Vercel AI SDK가 자동으로 처리함
// maxSteps: 10 (Agent Loop 최대 10회)
```

---

## 🚀 Server API Route 연동

> **가이드 참조**: Phase 2.4 Part 1 - Server Actions 연동  
> **설계 회의록 참조**: `basic-ai-context-engineering.md` - Server Reasoning + Client Execution

### 1. Server API Route 구현

#### POST /api/agent

- **파일 위치**: `src/app/api/agent/route.ts`
- **역할**: Vercel AI SDK 기반 Agent 실행 및 LLM Reasoning
- **주요 기능** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
  - Supabase Auth를 통한 사용자 인증 확인
  - Client Context 추출 (`messages`의 첫 번째 사용자 메시지 `metadata`에서)
  - Server Context 조립 (`assembleServerContext`)
  - LLM Reasoning (`streamText`)
  - 툴 스키마 제공 (`inputSchema` 사용, execute 없음)
- **입력**: `SendMessageRequest` (messages: UIMessage[], metadata는 첫 번째 사용자 메시지에 포함)
- **출력**: Stream (`toUIMessageStreamResponse()`, Vercel AI SDK 형식)
- **인증**: Supabase Auth 기반 사용자 인증 필수
- **에러 처리**: 
  - 인증 실패 → `UNAUTHORIZED`
  - 권한 부족 → `ACCESS_DENIED`
  - LLM 에러 → `LLM_ERROR`
- **특징** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
  - **Server Reasoning + Client Execution**: 서버는 LLM 추론만, 클라이언트는 툴 실행
  - `maxSteps: 10` (Agent Loop 최대 10회)
  - `stopWhen: stepCountIs(10)` (최대 단계 제한)
  - 툴 스키마에 `execute` 없음 (클라이언트에서 처리)
  - `inputSchema` 사용 (Zod 스키마)
  - `convertToModelMessages` 사용 (UIMessage → ModelMessage 변환)
  - System Prompt 빌더로 컨텍스트 전달

**처리 흐름** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
1. 인증 확인: Supabase Auth로 현재 사용자 확인
2. Client Context 추출: 첫 번째 사용자 메시지의 `metadata`에서 pageId, selectedBlockIds, visibleBlockIds 등 추출
   - ⚠️ **설계 원칙**: 프론트엔드에서 이미 계산된 블럭 ID만 전달 (뷰포트 정보 불필요)
3. Server Context 조립: `assembleServerContext(frontendContext)` 호출
   - 선택된 블럭의 전체 데이터 (selectedBlockIds로 조회)
   - 주변 블럭 (visibleBlockIds로 조회, 프론트엔드에서 이미 계산됨)
   - 의미적 블럭 (벡터 검색)
   - Short-term Memory (최근 20개 이벤트)
   - Long-term Memory (시맨틱 검색 결과)
4. System Prompt 빌더: `buildSystemPrompt(fullContext)` 호출
5. LLM Reasoning: `streamText({ model, system, messages: convertToModelMessages(messages), maxSteps, tools, stopWhen })`
6. 툴 스키마 제공: `tools` 객체에 툴 정의 (`inputSchema` 사용, execute 없음)
7. Stream 반환: `result.toUIMessageStreamResponse()`

**구현 패턴** (설계 회의록 기준, 최신 Vercel AI SDK v5.0 API):
```typescript
// src/app/api/agent/route.ts
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // 1. Supabase Auth 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Authentication required');
  
  // 2. 프론트에서 보낸 컨텍스트 추출 (메시지 metadata에서)
  const firstUserMessage = messages.find(m => m.role === 'user');
  const frontendContext: ClientContext = firstUserMessage?.metadata || {};
  
  // 3. 서버에서 추가 컨텍스트 조립
  const serverContext = await assembleServerContext(frontendContext);
  const fullContext = { ...frontendContext, ...serverContext };
  
  // 4. LLM Reasoning
  const result = streamText({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(fullContext),
    messages: convertToModelMessages(messages),
    maxSteps: 10, // Agent loop 최대 횟수
    tools: {
      // ⚠️ 핵심: execute 없음 (클라이언트에서 처리)
      addBlock: {
        description: '새 블럭을 캔버스에 생성합니다',
        inputSchema: z.object({
          blockType: z.enum(['markdown', 'code', 'image', 'shape']),
          content: z.any(),
          position: z.object({ x: z.number(), y: z.number() })
        })
        // execute 없음!
      },
      deleteBlock: {
        description: '블럭을 삭제합니다',
        inputSchema: z.object({
          blockId: z.string()
        })
      },
      connectBlocks: {
        description: '두 블럭을 엣지로 연결합니다',
        inputSchema: z.object({
          sourceBlockId: z.string(),
          targetBlockId: z.string(),
          edgeType: z.string().optional(),
          label: z.string().optional()
        })
      },
      searchByKeyword: {
        description: '키워드로 블럭 검색',
        inputSchema: z.object({
          keyword: z.string(),
          blockTypes: z.array(z.string()).optional()
        })
      },
      // ... 다른 툴들
    },
    stopWhen: stepCountIs(10), // 최대 10단계
  });

  return result.toUIMessageStreamResponse();
}
```

---

### 2. Context Assembly 함수

#### assembleServerContext

- **파일 위치**: `src/domains/ai-management/backend/services/context-assembly.service.ts`
- **역할**: Server Context 조립 (DB/벡터 검색이 필요한 컨텍스트)
- **주요 기능** (설계 회의록 기준):
  - 선택된 블럭의 전체 데이터 조회
  - 주변 블럭 검색 (거리/그룹/엣지 기반)
  - 의미적 블럭 검색 (벡터 검색)
  - Short-term Memory 조회 (최근 20개 이벤트)
  - Long-term Memory 시맨틱 검색
  - 사용자 권한 조회
- **입력**: `ClientContext`
- **출력**: `ServerContext`

**구현 패턴** (설계 회의록 기준):
```typescript
async function assembleServerContext(frontendContext: ClientContext): Promise<ServerContext> {
  const { pageId, selectedBlockIds } = frontendContext;
  
  // 1. 선택된 블럭의 전체 데이터
  const selectedBlocks = await db.blocks.findMany({
    where: { id: { in: selectedBlockIds } },
    include: { properties: true }
  });
  
  // 2. 주변 블럭 (거리/그룹/엣지 기반)
  const nearbyBlocks = await findNearbyBlocks(selectedBlockIds, pageId);
  
  // 3. 의미적 블럭 (벡터 검색)
  const semanticBlocks = await vectorSearch({
    query: messages[messages.length - 1].content,
    pageId,
    limit: 5
  });
  
  // 4. Short-term Memory
  const shortTermMemory = await getRecentEvents({
    pageId,
    limit: 20
  });
  
  // 5. Long-term Memory
  const longTermMemory = await vectorSearchEvents({
    query: messages[messages.length - 1].content,
    pageId,
    limit: 10
  });
  
  return {
    selectedBlocks,
    nearbyBlocks,
    semanticBlocks,
    shortTermMemory,
    longTermMemory,
    userPermissions: await getUserPermissions(userId),
    availableBlockTypes: await getAvailableBlockTypes(),
    availableBlockActions: await getAvailableBlockActions(),
  };
}
```

---

### 3. System Prompt Builder

#### buildSystemPrompt

- **파일 위치**: `src/domains/ai-management/backend/services/prompt-builder.service.ts`
- **역할**: Client Context + Server Context를 통합하여 LLM에 전달하는 System Prompt 생성
- **주요 기능** (설계 회의록 기준):
  - 선택된 블럭 정보 요약
  - 주변 블럭 정보 요약
  - 의미적 블럭 정보 요약
  - 최근 활동 (Short-term Memory) 요약
  - 유사 과거 작업 (Long-term Memory) 요약
  - 뷰포트 컨텍스트 정보
  - 사용 가능한 툴 목록
- **입력**: `ClientContext & ServerContext`
- **출력**: `string` (System Prompt)

**구현 패턴** (설계 회의록 기준):
```typescript
function buildSystemPrompt(fullContext: ClientContext & ServerContext): string {
  return `
You are an AI agent that helps users work on a canvas.

## Current Context

### Selected Blocks (${fullContext.selectedBlocks.length})
${fullContext.selectedBlocks.map(b => `
- ID: ${b.id}
  Type: ${b.type}
  Content: ${JSON.stringify(b.content).slice(0, 100)}...
`).join('\n')}

### Nearby Blocks (${fullContext.nearbyBlocks.length})
${fullContext.nearbyBlocks.map(b => `
- ${b.id}: ${b.type} (distance: ${b.distance}px)
`).join('\n')}

### Semantic Blocks (${fullContext.semanticBlocks.length})
${fullContext.semanticBlocks.map(b => `
- ${b.id}: ${b.type} (similarity: ${b.similarity})
`).join('\n')}

### Recent Activity (Short-term Memory)
${fullContext.shortTermMemory.map(e => `
- [${e.timestamp}] ${e.type}: ${e.summary}
`).join('\n')}

### Similar Past Work (Long-term Memory)
${fullContext.longTermMemory.map(e => `
- ${e.summary} (${e.timeAgo})
`).join('\n')}

### Visible Blocks
- Visible Block IDs: ${fullContext.visibleBlockIds.length} blocks (프론트엔드에서 이미 계산됨)

## Your Task
Help the user with their request using the available tools.
Prioritize selected blocks, then nearby blocks, then semantic blocks.
Work autonomously without asking for confirmation unless critical.

## Guidelines
1. If a block is selected, prioritize working with that block
2. Use nearby/semantic blocks for additional context
3. Call tools in a logical order
4. Check tool results before proceeding
5. Finish when the task is complete or if you encounter an error
  `.trim();
}
```

---

## ✅ 검증 체크리스트

### DTO 타입 정의
- [ ] DTO 인터페이스가 Plain Object로 정의되었는가?
- [ ] Date 객체가 ISO 문자열로 직렬화되었는가?
- [ ] Value Object가 string으로 직렬화되었는가?
- [ ] Vercel AI SDK의 타입과 호환되는가?

### Props 전달 방식 (Context 없음)
- [ ] AIManagementContext가 없는가? (Vercel AI SDK `useChat` 사용)
- [ ] Props를 통해 pageId, workspaceId, organizationId가 전달되는가?
- [ ] Vercel AI SDK가 SSOT로 관리되는가?
- [ ] Conversation UI가 호버 상태에 따라 렌더링되는가?

### Server API Route 연동
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] Client Context 추출이 올바르게 구현되었는가? (첫 번째 사용자 메시지의 `metadata`에서)
- [ ] Server Context 조립이 올바르게 구현되었는가?
- [ ] System Prompt 빌더가 올바르게 구현되었는가?
- [ ] 툴 스키마에 `execute`가 없는가? (클라이언트에서 처리)
- [ ] 툴 스키마가 `inputSchema`를 사용하는가? (Zod 스키마)
- [ ] `convertToModelMessages`가 사용되었는가?
- [ ] `toUIMessageStreamResponse()`가 사용되었는가?
- [ ] `maxSteps`가 10으로 설정되었는가?
- [ ] `stopWhen: stepCountIs(10)`이 설정되었는가?
- [ ] `maxDuration = 30`이 설정되었는가?

### Hook 구현
- [ ] useAIAgent Hook이 useChat (`@ai-sdk/react`)을 래핑하는가?
- [ ] `onToolCall`이 올바르게 구현되었는가?
- [ ] `addToolOutput`으로 툴 실행 결과를 추가하는가?
- [ ] `sendAutomaticallyWhen`이 `lastAssistantMessageIsCompleteWithToolCalls`로 설정되었는가?
- [ ] `DefaultChatTransport`가 올바르게 설정되었는가?
- [ ] 기존 Canvas & Block Actions Hook을 재사용하는가?
- [ ] `sendMessage`의 `metadata` 필드로 Client Context를 전달하는가?
- [ ] 에러 상태가 적절히 처리되는가? (`addToolOutput`에 `state: 'output-error'` 사용)

### UI 컴포넌트 구조
- [ ] Conversation 컴포넌트가 호버 상태를 처리하는가?
- [ ] Message 컴포넌트가 역할별로 스타일이 구분되는가?
- [ ] Task 컴포넌트가 툴 호출 목록을 표시하는가?
- [ ] Tool 컴포넌트가 실행 상태를 아이콘으로 표시하는가?
- [ ] PromptInput 컴포넌트가 자동 높이 조절을 지원하는가?

### Agent Loop 및 상태 관리
- [ ] Vercel AI SDK의 `maxSteps`로 Agent Loop를 제어하는가?
- [ ] `sendAutomaticallyWhen`으로 자동 전송이 설정되었는가?
- [ ] 타임아웃 처리가 구현되었는가? (30초, `maxDuration = 30`)
- [ ] 툴 실행 실패 시 롤백 처리가 구현되었는가?
- [ ] `addToolOutput`에 `state: 'output-error'` 및 `errorText`가 사용되는가?
- [ ] Agent 완료 시 자동 포커싱이 구현되었는가?
- [ ] 메시지 렌더링이 `message.parts`를 사용하는가?

### 앱 통합
- [ ] AIManagementProvider가 제거되었는가?
- [ ] Vercel AI SDK의 useChat Hook을 활용하는가?
- [ ] Canvas & Block Management Domain의 Hook을 재사용하는가?
- [ ] Conversation UI가 Canvas 위에서 렌더링되는가?

### User Flow ↔ Frontend Specification 일관성 검증
- [ ] User Flow의 모든 화면이 컴포넌트로 구현되었는가?
- [ ] UI 요소가 모두 React 컴포넌트로 매핑되었는가?
- [ ] 사용자 인터랙션이 Hook 메서드로 정의되었는가?
- [ ] Conversation 호버 상태가 적절히 구현되었는가?
- [ ] Agent 실행 상태별 UI가 적절히 정의되었는가?

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Hooks, Components, Server API Route)
- **내용**:
  - Custom Hooks 구현 (useAIAgent, useConversationState)
  - UI 컴포넌트 구현 (이미 구현된 컴포넌트 활용)
  - Server API Route 구현 (`/api/agent/route.ts`)
  - Context Assembly 및 System Prompt 빌더 구현
  - React Testing Library로 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] 설계 회의록과 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

```
src/domains/ai-management/
├── shared/
│   ├── dtos/
│   │   └── index.ts                            # DTO 인터페이스들
│   ├── types/
│   │   └── index.ts                            # Result 패턴 및 공통 타입
│   ├── commands/                               # Command 객체들
│   └── errors/                                 # 에러 타입들
│
├── frontend/
│   ├── hooks/
│   │   ├── use-ai-agent.ts                     # ⭐ useChat 래핑 Hook
│   │   └── use-conversation-state.ts           # ⭐ Conversation 호버 상태 Hook
│   │
│   └── components/
│       └── ai-agent-runner.tsx                 # ⭐ Agent Runner 컴포넌트
│
├── backend/
│   └── services/
│       ├── context-assembly.service.ts         # ⭐ Server Context 조립
│       └── prompt-builder.service.ts           # ⭐ System Prompt 빌더
│
└── api/
    └── route.ts                                # ⭐ Server API Route (/api/agent)

# UI 컴포넌트 (packages/ui - 이미 구현됨)
packages/ui/src/components/ai-elements/
├── conversation.tsx                            # ✅ Conversation 컴포넌트
├── message.tsx                                 # ✅ Message 컴포넌트
├── reasoning.tsx                               # ✅ Reasoning 컴포넌트
├── task.tsx                                    # ✅ Task 컴포넌트
├── tool.tsx                                    # ✅ Tool 컴포넌트
├── shimmer.tsx                                 # ✅ Shimmer 컴포넌트
├── prompt-input.tsx                            # ✅ PromptInput 컴포넌트
├── chain-of-thought.tsx                        # ✅ ChainOfThought 컴포넌트
└── sources.tsx                                 # ✅ Sources 컴포넌트

# Canvas & Block Management 연동
src/domains/canvas-management/frontend/hooks/
└── use-canvas-block-lifecycle.ts               # Canvas Actions Hook
src/domains/block-management/frontend/hooks/
├── use-block-property-update.ts                # Block Actions Hook
└── use-block-tool-execution.ts                 # Block Tool Hook
```

**폴더 구조 핵심 포인트**:
1. ✅ **Context 제거**: `contexts/` 폴더 없음
2. ✅ **Vercel AI SDK 중심**: `useChat` Hook 활용
3. ✅ **Server API Route**: `/api/agent/route.ts` 구현
4. ✅ **Hook 중심**: 상태 관리는 Vercel AI SDK + Server API Route
5. ✅ **Props 전달**: pageId, workspaceId, organizationId를 Props로 전달
6. ✅ **UI 컴포넌트 재사용**: packages/ui의 컴포넌트 활용

---

## 📋 문서 변경 이력

### v1.4 (2025-11-12) ⭐ ActionInfo DTO 제거
- **DTO 제거**:
  - ❌ `ActionInfo` DTO 제거 (사용자 의도는 블럭 ID로 충분히 전달됨)
  - ✅ `ClientContext`에서 `lastAction` 필드 제거
  - ✅ `selectedBlockIds`, `visibleBlockIds`, `recentlyModifiedBlockIds`로 사용자 의도 충분히 전달
- **설계 원칙 명확화**: 블럭 ID만으로 사용자 의도 전달, 추가 메타데이터 불필요

### v1.3 (2025-11-12) ⭐ ViewportInfo DTO 제거
- **DTO 제거**:
  - ❌ `ViewportInfo` DTO 제거 (프론트엔드에서 이미 계산된 블럭 ID만 전달)
  - ✅ `ClientContext`에서 `viewport` 필드 제거
  - ✅ `visibleBlockIds`로 이미 계산된 블럭 ID 전달
- **설계 원칙 명확화**: 프론트엔드에서 이미 계산된 블럭 ID만 전달, 서버는 전달받은 ID로 직접 조회

### v1.2 (2025-11-12) ⭐ 불필요한 DTO 제거 및 최신 API 반영
- **DTO 제거**:
  - ❌ `ConversationView` DTO 제거 (메시지는 휘발적, 서버에서 불러올 필요 없음)
  - ❌ `MessageView` DTO 제거 (Vercel AI SDK의 내장 `Message` 타입 사용)
  - ❌ `ToolCallView` DTO 제거 (Vercel AI SDK의 내장 타입 사용)
  - ❌ `ToolResultView` DTO 제거 (Vercel AI SDK의 내장 타입 사용)
  - ✅ `ClientContext` DTO 유지 (서버로 컨텍스트 전달용)
- **Vercel AI SDK 내장 타입 사용**: `useChat` Hook의 `messages` 배열에서 제공되는 타입 활용
- **설계 원칙 명확화**: "메시지는 휘발적이며 클라이언트에서만 관리" 원칙 추가

### v1.1 (2025-11-12) ⭐ 최신 Vercel AI SDK v5.0 API 반영
- **최신 API 업데이트**:
  - `experimental_onToolCall` → `onToolCall` 변경 (표준 API로 승격)
  - `experimental_data` → `sendMessage`의 `metadata` 필드로 변경
  - `DefaultChatTransport` 사용 추가
  - `sendAutomaticallyWhen` (`lastAssistantMessageIsCompleteWithToolCalls`) 추가
  - `addToolOutput` 사용 추가
  - `toUIMessageStreamResponse()` 사용 (`toDataStreamResponse()` 대신)
  - `convertToModelMessages` 사용 추가
  - `inputSchema` 사용 (`parameters` 대신)
  - `stopWhen: stepCountIs(10)` 추가
  - `message.parts`를 사용한 메시지 렌더링 패턴 추가
- **에러 처리 개선**: `addToolOutput`에 `state: 'output-error'` 및 `errorText` 사용
- **검증 체크리스트 업데이트**: 최신 API 반영

### v1.0 (2025-11-12)
- 초안 작성
- DTO 및 타입 정의
- Props 전달 방식 설계 (Context 없음)
- Vercel AI SDK 통합 설계 (useChat Hook)
- UI 컴포넌트 설계 (Conversation, Message, Task 등)
- Server API Route 설계 (`/api/agent/route.ts`)
- Context Assembly 및 System Prompt 빌더 설계
- Server Reasoning + Client Execution 하이브리드 아키텍처 반영

---

이 Frontend Specification을 따라 **User Flow 기반의 AI Management Domain 프론트엔드**를 구현할 수 있습니다! 🤖

