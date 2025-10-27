import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
} from '../block.actions';
import type { CreateBlockRequest, UpdateBlockRequest } from '../../shared/types';

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock repository
const mockBlockRepository = {
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
};

vi.mock('../../infrastructure/block.repository', () => mockBlockRepository);

describe('Block Actions', () => {
  let blockId: string;
  let workspaceId: string;
  let canvasId: string;

  beforeEach(() => {
    blockId = '123e4567-e89b-12d3-a456-426614174000';
    workspaceId = '123e4567-e89b-12d3-a456-426614174001';
    canvasId = '123e4567-e89b-12d3-a456-426614174002';
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createBlockAction', () => {
    it('should create a block successfully', async () => {
      const mockResult = {
        id: blockId,
        workspaceId,
        canvasId,
        type: 'youtube',
        position: { x: 0, y: 0 },
        properties: { title: 'Test Video' },
        customProperties: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockBlockRepository.createBlock.mockResolvedValue(mockResult);

      const result = await createBlockAction({
        workspaceId,
        canvasId,
        type: 'youtube',
        position: { x: 0, y: 0 },
        properties: { title: 'Test Video' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockBlockRepository.createBlock).toHaveBeenCalledWith({
        workspaceId,
        canvasId,
        type: 'youtube',
        position: { x: 0, y: 0 },
        properties: { title: 'Test Video' },
      });
    });

    it('should return error when validation fails', async () => {
      const result = await createBlockAction({
        workspaceId: 'invalid-uuid',
        canvasId,
        type: 'youtube',
        position: { x: 0, y: 0 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid uuid');
    });

    it('should return error when repository fails', async () => {
      mockBlockRepository.createBlock.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await createBlockAction({
        workspaceId,
        canvasId,
        type: 'youtube',
        position: { x: 0, y: 0 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });

  describe('updateBlockAction', () => {
    it('should update a block successfully', async () => {
      const mockResult = {
        id: blockId,
        workspaceId,
        canvasId: 'canvas-id',
        type: 'youtube',
        position: { x: 0, y: 0 },
        properties: { title: 'Updated Title' },
        customProperties: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockBlockRepository.updateBlock.mockResolvedValue(mockResult);

      const result = await updateBlockAction({
        blockId,
        properties: { title: 'Updated Title' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockBlockRepository.updateBlock).toHaveBeenCalledWith({
        blockId,
        properties: { title: 'Updated Title' },
      });
    });

    it('should return error when validation fails', async () => {
      const result = await updateBlockAction({
        blockId: 'invalid-uuid',
        properties: { title: 'Updated Title' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid uuid');
    });

    it('should return error when repository fails', async () => {
      mockBlockRepository.updateBlock.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await updateBlockAction({
        blockId,
        properties: { title: 'Updated Title' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });

  describe('deleteBlockAction', () => {
    it('should delete a block successfully', async () => {
      mockBlockRepository.deleteBlock.mockResolvedValue(undefined);

      const result = await deleteBlockAction(blockId);

      expect(result.success).toBe(true);
      expect(mockBlockRepository.deleteBlock).toHaveBeenCalledWith(blockId);
    });

    it('should return error when repository fails', async () => {
      mockBlockRepository.deleteBlock.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await deleteBlockAction(blockId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });
});