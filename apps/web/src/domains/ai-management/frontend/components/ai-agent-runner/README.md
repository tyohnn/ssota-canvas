# AI Agent Runner

AI Agent 실행 및 Conversation UI 통합 컴포넌트입니다. Vercel AI SDK 기반으로 Agent를 실행하고, 실시간으로 툴 실행 과정을 표시합니다.

## 구조

이 컴포넌트는 프랙탈 구조로 설계되어 있습니다:

```
ai-agent-runner/
├── core/                    # 비즈니스 로직 및 Context
│   ├── types.ts             # 타입 정의
│   ├── ai-agent-runner.context.tsx  # Context 정의
│   ├── use-ai-agent.ui.ts   # UI 상태 (호버, 포커싱)
│   ├── use-ai-agent.business.ts     # 비즈니스 로직 (Agent 실행)
│   ├── use-ai-agent.ts      # 통합 훅
│   └── provider.tsx         # Provider 컴포넌트
├── components/              # UI 컴포넌트들
│   ├── agent-conversation.tsx       # Conversation 래퍼
│   └── agent-prompt-input.tsx       # PromptInput 래퍼
└── index.tsx                # Provider + 내부 조합
```

## 역할

- **Agent 실행**: Vercel AI SDK의 useChat Hook으로 Server API Route 호출
- **툴 실행 처리**: onToolCall로 클라이언트에서 툴 실행 후 addToolOutput으로 결과 전달
- **Conversation UI**: 메시지 목록 및 실시간 상태 표시
- **호버 상태 관리**: 호버 시 상세 정보, 평상시 축소/흐릿

## 비즈니스 로직

`use-ai-agent.business.ts`에서 수행하는 주요 로직:

1. **Agent 실행**: Vercel AI SDK useChat으로 /api/agent 호출
2. **Client Context 수집**: Canvas Store에서 선택 블럭, 뷰포트 등 수집
3. **툴 실행**: onToolCall로 Canvas & Block Actions 연동
4. **에러 처리**: addToolOutput에 state: 'output-error' 사용

## 사용 예시

```tsx
<AIAgentRunner 
  pageId={pageId}
  workspaceId={workspaceId}
  organizationId={organizationId}
/>
```

## 하위 컴포넌트

- **AgentConversation**: Conversation 컴포넌트 래퍼 (호버 상태 관리)
- **AgentPromptInput**: PromptInput 컴포넌트 래퍼 (Agent 실행 중 비활성화)

## NoCode 호환성

이 컴포넌트는 NoCode 툴(Framer 등)에서 사용 가능하도록 설계되었습니다:

- ✅ 함수 Props 없음
- ✅ 단순 값만 Props로 전달 (pageId, workspaceId, organizationId)
- ✅ 로직 분리 (UI/Business)
- ✅ Mock 비즈니스 로직 제공

### Framer에서 사용

```tsx
import { useMockAIAgentBusiness } from './core/use-ai-agent.business';

// Mock 비즈니스 로직 주입
<AIAgentRunner 
  pageId="mock-page"
  workspaceId="mock-workspace"
  organizationId="mock-org"
  businessLogic={useMockAIAgentBusiness()}
/>
```

## 설계 원칙

- **"메시지는 휘발되고 데이터는 캔버스에 남는다"**: 새로고침 시 메시지 사라짐
- **Server Reasoning + Client Execution**: 서버는 LLM 추론, 클라이언트는 툴 실행
- **Props 전달 방식**: Context 없이 Props로 데이터 전달
- **Vercel AI SDK = SSOT**: Agent 상태는 useChat Hook이 관리

## 아키텍처

### Server API Route
- `/api/agent/route.ts`
- Vercel AI SDK streamText
- maxSteps: 10
- tools 정의 (inputSchema만, execute 없음)

### Client Hook
- useChat 래핑
- onToolCall로 툴 실행
- addToolOutput으로 결과 전달
- sendAutomaticallyWhen으로 자동 전송

### Canvas & Block Actions 연동
- useCanvasBlockLifecycle (블럭 생성/삭제)
- useBlockPropertyUpdate (속성 업데이트)
- useCanvasEdgeManagement (엣지 연결)

