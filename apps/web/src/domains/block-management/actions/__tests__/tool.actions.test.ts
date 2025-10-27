import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeBlockToolAction } from '../tool.actions';
import type { ExecuteBlockToolRequest } from '../../backend/repositories/interfaces/tool.repository.interface';

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock repository
const mockToolRepository = {
  executeBlockTool: vi.fn(),
  getToolExecutionHistory: vi.fn(),
  getLastToolExecution: vi.fn(),
};

vi.mock('../../backend/repositories/implementations/drizzle-tool.repository', () => ({
  DrizzleToolRepository: vi.fn().mockImplementation(() => mockToolRepository),
}));

describe('Tool Actions', () => {
  let blockId: string;
  let toolName: string;
  let parameters: Record<string, any>;

  beforeEach(() => {
    blockId = '123e4567-e89b-12d3-a456-426614174000';
    toolName = 'summarize';
    parameters = { maxLength: 100, language: 'ko' };
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('executeBlockToolAction', () => {
    it('should execute a block tool successfully', async () => {
      const mockResult = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        canvasId: '123e4567-e89b-12d3-a456-426614174002',
        newBlocks: [],
        result: {
          summary: 'This is a summary of the content',
          confidence: 0.95,
        },
      };
      
      mockToolRepository.executeBlockTool.mockResolvedValue(mockResult);

      const result = await executeBlockToolAction({
        blockId,
        toolName,
        parameters,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockToolRepository.executeBlockTool).toHaveBeenCalledWith({
        blockId,
        toolName,
        parameters,
      });
    });

    it('should execute a block tool without parameters', async () => {
      const mockResult = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        canvasId: '123e4567-e89b-12d3-a456-426614174002',
        newBlocks: [],
        result: {
          summary: 'This is a summary of the content',
          confidence: 0.95,
        },
      };
      
      mockToolRepository.executeBlockTool.mockResolvedValue(mockResult);

      const result = await executeBlockToolAction({
        blockId,
        toolName,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockToolRepository.executeBlockTool).toHaveBeenCalledWith({
        blockId,
        toolName,
        parameters: undefined,
      });
    });

    it('should return error when validation fails', async () => {
      const result = await executeBlockToolAction({
        blockId: 'invalid-uuid',
        toolName: '',
        parameters,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid uuid');
    });

    it('should return error when tool name is empty', async () => {
      const result = await executeBlockToolAction({
        blockId,
        toolName: '',
        parameters,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('String must contain at least 1 character(s)');
    });

    it('should return error when repository fails', async () => {
      mockToolRepository.executeBlockTool.mockRejectedValue(
        new Error('Tool execution failed')
      );

      const result = await executeBlockToolAction({
        blockId,
        toolName,
        parameters,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool execution failed');
    });

    it('should handle AI-powered tool execution', async () => {
      const aiParameters = {
        prompt: 'Summarize this content',
        model: 'gpt-4',
        temperature: 0.7,
      };
      
      const mockResult = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        canvasId: '123e4567-e89b-12d3-a456-426614174002',
        newBlocks: [],
        result: {
          summary: 'AI-generated summary',
          confidence: 0.92,
          model: 'gpt-4',
        },
      };
      
      mockToolRepository.executeBlockTool.mockResolvedValue(mockResult);

      const result = await executeBlockToolAction({
        blockId,
        toolName: 'ai-summarize',
        parameters: aiParameters,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockToolRepository.executeBlockTool).toHaveBeenCalledWith({
        blockId,
        toolName: 'ai-summarize',
        parameters: aiParameters,
      });
    });

    it('should handle tool execution with new blocks creation', async () => {
      const mockResult = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        canvasId: '123e4567-e89b-12d3-a456-426614174002',
        newBlocks: [
          {
            id: 'new-block-1',
            type: 'markdown',
            properties: { content: 'Generated content' },
          },
        ],
        result: {
          blocksCreated: 1,
          success: true,
        },
      };
      
      mockToolRepository.executeBlockTool.mockResolvedValue(mockResult);

      const result = await executeBlockToolAction({
        blockId,
        toolName: 'generate-content',
        parameters: { count: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.data?.newBlocks).toHaveLength(1);
    });
  });
});
