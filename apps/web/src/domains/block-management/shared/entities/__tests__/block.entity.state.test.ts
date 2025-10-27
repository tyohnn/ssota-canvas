import { describe, it, expect } from 'vitest';
import { Block } from '../block.entity';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';

describe('Block Entity State Management', () => {
  describe('isSkeleton', () => {
    it('필수 속성이 비어있으면 스켈레톤 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: '',
        content: ''
      });

      // When & Then
      expect(block.isSkeleton()).toBe(true);
    });

    it('필수 속성이 모두 채워져 있으면 완성 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: 'Test Content'
      });

      // When & Then
      expect(block.isSkeleton()).toBe(false);
    });

    it('일부 필수 속성만 채워져 있으면 스켈레톤 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: ''
      });

      // When & Then
      expect(block.isSkeleton()).toBe(true);
    });

    it('이미지 블록의 필수 속성이 비어있으면 스켈레톤 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('image');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        src: '',
        alt: ''
      });

      // When & Then
      expect(block.isSkeleton()).toBe(true);
    });
  });

  describe('isCompleted', () => {
    it('필수 속성이 모두 채워져 있으면 완성 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: 'Test Content'
      });

      // When & Then
      expect(block.isCompleted()).toBe(true);
    });

    it('필수 속성이 비어있으면 미완성 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: '',
        content: ''
      });

      // When & Then
      expect(block.isCompleted()).toBe(false);
    });
  });

  describe('getCompletionPercentage', () => {
    it('모든 필수 속성이 채워져 있으면 100%여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: 'Test Content'
      });

      // When & Then
      expect(block.getCompletionPercentage()).toBe(100);
    });

    it('필수 속성이 하나도 채워져 있지 않으면 0%여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: '',
        content: ''
      });

      // When & Then
      expect(block.getCompletionPercentage()).toBe(0);
    });

    it('필수 속성의 절반이 채워져 있으면 50%여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: ''
      });

      // When & Then
      expect(block.getCompletionPercentage()).toBe(50);
    });

    it('이미지 블록의 완성도를 올바르게 계산해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('image');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        src: 'test.jpg',
        alt: 'Test Image'
      });

      // When & Then
      expect(block.getCompletionPercentage()).toBe(100);
    });
  });

  describe('getRenderState', () => {
    it('완성된 블록은 completed 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: 'Test Title',
        content: 'Test Content'
      });

      // When & Then
      expect(block.getRenderState()).toBe('completed');
    });

    it('미완성 블록은 skeleton 상태여야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: '',
        content: ''
      });

      // When & Then
      expect(block.getRenderState()).toBe('skeleton');
    });
  });

  describe('상태 변화', () => {
    it('속성 업데이트 시 상태가 올바르게 변경되어야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const blockType = new BlockType('basic');
      const block = Block.create(blockId, 'workspace-1', blockType, {
        title: '',
        content: ''
      });

      // 초기 상태는 스켈레톤
      expect(block.isSkeleton()).toBe(true);
      expect(block.getRenderState()).toBe('skeleton');

      // When - 제목 추가
      block.update({ title: 'Test Title' });

      // Then - 여전히 스켈레톤 (content가 비어있음)
      expect(block.isSkeleton()).toBe(true);
      expect(block.getRenderState()).toBe('skeleton');

      // When - 내용 추가
      block.update({ properties: { content: 'Test Content' } });

      // Then - 완성 상태
      expect(block.isCompleted()).toBe(true);
      expect(block.getRenderState()).toBe('completed');
    });
  });
});
