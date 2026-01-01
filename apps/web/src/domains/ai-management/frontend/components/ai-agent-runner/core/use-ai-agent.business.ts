'use client';

import { useCallback, useMemo } from 'react';

import { useChat } from '@ai-sdk/react';
import { useReactFlow } from '@xyflow/react';
import {
  DefaultChatTransport,
  UIMessage,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';

import { useBlockActionExecutor } from '@/domains/ai-management/frontend/hooks/use-block-action-executor';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/use-block-content-update';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/use-block-title-update';
import { useAutoPositionCalculator } from '@/domains/canvas-management/frontend/hooks/use-auto-position-calculator';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';

import { ToolHandlerContext, ToolHandlers } from './tool-handlers';
import { ClientContext } from './types';

/**
 * AI Agent Business Logic
 * Agent 실행 및 툴 호출 처리
 */
export interface AIAgentBusinessLogic {
  messages: UIMessage[];
  sendMessage: (text: string, context: ClientContext) => void;
  isAgentRunning: boolean;
  error: Error | null;
}

/**
 * Tool 결과에서 blockMountId 추출
 */
function extractBlockMountId(toolName: string, result: any): string | null {
  // addBlocks: data 배열의 첫 번째 블록의 blockMountId (단수/복수 모두 첫 번째만 선택)
  if (toolName === 'addBlocks' && result.data?.[0]?.blockMountId) {
    return result.data[0].blockMountId;
  }
  // updateTitle, updateContent: args에서 blockId (= blockMountId)
  // updateProperties: args에서 blockId (= blockMountId)
  // 이미 선택된 블록이므로 별도 선택 불필요
  return null;
}

/**
 * useAIAgentBusiness
 * Vercel AI SDK useChat 래핑 + 툴 실행 처리
 *
 * 특징:
 * - API 호출 (useChat)
 * - 툴 실행 처리 (onToolCall, addToolOutput)
 * - Canvas & Block Actions 연동
 * - 에러 처리
 */
export function useAIAgentBusiness(props: {
  pageId: string;
  workspaceId: string;
  organizationId: string;
}): AIAgentBusinessLogic {
  // Canvas & Block Actions Hooks
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId: props.pageId,
  });

  const edgeManagement = useCanvasEdgeLifecycle({
    pageId: props.pageId,
  });

  const { getNode, updateNode, getNodes, setNodes } = useReactFlow();

  const blockPropertyUpdate = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const blockTitleUpdate = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const blockContentUpdate = useUpdateBlockContent({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const positionCalculator = useAutoPositionCalculator();
  const blockActionExecutor = useBlockActionExecutor({
    blockLifecycle,
    blockPropertyUpdate,
    positionCalculator,
  });

  // Tool Handler Context 구성
  const toolContext: ToolHandlerContext = {
    blockLifecycle,
    edgeManagement,
    blockPropertyUpdate,
    blockTitleUpdate,
    blockContentUpdate,
    blockActionExecutor,
    positionCalculator,
    getNode,
    getNodes,
    organizationId: props.organizationId,
    workspaceId: props.workspaceId,
  };

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/agent',
      }),
    []
  );

  const {
    messages,
    sendMessage: useChatSendMessage,
    addToolResult, // ✅ 올바른 이름: addToolResult (addToolOutput이 아님!)
    status,
    error: chatError,
  } = useChat({
    transport: chatTransport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // 디버깅: 에러 로깅
    onError: error => {
      console.error('[useAIAgentBusiness] Error:', error);
    },

    // ✅ 클라이언트에서 툴 실행 (Canvas & Block Actions 연동)
    onToolCall: async ({ toolCall }) => {
      // 모든 툴을 캡슐화된 핸들러로 처리
      try {
        const tc = toolCall as any;
        const actualArgs = tc.args || tc.input || {};

        const handler =
          ToolHandlers[toolCall.toolName as keyof typeof ToolHandlers];
        if (!handler) {
          throw new Error(`Unknown tool: ${toolCall.toolName}`);
        }

        const result = await handler(actualArgs, toolContext);

        // Tool 실행 성공 후 블록을 선택 상태로 변경
        if (result.success) {
          const blockMountId = extractBlockMountId(toolCall.toolName, result);
          if (blockMountId) {
            // 해당 블록을 선택 상태로 변경
            setNodes(nodes =>
              nodes.map(node => ({
                ...node,
                selected: node.id === blockMountId,
              }))
            );
          }
        }

        // 🎯 OPTIMIZED: Object 형태로 전달 (JSON string 아님)
        // - UI: output.message 표시
        // - AI: 전체 정보 활용
        // tool-handlers.ts에서 이미 data를 포함하여 반환하므로 그대로 사용
        const toolOutput = (() => {
          if (!result.success) {
            return { message: result.message, success: false };
          }

          const baseOutput: {
            message: string;
            success: boolean;
            data?: Record<string, any>[];
          } = {
            message: result.message,
            success: true,
          };

          // tool-handlers.ts에서 반환한 data를 그대로 포함
          if ('data' in result && result.data) {
            baseOutput.data = result.data as Record<string, any>[];
          }

          return baseOutput;
        })();

        console.log(`[Tool Result] ${toolCall.toolName}:`, toolOutput);

        addToolResult({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: toolOutput,
        });
      } catch (error) {
        // 에러 시 addToolResult로 에러 전달
        addToolResult({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  });

  /**
   * 메시지 전송
   * Client Context를 metadata로 전달
   */
  const sendMessage = useCallback(
    (text: string, context: ClientContext) => {
      useChatSendMessage({
        text,
        metadata: {
          clientContext: context,
        },
      });
    },
    [useChatSendMessage]
  );

  return {
    messages,
    sendMessage,
    isAgentRunning: status === 'submitted' || status === 'streaming', // ✅ status로 실행 중 여부 판단
    error: chatError || null, // ✅ useChat의 error 상태 사용
  };
}

/**
 * useMockAIAgentBusiness
 * Mock 비즈니스 로직 (NoCode 툴용)
 */
export function useMockAIAgentBusiness(): AIAgentBusinessLogic {
  const sendMessage = useCallback((text: string, context: ClientContext) => {
    console.log('[Mock] Sending message:', text, context);
  }, []);

  return {
    messages: [],
    sendMessage,
    isAgentRunning: false,
    error: null,
  };
}
