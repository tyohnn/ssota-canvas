import { describe, it, expect } from 'vitest';
import {
  getBlockTypeSchema,
  isBlockSkeleton,
  isBlockCompleted,
  getBlockCompletionPercentage,
} from '../block-type-schemas';

describe('BlockTypeSchemas', () => {
  describe('getBlockTypeSchema', () => {
    it('기본 블록 타입의 스키마를 반환해야 한다', () => {
      const schema = getBlockTypeSchema('basic');
      
      expect(schema.required).toEqual(['title', 'content']);
      expect(schema.optional).toEqual(['description', 'tags']);
      expect(schema.defaults.title).toBe('');
      expect(schema.defaults.content).toBe('');
    });

    it('이미지 블록 타입의 스키마를 반환해야 한다', () => {
      const schema = getBlockTypeSchema('image');
      
      expect(schema.required).toEqual(['src', 'alt']);
      expect(schema.optional).toEqual(['caption', 'width', 'height']);
      expect(schema.defaults.src).toBe('');
      expect(schema.defaults.alt).toBe('');
    });

    it('알 수 없는 블록 타입에 대해 기본 스키마를 반환해야 한다', () => {
      const schema = getBlockTypeSchema('unknown-type');
      
      expect(schema.required).toEqual(['title', 'content']);
      expect(schema.optional).toEqual(['description', 'tags']);
    });
  });

  describe('isBlockSkeleton', () => {
    it('필수 속성이 비어있으면 스켈레톤 상태여야 한다', () => {
      const properties = {
        title: '',
        content: ''
      };
      
      expect(isBlockSkeleton('basic', properties)).toBe(true);
    });

    it('필수 속성이 모두 채워져 있으면 완성 상태여야 한다', () => {
      const properties = {
        title: 'Test Title',
        content: 'Test Content'
      };
      
      expect(isBlockSkeleton('basic', properties)).toBe(false);
    });

    it('일부 필수 속성만 채워져 있으면 스켈레톤 상태여야 한다', () => {
      const properties = {
        title: 'Test Title',
        content: ''
      };
      
      expect(isBlockSkeleton('basic', properties)).toBe(true);
    });

    it('이미지 블록의 필수 속성이 비어있으면 스켈레톤 상태여야 한다', () => {
      const properties = {
        src: '',
        alt: ''
      };
      
      expect(isBlockSkeleton('image', properties)).toBe(true);
    });
  });

  describe('isBlockCompleted', () => {
    it('필수 속성이 모두 채워져 있으면 완성 상태여야 한다', () => {
      const properties = {
        title: 'Test Title',
        content: 'Test Content'
      };
      
      expect(isBlockCompleted('basic', properties)).toBe(true);
    });

    it('필수 속성이 비어있으면 미완성 상태여야 한다', () => {
      const properties = {
        title: '',
        content: ''
      };
      
      expect(isBlockCompleted('basic', properties)).toBe(false);
    });
  });

  describe('getBlockCompletionPercentage', () => {
    it('모든 필수 속성이 채워져 있으면 100%여야 한다', () => {
      const properties = {
        title: 'Test Title',
        content: 'Test Content'
      };
      
      expect(getBlockCompletionPercentage('basic', properties)).toBe(100);
    });

    it('필수 속성이 하나도 채워져 있지 않으면 0%여야 한다', () => {
      const properties = {
        title: '',
        content: ''
      };
      
      expect(getBlockCompletionPercentage('basic', properties)).toBe(0);
    });

    it('필수 속성의 절반이 채워져 있으면 50%여야 한다', () => {
      const properties = {
        title: 'Test Title',
        content: ''
      };
      
      expect(getBlockCompletionPercentage('basic', properties)).toBe(50);
    });

    it('이미지 블록의 완성도를 올바르게 계산해야 한다', () => {
      const properties = {
        src: 'test.jpg',
        alt: 'Test Image'
      };
      
      expect(getBlockCompletionPercentage('image', properties)).toBe(100);
    });
  });
});
