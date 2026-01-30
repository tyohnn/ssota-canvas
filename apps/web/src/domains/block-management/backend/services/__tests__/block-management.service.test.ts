import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Block } from '../../../shared/entities/block.entity';
import { BlockAggregate } from '../../../shared/aggregates/block.aggregate';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { createBlock } from '../block/lifecycle/create-block.service';
import { duplicateBlock } from '../block/lifecycle/duplicate-block.service';
import { restoreBlock } from '../block/lifecycle/restore-block.service';
import { softDeleteBlock } from '../block/lifecycle/soft-delete-block.service';

// Mock Repository
const mockRepository = {
  create: vi.fn(),
  createMany: vi.fn().mockResolvedValue([]),
  update: vi.fn(),
  findById: vi.fn(),
  findByIds: vi.fn(),
  findByWorkspaceId: vi.fn(),
  findByBlockType: vi.fn(),
  delete: vi.fn(),
  hardDelete: vi.fn(),
  restore: vi.fn(),
} as any;

describe('Block Management Service Functions', () => {
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: WorkspaceId;
  let userId: UserId;
  let block: Block;

  beforeEach(() => {
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

      const safeDto = {
        workspaceId: workspaceId.value,
        blockType: blockType.value,
        title: 'Test Video',
      };

      const result = await createBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(false);
      if (!result.isError()) {
        expect(result.value).toBeInstanceOf(BlockAggregate);
      }
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should return error when save fails', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      const safeDto = {
        workspaceId: workspaceId.value,
        blockType: blockType.value,
        title: 'Test Video',
      };

      const result = await createBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
      }
    });
  });



  describe('softDeleteBlock', () => {
    it('should delete block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.update.mockResolvedValue(undefined);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await softDeleteBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should return error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await softDeleteBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
      }
    });
  });

  describe('restoreBlock', () => {
    it('should restore deleted block successfully', async () => {
      const deletedBlock = Block.create(blockId, workspaceId, userId, blockType);
      deletedBlock.markAsDeleted();

      mockRepository.findById.mockResolvedValue(deletedBlock);
      mockRepository.update.mockResolvedValue(undefined);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await restoreBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should return error when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await restoreBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
      }
    });
  });

  describe('duplicateBlock', () => {
    it('should duplicate block successfully', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.create.mockResolvedValue(undefined);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await duplicateBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(false);
      if (!result.isError()) {
        expect(result.value).toBeInstanceOf(Block);
      }
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should return error when original block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await duplicateBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
      }
    });

    it('should return error when save fails', async () => {
      mockRepository.findById.mockResolvedValue(block);
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      const safeDto = {
        workspaceId: workspaceId.value,
        blockId: blockId.value,
      };

      const result = await duplicateBlock(safeDto, userId, mockRepository);

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(BlockManagementError);
      }
    });
  });
});