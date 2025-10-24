import { describe, it, expect } from 'vitest';
import { BlockType } from '../block-type.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('BlockType Value Object', () => {
  describe('생성자', () => {
    it('지원되는 블록 타입으로 생성되어야 한다', () => {
      // Given
      const validTypes = ['youtube', 'python', 'markdown', 'image', 'file', 'link', 'shape', 'page_mention', 'latex', 'github_pr', 'react_component'];

      // When & Then
      validTypes.forEach((type) => {
        const blockType = new BlockType(type);
        expect(blockType.value).toBe(type);
      });
    });

    it('youtube 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'youtube';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('youtube');
    });

    it('python 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'python';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('python');
    });

    it('markdown 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'markdown';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('markdown');
    });

    it('image 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'image';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('image');
    });

    it('file 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'file';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('file');
    });

    it('link 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'link';

      // When
      const blockType = new BlockType(type);

      // Then
      expect(blockType.value).toBe('link');
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
      const blockType1 = new BlockType('youtube');
      const blockType2 = new BlockType('youtube');

      // When
      const result = blockType1.equals(blockType2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 타입을 가진 BlockType은 다르다고 판정되어야 한다', () => {
      // Given
      const blockType1 = new BlockType('youtube');
      const blockType2 = new BlockType('python');

      // When
      const result = blockType1.equals(blockType2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const blockType = new BlockType('youtube');
      const nullValue = null as any;

      // When
      const result = blockType.equals(nullValue);

      // Then
      expect(result).toBe(false);
    });
  });


  describe('getMetadataSchema', () => {
    it('각 타입별 메타데이터 스키마를 반환해야 한다', () => {
      // Given
      const youtubeType = new BlockType('youtube');

      // When
      const schema = youtubeType.getMetadataSchema();

      // Then
      expect(schema).toBeDefined();
      expect(schema.required).toContain('youtubeUrl');
      expect(schema.properties).toHaveProperty('youtubeUrl');
      expect(schema.properties).toHaveProperty('title');
      expect(schema.properties).toHaveProperty('description');
    });

    it('python 타입의 스키마를 반환해야 한다', () => {
      // Given
      const pythonType = new BlockType('python');

      // When
      const schema = pythonType.getMetadataSchema();

      // Then
      expect(schema).toBeDefined();
      expect(schema.required).toContain('code');
      expect(schema.properties).toHaveProperty('code');
      expect(schema.properties).toHaveProperty('language');
      expect(schema.properties).toHaveProperty('output');
    });
  });

  describe('getDefaultProperties', () => {
    it('각 타입별 기본 속성을 반환해야 한다', () => {
      // Given
      const youtubeType = new BlockType('youtube');

      // When
      const defaultProps = youtubeType.getDefaultProperties();

      // Then
      expect(defaultProps).toBeDefined();
      expect(defaultProps).toHaveProperty('youtubeUrl', '');
      expect(defaultProps).toHaveProperty('title', '');
      expect(defaultProps).toHaveProperty('description', '');
    });

    it('python 타입의 기본 속성을 반환해야 한다', () => {
      // Given
      const pythonType = new BlockType('python');

      // When
      const defaultProps = pythonType.getDefaultProperties();

      // Then
      expect(defaultProps).toBeDefined();
      expect(defaultProps).toHaveProperty('code', '');
      expect(defaultProps).toHaveProperty('language', 'python');
      expect(defaultProps).toHaveProperty('output', '');
    });
  });

  describe('getAvailableTools', () => {
    it('각 타입별 사용 가능한 툴 목록을 반환해야 한다', () => {
      // Given
      const youtubeType = new BlockType('youtube');

      // When
      const tools = youtubeType.getAvailableTools();

      // Then
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools).toContain('getComments');
      expect(tools).toContain('getVideoInfo');
      expect(tools).toContain('generateThumbnail');
    });

    it('python 타입의 툴 목록을 반환해야 한다', () => {
      // Given
      const pythonType = new BlockType('python');

      // When
      const tools = pythonType.getAvailableTools();

      // Then
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toContain('executeCode');
      expect(tools).toContain('formatCode');
      expect(tools).toContain('lintCode');
    });
  });

  describe('toString', () => {
    it('블록 타입 문자열을 반환해야 한다', () => {
      // Given
      const blockType = new BlockType('youtube');

      // When
      const result = blockType.toString();

      // Then
      expect(result).toBe('youtube');
    });
  });
});

