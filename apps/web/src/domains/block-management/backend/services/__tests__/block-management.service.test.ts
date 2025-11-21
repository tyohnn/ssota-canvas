import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockManagementService } from '../block-management.service';
import { BlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Block } from '../../../shared/entities/block.entity';
import { BlockAggregate } from '../../../shared/aggregates/block.aggregate';
import { BlockManagementError } from '../../../shared/errors/block-management.error';

// Mock Repository
const mockRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByWorkspaceId: vi.fn(),
  findByBlockType: vi.fn(),
  delete: vi.fn(),
  hardDelete: vi.fn(),
  restore: vi.fn()
} as any;

describe('BlockManagementService', () => {
  let service: BlockManagementService;
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: WorkspaceId;
  let userId: UserId;
  let block: Block;

  beforeEach(() => {
    service = new BlockManagementService(mockRepository);
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
    userId = new UserId('550e8400-e29b-41d4-a716-446655440020');
    block = Block.create(blockId, workspaceId, userId, blockType, 'Test Video');
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createBlock', () => {
    it('should create a new block successfully', async () => {
      mockRepository.create.mockResolvedValue(undefined);

      const result = await service.createBlock({
        userId,
        workspaceId,
        blockType,
        title: 'Test Video'
      });

      expect(result).toBeInstanceOf(BlockAggregate);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createBlock({
        userId,
        workspaceId,
        blockType,
        title: 'Test Video'
      })).rejects.toThrow(BlockManagementError);
    });
  });

  describe('getBlock', () => {
    it('should return block when found', async () => {
      mockRepository.findById.mockResolvedValue(block);

      const result = await service.getBlock(blockId);

      expect(result).toBeInstanceOf(BlockAggregate);
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
      mockRepository.update.mockResolvedValue(undefined);

      await service.updateBlock(blockId, {
        properties: {}
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateBlock(blockId, {})).rejects.toThrow(BlockManagementError);
    });

    it('should throw error when save fails', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.updateBlock(blockId, {})).rejects.toThrow(BlockManagementError);
    });
  });

  describe('softDeleteBlock', () => {
    it('should delete block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.update.mockResolvedValue(undefined);

      await service.softDeleteBlock(blockId);

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.softDeleteBlock(blockId)).rejects.toThrow(BlockManagementError);
    });
  });

  describe('restoreBlock', () => {
    it('should restore deleted block successfully', async () => {
      const deletedBlock = Block.create(blockId, workspaceId, userId, blockType);
      deletedBlock.markAsDeleted();
      
      mockRepository.findById.mockResolvedValue(deletedBlock);
      mockRepository.update.mockResolvedValue(undefined);

      await service.restoreBlock(blockId);

      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('duplicateBlock', () => {
    it('should duplicate block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.create.mockResolvedValue(undefined);

      const result = await service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId
      });

      expect(result).toBeInstanceOf(Block);
      expect(mockRepository.findById).toHaveBeenCalledWith(blockId);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error when original block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId
      })).rejects.toThrow(BlockManagementError);
    });

    it('should throw error when save fails', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.duplicateBlock({
        originalBlockId: blockId,
        workspaceId,
        userId
      })).rejects.toThrow(BlockManagementError);
    });
  });
});