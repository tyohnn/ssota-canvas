import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateBlockInfoAction, changeBlockTypeAction } from '../block.actions';
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockType } from '../../shared/value-objects/block-type.vo';
import { ActionResult, ok, err } from '@/lib/action-result';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    }
  }))
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('../../backend/repositories/implementations/drizzle-block.repository', () => ({
  DrizzleBlockRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    updateBlock: vi.fn(),
    updateBlockType: vi.fn()
  }))
}));

describe('Block Management Server Actions - Update Operations', () => {
  let mockBlockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockBlockRepository = {
      findById: vi.fn(),
      updateBlock: vi.fn(),
      updateBlockType: vi.fn()
    };
  });

  describe('updateBlockInfoAction', () => {
    it('유효한 요청으로 블록을 성공적으로 업데이트해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        properties: { content: 'Updated content' }
      };

      mockBlockRepository.updateBlock.mockResolvedValue(undefined);

      // When
      const result = await updateBlockInfoAction(blockId, updateData);

      // Then
      expect(result.success).toBe(true);
      expect(mockBlockRepository.updateBlock).toHaveBeenCalledWith(
        expect.any(BlockId),
        updateData
      );
    });

    it('존재하지 않는 블록 ID에 대해 에러를 반환해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440001';
      const updateData = { title: 'Updated Title' };

      mockBlockRepository.updateBlock.mockRejectedValue(new Error('Block not found'));

      // When
      const result = await updateBlockInfoAction(blockId, updateData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toBe('Block not found');
    });

    it('null 또는 undefined 블록 ID에 대해 에러를 반환해야 한다', async () => {
      // Given
      const updateData = { title: 'Updated Title' };

      // When
      const result = await updateBlockInfoAction(null as any, updateData);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid block ID');
    });

    it('null 또는 undefined 업데이트 데이터에 대해 에러를 반환해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const result = await updateBlockInfoAction(blockId, null as any);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid update data');
    });
  });

  describe('changeBlockTypeAction', () => {
    it('유효한 요청으로 블록 타입을 성공적으로 변경해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const newBlockType = 'markdown';

      mockBlockRepository.updateBlockType.mockResolvedValue(undefined);

      // When
      const result = await changeBlockTypeAction(blockId, newBlockType);

      // Then
      expect(result.success).toBe(true);
      expect(mockBlockRepository.updateBlockType).toHaveBeenCalledWith(
        expect.any(BlockId),
        expect.any(BlockType)
      );
    });

    it('존재하지 않는 블록 ID에 대해 에러를 반환해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440001';
      const newBlockType = 'markdown';

      mockBlockRepository.updateBlockType.mockRejectedValue(new Error('Block not found'));

      // When
      const result = await changeBlockTypeAction(blockId, newBlockType);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toBe('Block not found');
    });

    it('유효하지 않은 블록 타입에 대해 에러를 반환해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';
      const newBlockType = 'invalid-type';

      // When
      const result = await changeBlockTypeAction(blockId, newBlockType);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid block type');
    });

    it('null 또는 undefined 블록 ID에 대해 에러를 반환해야 한다', async () => {
      // Given
      const newBlockType = 'markdown';

      // When
      const result = await changeBlockTypeAction(null as any, newBlockType);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid block ID');
    });

    it('null 또는 undefined 블록 타입에 대해 에러를 반환해야 한다', async () => {
      // Given
      const blockId = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const result = await changeBlockTypeAction(blockId, null as any);

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid block type');
    });
  });
});
