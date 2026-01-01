import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateBlockPropertyAction } from '../block/update-block-property.action';
import { updateBlockTitleAction } from '../block/update-block-title.action';

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock repositories and services
const mockBlockRepository = {
  findById: vi.fn(),
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

vi.mock('../../backend/services/block-management.service', () => ({
  BlockManagementService: vi.fn(() => mockBlockManagementService),
}));

vi.mock('../../backend/services/block-property.service', () => ({
  BlockPropertyService: vi.fn(() => mockBlockPropertyService),
}));

describe('Block Actions', () => {
  const blockId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateBlockPropertyAction', () => {
    it('should update a block property successfully', async () => {
      const mockBlock = {
        id: { value: blockId },
        properties: { toJSON: () => ({ title: 'Updated Title' }) },
        customProperties: [],
        workspaceId: 'workspace-123',
        blockType: { value: 'text' },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: undefined,
      };
      
      mockBlockRepository.findById.mockResolvedValue(mockBlock);

      const result = await updateBlockPropertyAction({
        blockId,
        propertyPath: 'title',
        value: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blockId).toBe(blockId);
        expect(result.data.propertyPath).toBe('title');
        expect(result.data.value).toBe('Updated Title');
      }
    });

    it('should return error when validation fails', async () => {
      const result = await updateBlockPropertyAction({
        blockId: 'invalid-uuid',
        propertyPath: 'title',
        value: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
    });

    it('should return error when block not found', async () => {
      mockBlockRepository.findById.mockResolvedValue(null);

      const result = await updateBlockPropertyAction({
        blockId,
        propertyPath: 'title',
        value: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateBlockTitleAction', () => {
    it('should update a block title successfully', async () => {
      const mockBlock = {
        id: { value: blockId },
        title: 'Updated Title',
        updatedAt: new Date(),
      };

      mockBlockRepository.findById.mockResolvedValue(mockBlock);

      const result = await updateBlockTitleAction({
        blockId,
        title: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blockId).toBe(blockId);
        expect(result.data.title).toBe('Updated Title');
      }
    });

    it('should return error when validation fails', async () => {
      const result = await updateBlockTitleAction({
        blockId: 'invalid-uuid',
        title: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
    });

    it('should return error when block not found', async () => {
      mockBlockRepository.findById.mockResolvedValue(null);

      const result = await updateBlockTitleAction({
        blockId,
        title: 'Updated Title',
        pageId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(false);
    });
  });
});