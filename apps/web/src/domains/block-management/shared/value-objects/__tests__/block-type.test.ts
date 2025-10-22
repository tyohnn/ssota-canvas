import { describe, it, expect } from 'vitest';
import { BlockType } from '../block-type.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('BlockType Value Object', () => {
  describe('생성자', () => {
    it('지원되는 블록 타입으로 생성되어야 한다', () => {
      // Given
      const validTypes = ['text', 'image', 'code', 'page', 'shape', 'todo'];

      // When & Then
      validTypes.forEach((type) => {
        const blockType = new BlockType(type);
        expect(blockType.value).toBe(type);
      });
    });

    it('text 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'text';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('text');
    });

    it('image 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'image';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('image');
    });

    it('code 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'code';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('code');
    });

    it('page 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'page';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('page');
    });

    it('shape 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'shape';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('shape');
    });

    it('todo 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'todo';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('todo');
    });

    it('지원되지 않는 타입에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = 'invalid-type';

      // When & Then
      expect(() => new BlockType(invalidType)).toThrow(BlockManagementError);
      expect(() => new BlockType(invalidType)).toThrow('Invalid block type');
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new BlockType(emptyString)).toThrow(BlockManagementError);
    });

    it('null은 허용하지 않아야 한다', () => {
      // Given
      const nullValue = null as any;

      // When & Then
      expect(() => new BlockType(nullValue)).toThrow(BlockManagementError);
    });

    it('undefined는 허용하지 않아야 한다', () => {
      // Given
      const undefinedValue = undefined as any;

      // When & Then
      expect(() => new BlockType(undefinedValue)).toThrow(BlockManagementError);
    });

    it('대문자 타입은 거부해야 한다', () => {
      // Given
      const uppercaseType = 'TEXT';

      // When & Then
      expect(() => new BlockType(uppercaseType)).toThrow(BlockManagementError);
    });

    it('공백이 포함된 타입은 거부해야 한다', () => {
      // Given
      const typeWithSpace = 'text ';

      // When & Then
      expect(() => new BlockType(typeWithSpace)).toThrow(BlockManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 타입을 가진 BlockType은 같다고 판정되어야 한다', () => {
      // Given
      const blockType1 = new BlockType('text');
      const blockType2 = new BlockType('text');

      // When
      const result = blockType1.equals(blockType2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 타입을 가진 BlockType은 다르다고 판정되어야 한다', () => {
      // Given
      const blockType1 = new BlockType('text');
      const blockType2 = new BlockType('image');

      // When
      const result = blockType1.equals(blockType2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const blockType = new BlockType('text');
      const nullValue = null as any;

      // When
      const result = blockType.equals(nullValue);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isPageType', () => {
    it('page 타입인 경우 true를 반환해야 한다', () => {
      // Given
      const pageType = new BlockType('page');

      // When
      const result = pageType.isPageType();

      // Then
      expect(result).toBe(true);
    });

    it('page 타입이 아닌 경우 false를 반환해야 한다', () => {
      // Given
      const textType = new BlockType('text');

      // When
      const result = textType.isPageType();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('블록 타입 문자열을 반환해야 한다', () => {
      // Given
      const blockType = new BlockType('text');

      // When
      const result = blockType.toString();

      // Then
      expect(result).toBe('text');
    });
  });
});

