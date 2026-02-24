import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateBlockPropertyAction } from '../block/update-block-property.action';
import { updateBlockTitleAction } from '../block/update-block-title.action';

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock repositories and services (slug 기반 조회)
const mockBlockRepository = {
  findById: vi.fn(),
  findByWorkspaceIdAndSlug: vi.fn(),
  save: vi.fn(),
};

const mockBlockManagementService = {
  updateBlock: vi.fn(),
};

const mockBlockPropertyService = {
  updateProperty: vi.fn(),
};

vi.mock('../../backend/repositories/implementations/drizzle-block.repository', () => ({
  DrizzleBlockRepository: vi.fn(() => mockBlockRepository),
}));

vi.mock('../../backend/services/blocks', () => ({
  BlockManagementService: vi.fn(() => mockBlockManagementService),
  BlockPropertyService: vi.fn(() => mockBlockPropertyService),
}));

describe('Block Actions', () => {
  const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
  const blockSlug = '550e8400';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateBlockPropertyAction', () => {
    it('should update a block property successfully', async () => {
      const mockBlock = {
        id: { value: '123e4567-e89b-12d3-a456-426614174000' },
        getSlug: () => blockSlug,
        properties: { toJSON: () => ({ title: 'Updated Title' }) },
        customProperties: [],
        workspaceId: { value: workspaceId },
        blockType: { value: 'text' },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: undefined,
      };

      mockBlockRepository.findByWorkspaceIdAndSlug.mockResolvedValue(mockBlock);

      const result = await updateBlockPropertyAction({
        workspaceId,
        blockId: blockSlug,
        propertyPath: 'title',
        value: 'Updated Title',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blockId).toBe(blockSlug);
        expect(result.data.propertyPath).toBe('title');
        expect(result.data.value).toBe('Updated Title');
      }
    });

    it('should return error when validation fails', async () => {
      const result = await updateBlockPropertyAction({
        workspaceId,
        blockId: 'invalid-slug',
        propertyPath: 'title',
        value: 'Updated Title',
      });

      expect(result.success).toBe(false);
    });

    it('should return error when block not found', async () => {
      mockBlockRepository.findByWorkspaceIdAndSlug.mockResolvedValue(null);

      const result = await updateBlockPropertyAction({
        workspaceId,
        blockId: blockSlug,
        propertyPath: 'title',
        value: 'Updated Title',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateBlockTitleAction', () => {
    it('should update a block title successfully', async () => {
      const mockBlock = {
        id: { value: '123e4567-e89b-12d3-a456-426614174000' },
        getSlug: () => blockSlug,
        title: 'Updated Title',
        updatedAt: new Date(),
      };

      mockBlockRepository.findByWorkspaceIdAndSlug.mockResolvedValue(mockBlock);

      const result = await updateBlockTitleAction({
        workspaceId,
        blockId: blockSlug,
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blockId).toBe(blockSlug);
        expect(result.data.title).toBe('Updated Title');
      }
    });

    it('should return error when validation fails', async () => {
      const result = await updateBlockTitleAction({
        workspaceId,
        blockId: 'x',
        title: 'Updated Title',
      });

      expect(result.success).toBe(false);
    });

    it('should return error when block not found', async () => {
      mockBlockRepository.findByWorkspaceIdAndSlug.mockResolvedValue(null);

      const result = await updateBlockTitleAction({
        workspaceId,
        blockId: blockSlug,
        title: 'Updated Title',
      });

      expect(result.success).toBe(false);
    });
  });
});