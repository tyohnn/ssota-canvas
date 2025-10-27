import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleBlockRepository } from '../drizzle-block.repository';
import { Block } from '../../../../shared/entities/block.entity';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../../shared/value-objects/block-type.vo';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('DrizzleBlockRepository - Integration Tests', () => {
  let repository: DrizzleBlockRepository;
  let testBlock: Block;

  beforeEach(async () => {
    repository = new DrizzleBlockRepository();
    
    // 테스트용 블록 생성
    const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
    const blockType = new BlockType('basic');
    testBlock = Block.create(blockId, 'test-workspace', blockType, {
      title: 'Test Block',
      description: 'Test Description'
    });
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    try {
      await adminDb.delete(blocks).where(eq(blocks.id, testBlock.id.value));
    } catch (error) {
      // 이미 삭제된 경우 무시
    }
  });

  describe('updateBlock', () => {
    it('블록 정보를 성공적으로 업데이트해야 한다', async () => {
      // Given
      await repository.save(testBlock);
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        properties: { content: 'Updated content' }
      };

      // When
      await repository.updateBlock(testBlock.id, updateData);

      // Then
      const updatedBlock = await repository.findById(testBlock.id);
      expect(updatedBlock).not.toBeNull();
      expect(updatedBlock!.properties.title).toBe('Updated Title');
      expect(updatedBlock!.properties.description).toBe('Updated Description');
      expect(updatedBlock!.properties.content).toBe('Updated content');
    });

    it('존재하지 않는 블록 ID에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = new BlockId('550e8400-e29b-41d4-a716-446655440001');
      const updateData = { title: 'Updated Title' };

      // When & Then
      await expect(repository.updateBlock(nonExistentId, updateData))
        .rejects.toThrow('Block not found');
    });

    it('null 또는 undefined 블록 ID에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      const updateData = { title: 'Updated Title' };

      // When & Then
      await expect(repository.updateBlock(null as any, updateData))
        .rejects.toThrow('Block ID cannot be null or undefined');
      await expect(repository.updateBlock(undefined as any, updateData))
        .rejects.toThrow('Block ID cannot be null or undefined');
    });

    it('null 또는 undefined 업데이트 데이터에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      await repository.save(testBlock);

      // When & Then
      await expect(repository.updateBlock(testBlock.id, null as any))
        .rejects.toThrow('Update data cannot be null or undefined');
      await expect(repository.updateBlock(testBlock.id, undefined as any))
        .rejects.toThrow('Update data cannot be null or undefined');
    });
  });

  describe('updateBlockType', () => {
    it('블록 타입을 성공적으로 변경해야 한다', async () => {
      // Given
      await repository.save(testBlock);
      const newBlockType = new BlockType('markdown');

      // When
      await repository.updateBlockType(testBlock.id, newBlockType);

      // Then
      const updatedBlock = await repository.findById(testBlock.id);
      expect(updatedBlock).not.toBeNull();
      expect(updatedBlock!.blockType.value).toBe('markdown');
    });

    it('존재하지 않는 블록 ID에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = new BlockId('550e8400-e29b-41d4-a716-446655440001');
      const newBlockType = new BlockType('markdown');

      // When & Then
      await expect(repository.updateBlockType(nonExistentId, newBlockType))
        .rejects.toThrow('Block not found');
    });
  });

  describe('markAsDeleted', () => {
    it('블록을 소프트 삭제해야 한다', async () => {
      // Given
      await repository.save(testBlock);

      // When
      await repository.markAsDeleted(testBlock.id);

      // Then
      const deletedBlock = await repository.findById(testBlock.id);
      expect(deletedBlock).not.toBeNull();
      expect(deletedBlock!.isDeleted()).toBe(true);
    });

    it('존재하지 않는 블록 ID에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = new BlockId('550e8400-e29b-41d4-a716-446655440001');

      // When & Then
      await expect(repository.markAsDeleted(nonExistentId))
        .rejects.toThrow('Block not found');
    });
  });

  describe('restore', () => {
    it('삭제된 블록을 복원해야 한다', async () => {
      // Given
      await repository.save(testBlock);
      await repository.markAsDeleted(testBlock.id);

      // When
      await repository.restore(testBlock.id);

      // Then
      const restoredBlock = await repository.findById(testBlock.id);
      expect(restoredBlock).not.toBeNull();
      expect(restoredBlock!.isDeleted()).toBe(false);
    });

    it('존재하지 않는 블록 ID에 대해 예외를 발생시켜야 한다', async () => {
      // Given
      const nonExistentId = new BlockId('550e8400-e29b-41d4-a716-446655440001');

      // When & Then
      await expect(repository.restore(nonExistentId))
        .rejects.toThrow('Block not found');
    });
  });
});
