import { describe, it, expect, beforeEach } from 'vitest';
import { blockSchemaRegistry } from '../block-schema-registry';
import { basicBlockSchema } from '../types/basic-block.schema';
import { imageBlockSchema } from '../types/image-block.schema';

describe('BlockSchemaRegistry', () => {
  beforeEach(() => {
    // 각 테스트 전에 레지스트리 초기화
    blockSchemaRegistry['schemas'].clear();
  });

  describe('register', () => {
    it('블록 타입 스키마를 등록해야 한다', () => {
      // When
      blockSchemaRegistry.register('basic', basicBlockSchema);

      // Then
      expect(blockSchemaRegistry.has('basic')).toBe(true);
    });

    it('여러 블록 타입을 등록할 수 있어야 한다', () => {
      // When
      blockSchemaRegistry.register('basic', basicBlockSchema);
      blockSchemaRegistry.register('image', imageBlockSchema);

      // Then
      expect(blockSchemaRegistry.has('basic')).toBe(true);
      expect(blockSchemaRegistry.has('image')).toBe(true);
    });
  });

  describe('get', () => {
    it('등록된 스키마를 반환해야 한다', () => {
      // Given
      blockSchemaRegistry.register('basic', basicBlockSchema);

      // When
      const schema = blockSchemaRegistry.get('basic');

      // Then
      expect(schema).toEqual(basicBlockSchema);
    });

    it('등록되지 않은 타입에 대해 기본 스키마를 반환해야 한다', () => {
      // When
      const schema = blockSchemaRegistry.get('unknown-type');

      // Then
      expect(schema.required).toEqual(['title', 'content']);
      expect(schema.optional).toEqual(['description', 'tags']);
    });
  });

  describe('has', () => {
    it('등록된 타입에 대해 true를 반환해야 한다', () => {
      // Given
      blockSchemaRegistry.register('basic', basicBlockSchema);

      // When & Then
      expect(blockSchemaRegistry.has('basic')).toBe(true);
    });

    it('등록되지 않은 타입에 대해 false를 반환해야 한다', () => {
      // When & Then
      expect(blockSchemaRegistry.has('unknown-type')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('모든 등록된 스키마를 반환해야 한다', () => {
      // Given
      blockSchemaRegistry.register('basic', basicBlockSchema);
      blockSchemaRegistry.register('image', imageBlockSchema);

      // When
      const allSchemas = blockSchemaRegistry.getAll();

      // Then
      expect(Object.keys(allSchemas)).toContain('basic');
      expect(Object.keys(allSchemas)).toContain('image');
      expect(allSchemas.basic).toEqual(basicBlockSchema);
      expect(allSchemas.image).toEqual(imageBlockSchema);
    });
  });
});
