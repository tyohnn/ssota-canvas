import { describe, it, expect } from 'vitest';
import { Metadata } from '../metadata.vo';

describe('Metadata Value Object', () => {
  describe('생성자', () => {
    it('유효한 JSON 객체로 생성되어야 한다', () => {
      // Given
      const data = { title: 'Test', content: 'Hello World' };

      // When
      const metadata = new Metadata(data);

      // Then
      expect(metadata.value).toEqual(data);
    });

    it('빈 객체로 생성되어야 한다', () => {
      // Given
      const emptyData = {};

      // When
      const metadata = new Metadata(emptyData);

      // Then
      expect(metadata.value).toEqual({});
    });

    it('null로 생성되어야 한다', () => {
      // Given
      const nullData = null;

      // When
      const metadata = new Metadata(nullData);

      // Then
      expect(metadata.value).toBeNull();
    });

    it('중첩된 객체로 생성되어야 한다', () => {
      // Given
      const nestedData = {
        title: 'Test',
        content: {
          text: 'Hello',
          formatting: { bold: true, italic: false },
        },
      };

      // When
      const metadata = new Metadata(nestedData);

      // Then
      expect(metadata.value).toEqual(nestedData);
    });

    it('배열이 포함된 객체로 생성되어야 한다', () => {
      // Given
      const dataWithArray = {
        title: 'Test',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      // When
      const metadata = new Metadata(dataWithArray);

      // Then
      expect(metadata.value).toEqual(dataWithArray);
    });

    it('undefined는 빈 객체로 처리되어야 한다', () => {
      // Given
      const undefinedData = undefined;

      // When
      const metadata = new Metadata(undefinedData);

      // Then
      expect(metadata.value).toEqual({});
    });
  });

  describe('merge', () => {
    it('두 메타데이터를 병합해야 한다', () => {
      // Given
      const metadata1 = new Metadata({ title: 'Original', content: 'Hello' });
      const metadata2 = new Metadata({ content: 'Updated', author: 'John' });

      // When
      const merged = metadata1.merge(metadata2);

      // Then
      expect(merged.value).toEqual({
        title: 'Original',
        content: 'Updated',
        author: 'John',
      });
    });

    it('null 메타데이터 병합 시 원본을 유지해야 한다', () => {
      // Given
      const metadata1 = new Metadata({ title: 'Original' });
      const metadata2 = new Metadata(null);

      // When
      const merged = metadata1.merge(metadata2);

      // Then
      expect(merged.value).toEqual({ title: 'Original' });
    });

    it('빈 객체 병합 시 원본을 유지해야 한다', () => {
      // Given
      const metadata1 = new Metadata({ title: 'Original' });
      const metadata2 = new Metadata({});

      // When
      const merged = metadata1.merge(metadata2);

      // Then
      expect(merged.value).toEqual({ title: 'Original' });
    });
  });

  describe('get', () => {
    it('특정 필드의 값을 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({
        title: 'Test',
        content: 'Hello World',
      });

      // When
      const title = metadata.get('title');

      // Then
      expect(title).toBe('Test');
    });

    it('존재하지 않는 필드는 undefined를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({ title: 'Test' });

      // When
      const nonExistent = metadata.get('nonExistent');

      // Then
      expect(nonExistent).toBeUndefined();
    });

    it('null 메타데이터에서는 undefined를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata(null);

      // When
      const value = metadata.get('anyField');

      // Then
      expect(value).toBeUndefined();
    });
  });

  describe('has', () => {
    it('필드가 존재하면 true를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({ title: 'Test' });

      // When
      const result = metadata.has('title');

      // Then
      expect(result).toBe(true);
    });

    it('필드가 존재하지 않으면 false를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({ title: 'Test' });

      // When
      const result = metadata.has('content');

      // Then
      expect(result).toBe(false);
    });

    it('null 메타데이터는 항상 false를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata(null);

      // When
      const result = metadata.has('anyField');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('메타데이터를 JSON 문자열로 변환해야 한다', () => {
      // Given
      const metadata = new Metadata({ title: 'Test', content: 'Hello' });

      // When
      const json = metadata.toJSON();

      // Then
      expect(json).toBe('{"title":"Test","content":"Hello"}');
    });

    it('null 메타데이터는 null 문자열을 반환해야 한다', () => {
      // Given
      const metadata = new Metadata(null);

      // When
      const json = metadata.toJSON();

      // Then
      expect(json).toBe('null');
    });

    it('빈 객체는 빈 JSON 객체 문자열을 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({});

      // When
      const json = metadata.toJSON();

      // Then
      expect(json).toBe('{}');
    });
  });

  describe('equals', () => {
    it('동일한 메타데이터는 같다고 판정되어야 한다', () => {
      // Given
      const metadata1 = new Metadata({ title: 'Test' });
      const metadata2 = new Metadata({ title: 'Test' });

      // When
      const result = metadata1.equals(metadata2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 메타데이터는 다르다고 판정되어야 한다', () => {
      // Given
      const metadata1 = new Metadata({ title: 'Test1' });
      const metadata2 = new Metadata({ title: 'Test2' });

      // When
      const result = metadata1.equals(metadata2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const metadata = new Metadata({ title: 'Test' });
      const nullValue = null as any;

      // When
      const result = metadata.equals(nullValue);

      // Then
      expect(result).toBe(false);
    });
  });
});

