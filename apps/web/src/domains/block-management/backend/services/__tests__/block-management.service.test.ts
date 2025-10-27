import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockManagementService } from '../block-management.service';
import { BlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { Block } from '../../../shared/entities/block.entity';
import { BlockManagementError } from '../../../shared/errors/block-management.error';

// Mock Repository
const mockRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByWorkspaceId: vi.fn(),
  findByBlockType: vi.fn(),
  delete: vi.fn(),
  hardDelete: vi.fn(),
  exists: vi.fn(),
  countByWorkspaceId: vi.fn()
} as any;

describe('BlockManagementService', () => {
  let service: BlockManagementService;
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: string;
  let block: Block;

  beforeEach(() => {
    service = new BlockManagementService(mockRepository);
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = 'workspace-123';
    block = Block.create(blockId, workspaceId, blockType, { title: 'Test Video' });
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createBlock', () => {
    it('should create a new block successfully', async () => {
      mockRepository.save.mockResolvedValue(undefined);

      const result = await service.createBlock({
        blockType: 'youtube',
        workspaceId,
        metadata: { title: 'Test Video' },
        userId: 'user-123'
      });

      expect(result.id).toBeDefined();
      expect(result.blockType).toBe('youtube');
      expect(result.metadata.title).toBe('Test Video');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createBlock({
        blockType: 'youtube',
        workspaceId,
        metadata: {},
        userId: 'user-123'
      })).rejects.toThrow(BlockManagementError);
    });
  });

  describe('getBlock', () => {
    it('should return block when found', async () => {
      mockRepository.findById.mockResolvedValue(block);

      const result = await service.getBlock(blockId);

      expect(result).toBeDefined();
      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
    });

    it('should throw error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getBlock(blockId)).rejects.toThrow(BlockManagementError);
    });

    it('should throw error when fetch fails', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.getBlock(blockId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('updateBlock', () => {
    it('should update block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.save.mockResolvedValue(undefined);

      await service.updateBlock(blockId, {
        properties: { title: 'Updated Title' }
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateBlock(blockId, {})).rejects.toThrow(BlockManagementError);
    });

    it('should throw error when save fails', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateBlock(blockId, {})).rejects.toThrow(BlockManagementError);
    });
  });

  describe('deleteBlock', () => {
    it('should delete block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.save.mockResolvedValue(undefined);

      await service.deleteBlock(blockId);

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteBlock(blockId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('restoreBlock', () => {
    it('should restore deleted block successfully', async () => {
      const deletedBlock = Block.create(blockId, workspaceId, blockType);
      deletedBlock.markAsDeleted();
      
      mockRepository.findById.mockResolvedValue(deletedBlock);
      mockRepository.save.mockResolvedValue(undefined);

      await service.restoreBlock(blockId);

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getBlocksByWorkspace', () => {
    it('should return blocks for workspace', async () => {
      const blocks = [block];
      mockRepository.findByWorkspaceId.mockResolvedValue(blocks);

      const result = await service.getBlocksByWorkspace(workspaceId);

      expect(result).toHaveLength(1);
      expect(mockRepository.findByWorkspaceId).toHaveBeenCalledWith(workspaceId, false);
    });

    it('should include deleted blocks when requested', async () => {
      const blocks = [block];
      mockRepository.findByWorkspaceId.mockResolvedValue(blocks);

      await service.getBlocksByWorkspace(workspaceId, true);

      expect(mockRepository.findByWorkspaceId).toHaveBeenCalledWith(workspaceId, true);
    });

    it('should throw error when fetch fails', async () => {
      mockRepository.findByWorkspaceId.mockRejectedValue(new Error('Database error'));

      await expect(service.getBlocksByWorkspace(workspaceId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('getBlocksByType', () => {
    it('should return blocks for specific type', async () => {
      const blocks = [block];
      mockRepository.findByBlockType.mockResolvedValue(blocks);

      const result = await service.getBlocksByType(workspaceId, blockType.value);

      expect(result).toHaveLength(1);
      expect(mockRepository.findByBlockType).toHaveBeenCalledWith(workspaceId, blockType.value, false);
    });

    it('should throw error when fetch fails', async () => {
      mockRepository.findByBlockType.mockRejectedValue(new Error('Database error'));

      await expect(service.getBlocksByType(workspaceId, blockType.value)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('blockExists', () => {
    it('should return true when block exists', async () => {
      mockRepository.exists.mockResolvedValue(true);

      const result = await service.blockExists(blockId);

      expect(result).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith(blockId);
    });

    it('should return false when block does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await service.blockExists(blockId);

      expect(result).toBe(false);
    });

    it('should throw error when check fails', async () => {
      mockRepository.exists.mockRejectedValue(new Error('Database error'));

      await expect(service.blockExists(blockId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('getBlockCount', () => {
    it('should return block count for workspace', async () => {
      mockRepository.countByWorkspaceId.mockResolvedValue(5);

      const result = await service.getBlockCount(workspaceId);

      expect(result).toBe(5);
      expect(mockRepository.countByWorkspaceId).toHaveBeenCalledWith(workspaceId, false);
    });

    it('should include deleted blocks when requested', async () => {
      mockRepository.countByWorkspaceId.mockResolvedValue(3);

      await service.getBlockCount(workspaceId, true);

      expect(mockRepository.countByWorkspaceId).toHaveBeenCalledWith(workspaceId, true);
    });

    it('should throw error when count fails', async () => {
      mockRepository.countByWorkspaceId.mockRejectedValue(new Error('Database error'));

      await expect(service.getBlockCount(workspaceId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('duplicateBlock', () => {
    it('should duplicate block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.save.mockResolvedValue(undefined);

      const result = await service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId: 'user-123'
      });

      expect(result.id).toBeDefined();
      expect(result.blockType).toBe(blockType.value);
      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when original block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId: 'user-123'
      })).rejects.toThrow(BlockManagementError);
    });

    it('should throw error when save fails', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId: 'user-123'
      })).rejects.toThrow(BlockManagementError);
    });
  });
});
