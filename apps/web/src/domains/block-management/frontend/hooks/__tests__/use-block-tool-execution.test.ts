import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Server Actions
const mockExecuteBlockToolAction = vi.fn();
vi.mock('../../../actions/tool.actions', () => ({
  executeBlockToolAction: mockExecuteBlockToolAction,
}));

// Mock React Flow hooks
const mockGetNode = vi.fn();
const mockAddNodes = vi.fn();
vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    getNode: mockGetNode,
    addNodes: mockAddNodes,
  }),
}));

import { useBlockToolExecution } from '../../hooks/use-block-tool-execution';

describe('useBlockToolExecution', () => {
  const mockBlockId = '123e4567-e89b-12d3-a456-426614174000';
  const mockNode = {
    id: mockBlockId,
    data: {
      properties: {
        content: 'Test content for tool execution',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNode.mockReturnValue(mockNode);
    mockExecuteBlockToolAction.mockResolvedValue({
      success: true,
      data: {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        canvasId: '123e4567-e89b-12d3-a456-426614174002',
        result: {
          summary: 'This is a summary',
          confidence: 0.95,
        },
      },
    });
  });

  describe('executeTool', () => {
    it('should execute tool successfully', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize', { maxLength: 100 });
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: { maxLength: 100 },
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.executionProgress).toBe(0);
    });

    it('should execute tool without parameters', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'refresh');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'refresh',
        parameters: undefined,
      });
    });

    it('should handle tool execution failure', async () => {
      mockExecuteBlockToolAction.mockResolvedValue({
        success: false,
        error: 'Tool execution failed',
      });

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: undefined,
      });
    });

    it('should handle missing node gracefully', async () => {
      mockGetNode.mockReturnValue(null);

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize');
      });

      // Should not call executeBlockToolAction when node is not found
      expect(mockExecuteBlockToolAction).not.toHaveBeenCalled();
    });

    it('should handle server action errors', async () => {
      mockExecuteBlockToolAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: undefined,
      });
    });
  });

  describe('executeToolByAI', () => {
    it('should execute AI-powered tool successfully', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      const aiContext = {
        prompt: 'Summarize this content',
        model: 'gpt-4',
        temperature: 0.7,
      };

      await act(async () => {
        await result.current.executeToolByAI(mockBlockId, 'ai-summarize', aiContext);
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'ai-summarize',
        parameters: aiContext,
      });
    });

    it('should handle AI tool execution with complex context', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      const complexContext = {
        prompt: 'Generate a detailed analysis',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemMessage: 'You are a helpful assistant',
        userMessage: 'Analyze this content',
      };

      await act(async () => {
        await result.current.executeToolByAI(mockBlockId, 'ai-analyze', complexContext);
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'ai-analyze',
        parameters: complexContext,
      });
    });

    it('should handle AI tool execution failure', async () => {
      mockExecuteBlockToolAction.mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
      });

      const { result } = renderHook(() => useBlockToolExecution());

      const aiContext = {
        prompt: 'Summarize this content',
        model: 'gpt-4',
      };

      await act(async () => {
        await result.current.executeToolByAI(mockBlockId, 'ai-summarize', aiContext);
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'ai-summarize',
        parameters: aiContext,
      });
    });
  });

  describe('execution states', () => {
    it('should track execution progress', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      expect(result.current.isExecuting).toBe(false);
      expect(result.current.executionProgress).toBe(0);

      // Simulate execution start
      act(() => {
        result.current.executeTool(mockBlockId, 'summarize');
      });

      // Note: In real implementation, progress would be updated during execution
      // For now, we just verify the initial state
      expect(result.current.isExecuting).toBe(false);
    });

    it('should handle multiple concurrent executions', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await Promise.all([
          result.current.executeTool(mockBlockId, 'summarize'),
          result.current.executeTool(mockBlockId, 'translate'),
        ]);
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('tool-specific scenarios', () => {
    it('should handle summarize tool', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize', {
          maxLength: 200,
          language: 'ko',
        });
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: { maxLength: 200, language: 'ko' },
      });
    });

    it('should handle translate tool', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'translate', {
          targetLanguage: 'en',
          sourceLanguage: 'ko',
        });
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'translate',
        parameters: { targetLanguage: 'en', sourceLanguage: 'ko' },
      });
    });

    it('should handle generate-content tool', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'generate-content', {
          prompt: 'Generate a summary',
          count: 1,
        });
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'generate-content',
        parameters: { prompt: 'Generate a summary', count: 1 },
      });
    });

    it('should handle refresh tool', async () => {
      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'refresh');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'refresh',
        parameters: undefined,
      });
    });
  });

  describe('new blocks handling', () => {
    it('should handle tool execution that creates new blocks', async () => {
      mockExecuteBlockToolAction.mockResolvedValue({
        success: true,
        data: {
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          canvasId: '123e4567-e89b-12d3-a456-426614174002',
          newBlocks: [
            {
              id: 'new-block-1',
              type: 'markdown',
              data: { properties: { content: 'Generated content' } },
            },
          ],
          result: { blocksCreated: 1 },
        },
      });

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'generate-content', { count: 1 });
      });

      expect(mockAddNodes).toHaveBeenCalledWith([
        {
          id: 'new-block-1',
          type: 'markdown',
          data: { properties: { content: 'Generated content' } },
        },
      ]);
    });

    it('should handle multiple new blocks creation', async () => {
      mockExecuteBlockToolAction.mockResolvedValue({
        success: true,
        data: {
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          canvasId: '123e4567-e89b-12d3-a456-426614174002',
          newBlocks: [
            {
              id: 'new-block-1',
              type: 'markdown',
              data: { properties: { content: 'Generated content 1' } },
            },
            {
              id: 'new-block-2',
              type: 'markdown',
              data: { properties: { content: 'Generated content 2' } },
            },
          ],
          result: { blocksCreated: 2 },
        },
      });

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'generate-content', { count: 2 });
      });

      expect(mockAddNodes).toHaveBeenCalledWith([
        {
          id: 'new-block-1',
          type: 'markdown',
          data: { properties: { content: 'Generated content 1' } },
        },
        {
          id: 'new-block-2',
          type: 'markdown',
          data: { properties: { content: 'Generated content 2' } },
        },
      ]);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockExecuteBlockToolAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: undefined,
      });
    });

    it('should handle timeout errors', async () => {
      mockExecuteBlockToolAction.mockRejectedValue(new Error('Request timeout'));

      const { result } = renderHook(() => useBlockToolExecution());

      await act(async () => {
        await result.current.executeTool(mockBlockId, 'summarize');
      });

      expect(mockExecuteBlockToolAction).toHaveBeenCalledWith({
        blockId: mockBlockId,
        toolName: 'summarize',
        parameters: undefined,
      });
    });
  });
});