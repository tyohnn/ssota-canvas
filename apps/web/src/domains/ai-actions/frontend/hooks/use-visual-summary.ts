/**
 * Visual Summary Hook
 * 
 * Grok을 사용하여 Visual Summary Canvasdown을 생성하고 tool call로 받는 훅
 * use-ai-agent.business.ts 패턴을 따름 (단순한 onToolCall 처리)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  type UIMessage,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { z } from 'zod';
import { useCanvasdownContext } from '@/domains/canvasdown/frontend/contexts/canvasdown-context';
import {
  renderCanvasdownTool,
  renderCanvasdownRightTool,
  renderCanvasdownBelowTool,
  planTodoTool,
  updateTodoTool,
} from '@/domains/ai-actions/backend/prompt/visual-summary/tools';
import type { VisualTemplate } from '../../shared/types/template.types';
import type { GenerateVisualSummaryRequest } from '../../shared/types/visual-summary.types';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';
import type { StatusJob } from '@workspace/ui/components/ssota-ui/status-window';

// Tool Input 타입 정의 (Zod schema에서 추출)
type RenderCanvasdownInput = z.infer<typeof renderCanvasdownTool.inputSchema>;
type RenderCanvasdownAnchorInput = z.infer<typeof renderCanvasdownRightTool.inputSchema>;
type PlanTodoInput = z.infer<typeof planTodoTool.inputSchema>;
type UpdateTodoInput = z.infer<typeof updateTodoTool.inputSchema>;

// Tool Output 타입 정의
interface RenderCanvasdownOutput {
  success: boolean;
  message: string;
  blockIdMap?: Record<string, string>;
  parseError?: string;
  canvasdown?: string;
}

// Helper type for extracting tool input from AI SDK toolCall
// AI SDK may use either 'input' or 'args' field depending on version/model
type ToolCallWithInput = {
  input?: unknown;
  args?: unknown;
};

/** 상태창에 표시할 작업 유형 */
export type StatusOperationType = 'visual-summary' | 'summary' | 'script' | 'ai';

interface UseVisualSummaryProps {
  pageId: string;
  /** Injected by AIActionProvider to avoid circular context dependency */
  pushJob: (job: Omit<StatusJob, 'id' | 'createdAt'>) => string;
  /** Injected by AIActionProvider to avoid circular context dependency */
  updateJob: (id: string, patch: Partial<StatusJob>) => void;
}

interface UseVisualSummaryReturn {
  generateVisualSummary: (params: {
    summary: string;
    template: VisualTemplate;
    sourceBlockId: string;
    sourceBlockPosition: { x: number; y: number };
    sourceBlockSize: { width: number; height: number };
    sourceTitle?: string;
    sourceChannelName?: string;
  }) => void;
  isGenerating: boolean;
  error: Error | null;
  messages: UIMessage[];
  todos: QueueTodo[];
  /** 이번/마지막 실행을 시작한 블록 ID (해당 블록에만 로딩·완료 아이콘 표시) */
  currentRunSourceBlockId: string | null;
  /** 상태창 닫기 (숨김) */
  dismissStatusWindow: () => void;
  /** 상태창 다시 열기 (닫힌 후 트리거 버튼으로 호출) */
  showStatusWindow: () => void;
  /** 상태창이 사용자에 의해 닫혀 있는지 */
  windowDismissed: boolean;
  /** 현재/마지막 작업 유형 (상태창 라벨용) */
  statusOperationType: StatusOperationType | null;
  /** 비주얼 요약 시 선택된 템플릿 이름 */
  statusTemplateName: string | null;
}

interface GenerateVisualSummaryParams {
  summary: string;
  template: VisualTemplate;
  sourceBlockId: string;
  sourceBlockPosition: { x: number; y: number };
  sourceBlockSize: { width: number; height: number };
  sourceTitle?: string;
  sourceChannelName?: string;
}

/**
 * Visual Summary 생성 훅
 * 
 * @param props - 훅 설정
 * @returns Visual Summary 생성 함수 및 상태
 */
export function useVisualSummary(
  props: UseVisualSummaryProps
): UseVisualSummaryReturn {
  const { pageId, pushJob, updateJob } = props;

  const blockIdMapRef = useRef<Map<string, string>>(new Map());
  const currentJobIdRef = useRef<string | null>(null);

  const [todos, setTodos] = useState<QueueTodo[]>([]);
  const [currentRunSourceBlockId, setCurrentRunSourceBlockId] = useState<string | null>(null);
  const [windowDismissed, setWindowDismissed] = useState(false);
  const [statusOperationType, setStatusOperationType] = useState<StatusOperationType | null>(null);
  const [statusTemplateName, setStatusTemplateName] = useState<string | null>(null);

  // Current session info (set when generateVisualSummary is called)
  const currentSessionRef = useRef<{
    sourceBlockId: string;
    sourceBlockPosition: { x: number; y: number };
    sourceBlockSize: { width: number; height: number };
  } | null>(null);

  // Canvasdown Context 사용
  const { renderCanvasdown: renderCanvasdownFromContext } = useCanvasdownContext();

  // Chat Transport 설정
  const chatTransport = new DefaultChatTransport({
    api: '/api/visual-summary',
  });

  // useChat 훅 사용 (client tool 패턴)
  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
    error: chatError,
  } = useChat({
    transport: chatTransport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // 에러 처리
    onError: (error: Error) => {
      console.error('[useVisualSummary] Error:', error);
    },

    // 클라이언트에서 tool 실행 (use-ai-agent.business.ts 패턴)
    onToolCall: async ({ toolCall }) => {
      if (toolCall.dynamic) {
        return;
      }

      // planTodo 처리
      if (toolCall.toolName === 'planTodo') {
        try {
          const toolCallInput = (toolCall as ToolCallWithInput).input || (toolCall as ToolCallWithInput).args;
          const input: PlanTodoInput = planTodoTool.inputSchema.parse(
            toolCallInput || {}
          );

          const nextTodos = input.todos.map((todo) => ({
            ...todo,
            status: 'pending' as const,
          }));
          setTodos(nextTodos);
          if (currentJobIdRef.current) {
            updateJob(currentJobIdRef.current, { tasks: nextTodos });
          }

          addToolOutput({
            tool: 'planTodo',
            toolCallId: toolCall.toolCallId,
            state: 'output-available',
            output: { success: true },
          });
        } catch (error) {
          console.error('[useVisualSummary] planTodo error:', error);
          addToolOutput({
            tool: 'planTodo',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Failed to plan todos',
          });
        }
        return;
      }

      // updateTodo 처리
      if (toolCall.toolName === 'updateTodo') {
        try {
          const toolCallInput = (toolCall as ToolCallWithInput).input || (toolCall as ToolCallWithInput).args;
          const input: UpdateTodoInput = updateTodoTool.inputSchema.parse(
            toolCallInput || {}
          );

          const nextTodos = (prev: QueueTodo[]) =>
            prev.map((todo) =>
              todo.id === input.id
                ? {
                    ...todo,
                    status: input.status,
                    description: input.description || todo.description,
                  }
                : todo
            );
          setTodos(prev => {
            const next = nextTodos(prev);
            if (currentJobIdRef.current) {
              updateJob(currentJobIdRef.current, { tasks: next });
            }
            return next;
          });

          addToolOutput({
            tool: 'updateTodo',
            toolCallId: toolCall.toolCallId,
            state: 'output-available',
            output: { success: true },
          });
        } catch (error) {
          console.error('[useVisualSummary] updateTodo error:', error);
          addToolOutput({
            tool: 'updateTodo',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Failed to update todo',
          });
        }
        return;
      }

      // renderCanvasdown 처리
      if (toolCall.toolName === 'renderCanvasdown') {
        try {
          // 1. Tool call input 추출 (타입 안전)
          // AI SDK는 모델에 따라 args 또는 input 필드를 사용할 수 있음
          const toolCallInput = (toolCall as ToolCallWithInput).input || (toolCall as ToolCallWithInput).args;

          // 타입 검증 및 추출
          const input: RenderCanvasdownInput = renderCanvasdownTool.inputSchema.parse(
            toolCallInput || {}
          );

          const canvasdown = input.canvasdown;

          // 2. canvasdown 유효성 검사 (Zod schema에서 이미 검증됨, 하지만 추가 체크)
          if (!canvasdown || !canvasdown.trim()) {
            const errorOutput: RenderCanvasdownOutput = {
              success: false,
              message: 'No canvasdown code provided in tool call',
            };
            addToolOutput({
              tool: 'renderCanvasdown',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: errorOutput.message,
            });
            return;
          }

          // 3. Canvasdown Context를 통해 렌더링
          // Current session info 사용
          if (!currentSessionRef.current) {
            throw new Error('No active visual summary session');
          }

          const renderResult = await renderCanvasdownFromContext({
            canvasdown,
            sourceBlockPosition: currentSessionRef.current.sourceBlockPosition,
            sourceBlockSize: currentSessionRef.current.sourceBlockSize,
            sourceBlockId: currentSessionRef.current.sourceBlockId,
          });

          // 4. 에러 체크
          if (!renderResult.success && renderResult.errors.length > 0) {
            const errorOutput: RenderCanvasdownOutput = {
              success: false,
              message: `Canvasdown rendering failed: ${renderResult.errors.join(', ')}`,
              parseError: renderResult.errors.join(', '),
              canvasdown: canvasdown,
            };
            addToolOutput({
              tool: 'renderCanvasdown',
              toolCallId: toolCall.toolCallId,
              output: errorOutput,
            });
            return;
          }

          // 5. blockIdMap 누적 (각 tool call마다 추가)
          renderResult.blockIdMap.forEach((blockMountId, canvasdownId) => {
            blockIdMapRef.current.set(canvasdownId, blockMountId);
          });

          // 5. Tool 결과 반환 (성공)
          const successOutput: RenderCanvasdownOutput = {
            success: true,
            message: 'Canvasdown rendered successfully',
            blockIdMap: Object.fromEntries(blockIdMapRef.current),
          };
          addToolOutput({
            tool: 'renderCanvasdown',
            toolCallId: toolCall.toolCallId,
            output: successOutput,
          });
        } catch (error) {
          console.error('[useVisualSummary] Tool call error:', error);

          // Tool 결과 반환 (에러)
          addToolOutput({
            tool: 'renderCanvasdown',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Render failed',
          });
        }
        return;
      }

      // renderCanvasdownRight 처리
      if (toolCall.toolName === 'renderCanvasdownRight') {
        try {
          const toolCallInput = (toolCall as ToolCallWithInput).input || (toolCall as ToolCallWithInput).args;
          const input: RenderCanvasdownAnchorInput = renderCanvasdownRightTool.inputSchema.parse(
            toolCallInput || {}
          );
          const { canvasdown, anchorBlockId } = input;

          if (!canvasdown || !canvasdown.trim()) {
            addToolOutput({
              tool: 'renderCanvasdownRight',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: 'No canvasdown code provided in tool call',
            });
            return;
          }

          const renderResult = await renderCanvasdownFromContext({
            canvasdown,
            anchorBlockId,
            anchorDirection: 'right',
          });

          if (!renderResult.success && renderResult.errors.length > 0) {
            addToolOutput({
              tool: 'renderCanvasdownRight',
              toolCallId: toolCall.toolCallId,
              output: {
                success: false,
                message: `Canvasdown rendering failed: ${renderResult.errors.join(', ')}`,
                parseError: renderResult.errors.join(', '),
                canvasdown,
              },
            });
            return;
          }

          renderResult.blockIdMap.forEach((blockMountId, canvasdownId) => {
            blockIdMapRef.current.set(canvasdownId, blockMountId);
          });

          addToolOutput({
            tool: 'renderCanvasdownRight',
            toolCallId: toolCall.toolCallId,
            output: {
              success: true,
              message: 'Canvasdown rendered successfully',
              blockIdMap: Object.fromEntries(blockIdMapRef.current),
            },
          });
        } catch (error) {
          console.error('[useVisualSummary] renderCanvasdownRight error:', error);
          addToolOutput({
            tool: 'renderCanvasdownRight',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Render failed',
          });
        }
        return;
      }

      // renderCanvasdownBelow 처리
      if (toolCall.toolName === 'renderCanvasdownBelow') {
        try {
          const toolCallInput = (toolCall as ToolCallWithInput).input || (toolCall as ToolCallWithInput).args;
          const input: RenderCanvasdownAnchorInput = renderCanvasdownBelowTool.inputSchema.parse(
            toolCallInput || {}
          );
          const { canvasdown, anchorBlockId } = input;

          if (!canvasdown || !canvasdown.trim()) {
            addToolOutput({
              tool: 'renderCanvasdownBelow',
              toolCallId: toolCall.toolCallId,
              state: 'output-error',
              errorText: 'No canvasdown code provided in tool call',
            });
            return;
          }

          const renderResult = await renderCanvasdownFromContext({
            canvasdown,
            anchorBlockId,
            anchorDirection: 'below',
          });

          if (!renderResult.success && renderResult.errors.length > 0) {
            addToolOutput({
              tool: 'renderCanvasdownBelow',
              toolCallId: toolCall.toolCallId,
              output: {
                success: false,
                message: `Canvasdown rendering failed: ${renderResult.errors.join(', ')}`,
                parseError: renderResult.errors.join(', '),
                canvasdown,
              },
            });
            return;
          }

          renderResult.blockIdMap.forEach((blockMountId, canvasdownId) => {
            blockIdMapRef.current.set(canvasdownId, blockMountId);
          });

          addToolOutput({
            tool: 'renderCanvasdownBelow',
            toolCallId: toolCall.toolCallId,
            output: {
              success: true,
              message: 'Canvasdown rendered successfully',
              blockIdMap: Object.fromEntries(blockIdMapRef.current),
            },
          });
        } catch (error) {
          console.error('[useVisualSummary] renderCanvasdownBelow error:', error);
          addToolOutput({
            tool: 'renderCanvasdownBelow',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: error instanceof Error ? error.message : 'Render failed',
          });
        }
        return;
      }
    },
  });

  // 상태창 닫기
  const dismissStatusWindow = useCallback(() => {
    setWindowDismissed(true);
  }, []);

  // 상태창 다시 열기 (트리거 버튼용)
  const showStatusWindow = useCallback(() => {
    setWindowDismissed(false);
  }, []);

  // Visual Summary 생성 함수
  const generateVisualSummary = useCallback(
    (params: GenerateVisualSummaryParams) => {
      const {
        summary,
        template,
        sourceBlockId,
        sourceBlockPosition,
        sourceBlockSize,
        sourceTitle,
        sourceChannelName,
      } = params;

      const jobId = pushJob({
        type: 'visual-summary',
        status: 'running',
        tasks: [],
        error: null,
        resourceId: sourceBlockId,
        templateName: template.name,
      });
      currentJobIdRef.current = jobId;

      setTodos([]);
      setWindowDismissed(false);
      setCurrentRunSourceBlockId(sourceBlockId);
      setStatusOperationType('visual-summary');
      setStatusTemplateName(template.name);
      blockIdMapRef.current.clear();
      currentSessionRef.current = {
        sourceBlockId,
        sourceBlockPosition,
        sourceBlockSize,
      };

      const request: GenerateVisualSummaryRequest = {
        summary,
        templateId: template.id,
        templateSpec: template.promptSpec,
        pageId,
        sourceBlockId,
        sourceBlockPosition,
        sourceBlockSize,
        sourceTitle,
        sourceChannelName,
      };

      // 메시지 전송 (useChat의 sendMessage 사용)
      sendMessage({
        text: summary,
        metadata: {
          request,
        },
      });
    },
    [sendMessage, pageId, pushJob]
  );

  useEffect(() => {
    const id = currentJobIdRef.current;
    if (!id) return;
    if (status === 'ready' || status === 'error') {
      updateJob(id, {
        status: chatError ? 'failed' : 'completed',
        error: chatError || null,
      });
      currentJobIdRef.current = null;
    }
  }, [status, chatError, updateJob]);

  return {
    generateVisualSummary,
    isGenerating: status === 'submitted' || status === 'streaming',
    error: chatError || null,
    messages,
    todos,
    currentRunSourceBlockId,
    dismissStatusWindow,
    showStatusWindow,
    windowDismissed,
    statusOperationType,
    statusTemplateName,
  };
}
