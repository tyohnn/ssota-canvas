'use client';

import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { executeBlockToolAction } from '../../actions/tool.actions';

export interface UseBlockToolExecutionResult {
  executeTool: (
    blockId: string,
    toolName: string,
    parameters?: Record<string, any>
  ) => Promise<void>;
  executeToolByAI: (
    blockId: string,
    toolName: string,
    aiContext: Record<string, any>
  ) => Promise<void>;
  isExecuting: boolean;
  executionProgress: number;
}

/**
 * 블록 툴 실행 Hook
 *
 * - 툴 실행 진행률 표시
 * - 실행 결과 처리
 * - 새 블록 생성 (Canvas Management 연동)
 */
export function useBlockToolExecution(): UseBlockToolExecutionResult {
  const { getNode, addNodes } = useReactFlow();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);

  const executeTool = useCallback(
    async (
      blockId: string,
      toolName: string,
      parameters?: Record<string, any>
    ): Promise<void> => {
      // Get current block data
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      setIsExecuting(true);
      setExecutionProgress(0);

      try {
        // Update progress
        setExecutionProgress(25);

        // Execute tool
        const result = await executeBlockToolAction({
          blockId,
          toolName,
          parameters,
        });

        setExecutionProgress(75);

        if (!result.success) {
          throw new Error(result.error || 'Tool execution failed');
        }

        // Add new blocks to canvas if any
        if (result.data?.newBlocks && result.data.newBlocks.length > 0) {
          const newBlocks = result.data.newBlocks.map((block: any) => ({
            id: block.id,
            type: block.type,
            data: block.data,
            position: block.position,
          }));

          addNodes(newBlocks);
        }

        setExecutionProgress(100);
      } catch (error) {
        setExecutionProgress(0);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [getNode, addNodes]
  );

  const executeToolByAI = useCallback(
    async (
      blockId: string,
      toolName: string,
      aiContext: Record<string, any>
    ): Promise<void> => {
      // Get current block data
      const blockNode = getNode(blockId);
      if (!blockNode) {
        throw new Error('Block not found');
      }

      setIsExecuting(true);
      setExecutionProgress(0);

      try {
        // Update progress
        setExecutionProgress(25);

        // Execute tool by AI
        const result = await executeBlockToolAction({
          blockId,
          toolName,
          parameters: aiContext,
        });

        setExecutionProgress(75);

        if (!result.success) {
          throw new Error(result.error || 'AI tool execution failed');
        }

        // Add new blocks to canvas if any
        if (result.data?.newBlocks && result.data.newBlocks.length > 0) {
          const newBlocks = result.data.newBlocks.map((block: any) => ({
            id: block.id,
            type: block.type,
            data: block.data,
            position: block.position,
          }));

          addNodes(newBlocks);
        }

        setExecutionProgress(100);
      } catch (error) {
        setExecutionProgress(0);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [getNode, addNodes]
  );

  return {
    executeTool,
    executeToolByAI,
    isExecuting,
    executionProgress,
  };
}
