import { describe, it, expect, beforeEach } from 'vitest';
import { Block } from '../block.entity';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';
import { Metadata } from '../../value-objects/metadata.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('Block Entity', () => {
  let blockId: BlockId;
  let workspaceId: string;
  let blockType: BlockType;
  let metadata: Metadata;

  beforeEach(() => {
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    workspaceId = '123e4567-e89b-12d3-a456-426614174001';
    blockType = new BlockType('text');
    metadata = new Metadata({ content: 'Hello World' });
  });

  describe('create', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given & When
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // Then
      expect(block.id).toBe(blockId);
      expect(block.workspaceId).toBe(workspaceId);
      expect(block.blockType).toBe(blockType);
      expect(block.metadata).toBe(metadata);
    });

    it('생성 시점과 수정 시점이 기록되어야 한다', () => {
      // Given & When
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // Then
      expect(block.createdAt).toBeInstanceOf(Date);
      expect(block.updatedAt).toBeInstanceOf(Date);
      expect(block.deletedAt).toBeNull();
    });

    it('생성 시점과 수정 시점이 같아야 한다', () => {
      // Given & When
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // Then
      expect(block.createdAt.getTime()).toBe(block.updatedAt.getTime());
    });

    it('삭제 시점은 null이어야 한다', () => {
      // Given & When
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // Then
      expect(block.deletedAt).toBeNull();
      expect(block.isDeleted()).toBe(false);
    });

    it('null 메타데이터로 생성할 수 있어야 한다', () => {
      // Given & When
      const block = Block.create(
        blockId,
        workspaceId,
        blockType,
        new Metadata(null)
      );

      // Then
      expect(block.metadata.value).toBeNull();
    });

    it('빈 메타데이터로 생성할 수 있어야 한다', () => {
      // Given & When
      const block = Block.create(
        blockId,
        workspaceId,
        blockType,
        new Metadata({})
      );

      // Then
      expect(block.metadata.value).toEqual({});
    });
  });

  describe('updateBlockType', () => {
    it('새로운 타입으로 변경되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const newType = new BlockType('image');
      const originalUpdatedAt = block.updatedAt;

      // When
      block.updateBlockType(newType);

      // Then
      expect(block.blockType.value).toBe('image');
      expect(block.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('page 타입으로 변경할 수 있어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const pageType = new BlockType('page');

      // When
      block.updateBlockType(pageType);

      // Then
      expect(block.blockType.value).toBe('page');
      expect(block.blockType.isPageType()).toBe(true);
    });

    it('code 타입으로 변경할 수 있어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const codeType = new BlockType('code');

      // When
      block.updateBlockType(codeType);

      // Then
      expect(block.blockType.value).toBe('code');
    });

    it('updatedAt이 갱신되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const originalUpdatedAt = block.updatedAt.getTime();

      // 시간 차이를 보장하기 위해 약간 대기
      const sleep = () => new Promise((resolve) => setTimeout(resolve, 10));

      // When
      sleep().then(() => {
        const newType = new BlockType('image');
        block.updateBlockType(newType);

        // Then
        expect(block.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
      });
    });

    it('createdAt은 변경되지 않아야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const originalCreatedAt = block.createdAt;

      // When
      const newType = new BlockType('image');
      block.updateBlockType(newType);

      // Then
      expect(block.createdAt).toBe(originalCreatedAt);
    });

    it('삭제된 블록은 타입 변경할 수 없어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();

      // When & Then
      const newType = new BlockType('image');
      expect(() => block.updateBlockType(newType)).toThrow(
        BlockManagementError
      );
      expect(() => block.updateBlockType(newType)).toThrow(
        'Cannot modify deleted block'
      );
    });
  });

  describe('updateMetadata', () => {
    it('새로운 메타데이터로 업데이트되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const newMetadata = new Metadata({ content: 'Updated content' });

      // When
      block.updateMetadata(newMetadata);

      // Then
      expect(block.metadata.value).toEqual({ content: 'Updated content' });
    });

    it('updatedAt이 갱신되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const originalUpdatedAt = block.updatedAt.getTime();

      // When
      const newMetadata = new Metadata({ content: 'Updated' });
      block.updateMetadata(newMetadata);

      // Then
      expect(block.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt
      );
    });

    it('삭제된 블록은 메타데이터 업데이트할 수 없어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();

      // When & Then
      const newMetadata = new Metadata({ content: 'Updated' });
      expect(() => block.updateMetadata(newMetadata)).toThrow(
        BlockManagementError
      );
    });
  });

  describe('markAsDeleted', () => {
    it('소프트 삭제로 deletedAt이 설정되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // When
      block.markAsDeleted();

      // Then
      expect(block.deletedAt).toBeInstanceOf(Date);
      expect(block.isDeleted()).toBe(true);
    });

    it('이미 삭제된 블록은 다시 삭제할 수 없다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();

      // When & Then
      expect(() => block.markAsDeleted()).toThrow(BlockManagementError);
      expect(() => block.markAsDeleted()).toThrow('Block already deleted');
    });

    it('updatedAt이 갱신되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      const originalUpdatedAt = block.updatedAt.getTime();

      // When
      block.markAsDeleted();

      // Then
      expect(block.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt
      );
    });
  });

  describe('restore', () => {
    it('삭제 취소로 deletedAt이 제거되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();
      expect(block.isDeleted()).toBe(true);

      // When
      block.restore();

      // Then
      expect(block.deletedAt).toBeNull();
      expect(block.isDeleted()).toBe(false);
    });

    it('삭제되지 않은 블록은 복구할 수 없다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // When & Then
      expect(() => block.restore()).toThrow(BlockManagementError);
      expect(() => block.restore()).toThrow('Block is not deleted');
    });

    it('updatedAt이 갱신되어야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();
      const deletedUpdatedAt = block.updatedAt.getTime();

      // When
      block.restore();

      // Then
      expect(block.updatedAt.getTime()).toBeGreaterThanOrEqual(
        deletedUpdatedAt
      );
    });
  });

  describe('isDeleted', () => {
    it('삭제되지 않은 블록은 false를 반환해야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);

      // When
      const result = block.isDeleted();

      // Then
      expect(result).toBe(false);
    });

    it('삭제된 블록은 true를 반환해야 한다', () => {
      // Given
      const block = Block.create(blockId, workspaceId, blockType, metadata);
      block.markAsDeleted();

      // When
      const result = block.isDeleted();

      // Then
      expect(result).toBe(true);
    });
  });
});

