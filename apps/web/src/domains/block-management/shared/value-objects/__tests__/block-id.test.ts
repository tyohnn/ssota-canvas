import { describe, it, expect } from 'vitest';
import { BlockId } from '../block-id.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('BlockId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      // When
      const blockId = new BlockId(validUuid);

      // Then
      expect(blockId.value).toBe(validUuid);
    });

    it('대소문자를 구분하지 않고 UUID를 허용해야 한다', () => {
      // Given
      const uppercaseUuid = '123E4567-E89B-12D3-A456-426614174000';

      // When
      const blockId = new BlockId(uppercaseUuid);

      // Then
      expect(blockId.value).toBe(uppercaseUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'invalid-uuid';

      // When & Then
      expect(() => new BlockId(invalidUuid)).toThrow(BlockManagementError);
      expect(() => new BlockId(invalidUuid)).toThrow('Invalid BlockId format');
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new BlockId(emptyString)).toThrow(BlockManagementError);
    });

    it('공백만 있는 문자열은 허용하지 않아야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new BlockId(whitespaceString)).toThrow(BlockManagementError);
    });

    it('null은 허용하지 않아야 한다', () => {
      // Given
      const nullValue = null as any;

      // When & Then
      expect(() => new BlockId(nullValue)).toThrow(BlockManagementError);
    });

    it('undefined는 허용하지 않아야 한다', () => {
      // Given
      const undefinedValue = undefined as any;

      // When & Then
      expect(() => new BlockId(undefinedValue)).toThrow(BlockManagementError);
    });

    it('UUID가 아닌 긴 문자열은 거부해야 한다', () => {
      // Given
      const longString = '123e4567-e89b-12d3-a456-426614174000-extra';

      // When & Then
      expect(() => new BlockId(longString)).toThrow(BlockManagementError);
    });

    it('하이픈이 빠진 UUID는 거부해야 한다', () => {
      // Given
      const uuidWithoutHyphens = '123e4567e89b12d3a456426614174000';

      // When & Then
      expect(() => new BlockId(uuidWithoutHyphens)).toThrow(BlockManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 UUID를 가진 BlockId는 같다고 판정되어야 한다', () => {
      // Given
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const blockId1 = new BlockId(uuid);
      const blockId2 = new BlockId(uuid);

      // When
      const result = blockId1.equals(blockId2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 UUID를 가진 BlockId는 다르다고 판정되어야 한다', () => {
      // Given
      const blockId1 = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      const blockId2 = new BlockId('123e4567-e89b-12d3-a456-426614174001');

      // When
      const result = blockId1.equals(blockId2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      const nullValue = null as any;

      // When
      const result = blockId.equals(nullValue);

      // Then
      expect(result).toBe(false);
    });

    it('undefined와 비교 시 false를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      const undefinedValue = undefined as any;

      // When
      const result = blockId.equals(undefinedValue);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('value getter', () => {
    it('생성자에 전달된 값을 반환해야 한다', () => {
      // Given
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const blockId = new BlockId(uuid);

      // When
      const value = blockId.value;

      // Then
      expect(value).toBe(uuid);
    });

    it('value는 불변이어야 한다 (readonly)', () => {
      // Given
      const blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');

      // When & Then
      // TypeScript 컴파일 시점에서 에러 발생 (readonly)
      // Runtime에서도 setter가 없으므로 에러 발생
      expect(() => {
        (blockId as any).value = '123e4567-e89b-12d3-a456-426614174001';
      }).toThrow();
    });
  });
});

