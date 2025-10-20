import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleBlockRepository } from '../implementations/drizzle-block.repository';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { Metadata } from '../../../shared/value-objects/metadata.vo';
import { Block } from '../../../shared/entities/block.entity';

describe('DrizzleBlockRepository', () => {
  // 테스트용 고정 UUID (삭제 금지)
  const TEST_PROFILE_ID = '571f5680-0684-405d-b977-f6f28ff1df6f';
  const TEST_ORG_ID = 'ff215d4a-045d-499d-bf6b-07426bcc0b06';
  const TEST_WORKSPACE_ID = 'e4ee861a-4de1-42ce-820f-33866b136068';
  const TEST_PAGE_ID = '88597cb7-6828-480d-a77b-04db5ed5a142';

  let repository: DrizzleBlockRepository;
  let testBlockId: BlockId;

  beforeEach(async () => {
    repository = new DrizzleBlockRepository();
    testBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('save', () => {
    it('새로운 블럭을 저장할 수 있어야 한다', async () => {
      // Given
      const mockBlock = Block.create(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Test content' })
      );

      // When
      await repository.save(mockBlock);

      // Then
      const savedBlock = await repository.findById(testBlockId);
      expect(savedBlock).toBeTruthy();
      if (savedBlock) {
        expect(savedBlock.id.value).toBe(testBlockId.value);
        expect(savedBlock.workspaceId).toBe(TEST_WORKSPACE_ID);
        expect(savedBlock.blockType.value).toBe('text');
      }
    });

    it('기존 블럭을 업데이트할 수 있어야 한다', async () => {
      // Given - 먼저 블럭 생성
      const initialBlock = Block.create(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Initial content' })
      );
      await repository.save(initialBlock);

      // When - 블럭 업데이트
      const updatedBlock = Block.reconstitute(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Updated content' }),
        initialBlock.createdAt,
        new Date(),
        null
      );
      await repository.save(updatedBlock);

      // Then
      const result = await repository.findById(testBlockId);
      expect(result).toBeTruthy();
      if (result) {
        expect(result.metadata.value?.content).toBe('Updated content');
      }
    });
  });

  describe('findById', () => {
    it('존재하는 블럭을 찾을 수 있어야 한다', async () => {
      // Given
      const mockBlock = Block.create(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Test content' })
      );
      await repository.save(mockBlock);

      // When
      const result = await repository.findById(testBlockId);

      // Then
      expect(result).toBeTruthy();
      if (result) {
        expect(result.id.value).toBe(testBlockId.value);
        expect(result.workspaceId).toBe(TEST_WORKSPACE_ID);
      }
    });

    it('존재하지 않는 블럭은 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = new BlockId('660e8400-e29b-41d4-a716-446655440001');

      // When
      const result = await repository.findById(nonExistentId);

      // Then
      expect(result).toBeNull();
    });

    it('삭제된 블럭은 찾을 수 없어야 한다', async () => {
      // Given
      const mockBlock = Block.create(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Test content' })
      );
      await repository.save(mockBlock);
      
      // 블럭 삭제
      await repository.delete(testBlockId);

      // When
      const result = await repository.findById(testBlockId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findByWorkspaceId', () => {
    it('워크스페이스의 모든 블럭을 찾을 수 있어야 한다', async () => {
      // Given
      const block1Id = new BlockId('550e8400-e29b-41d4-a716-446655440001');
      const block2Id = new BlockId('550e8400-e29b-41d4-a716-446655440002');
      
      const block1 = Block.create(
        block1Id,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Block 1' })
      );

      const block2 = Block.create(
        block2Id,
        TEST_WORKSPACE_ID,
        new BlockType('image'),
        new Metadata({ url: 'image.jpg' })
      );

      await repository.save(block1);
      await repository.save(block2);

      // When
      const blocks = await repository.findByWorkspaceId(TEST_WORKSPACE_ID);

      // Then
      expect(blocks.length).toBeGreaterThanOrEqual(2);
      const blockIds = blocks.map(b => b.id.value);
      expect(blockIds).toContain(block1Id.value);
      expect(blockIds).toContain(block2Id.value);
    });

    it('다른 워크스페이스의 블럭은 포함되지 않아야 한다', async () => {
      // Given
      const otherWorkspaceId = 'other-workspace-id';
      const block = Block.create(
        testBlockId,
        otherWorkspaceId,
        new BlockType('text'),
        new Metadata({ content: 'Test' })
      );
      await repository.save(block);

      // When
      const blocks = await repository.findByWorkspaceId(TEST_WORKSPACE_ID);

      // Then
      const hasOtherWorkspaceBlock = blocks.some(b => b.workspaceId === otherWorkspaceId);
      expect(hasOtherWorkspaceBlock).toBe(false);
    });
  });

  describe('delete', () => {
    it('블럭을 소프트 삭제할 수 있어야 한다', async () => {
      // Given
      const mockBlock = Block.create(
        testBlockId,
        TEST_WORKSPACE_ID,
        new BlockType('text'),
        new Metadata({ content: 'Test content' })
      );
      await repository.save(mockBlock);

      // When
      await repository.delete(testBlockId);

      // Then
      const result = await repository.findById(testBlockId);
      expect(result).toBeNull();
    });
  });

  describe('listBlocksByWorkspace', () => {
    it('페이징된 블럭 목록을 가져올 수 있어야 한다', async () => {
      // Given
      const blocks = [];
      for (let i = 0; i < 10; i++) {
        const blockId = new BlockId(`550e8400-e29b-41d4-a716-44665544000${i}`);
        const block = Block.create(
          blockId,
          TEST_WORKSPACE_ID,
          new BlockType('text'),
          new Metadata({ content: `Block ${i}` })
        );
        await repository.save(block);
        blocks.push(block);
      }

      // When
      const page1 = await repository.listBlocksByWorkspace(TEST_WORKSPACE_ID, 1, 5);

      // Then
      expect(page1.length).toBeLessThanOrEqual(5);
    });
  });
});
