import { describe, it, expect } from 'vitest';
import { PropertyOption } from '../property-option.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('PropertyOption Value Object', () => {
  describe('생성자', () => {
    it('유효한 옵션으로 생성되어야 한다', () => {
      // Given
      const label = 'Option 1';
      const value = 'option1';

      // When
      const option = new PropertyOption(label, value);

      // Then
      expect(option.label).toBe(label);
      expect(option.value).toBe(value);
    });

    it('빈 라벨에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyLabel = '';
      const value = 'option1';

      // When & Then
      expect(() => new PropertyOption(emptyLabel, value)).toThrow(BlockManagementError);
      expect(() => new PropertyOption(emptyLabel, value)).toThrow('Option label cannot be empty');
    });

    it('빈 값에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const label = 'Option 1';
      const emptyValue = '';

      // When & Then
      expect(() => new PropertyOption(label, emptyValue)).toThrow(BlockManagementError);
      expect(() => new PropertyOption(label, emptyValue)).toThrow('Option value cannot be empty');
    });

    it('null 또는 undefined에 대해 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(() => new PropertyOption(null as any, 'value')).toThrow(BlockManagementError);
      expect(() => new PropertyOption('label', null as any)).toThrow(BlockManagementError);
      expect(() => new PropertyOption(undefined as any, 'value')).toThrow(BlockManagementError);
      expect(() => new PropertyOption('label', undefined as any)).toThrow(BlockManagementError);
    });

    it('라벨과 값이 같을 수 있다', () => {
      // Given
      const sameText = 'Same Text';

      // When
      const option = new PropertyOption(sameText, sameText);

      // Then
      expect(option.label).toBe(sameText);
      expect(option.value).toBe(sameText);
    });
  });

  describe('equals', () => {
    it('동일한 라벨과 값을 가진 옵션은 같다고 판단되어야 한다', () => {
      // Given
      const option1 = new PropertyOption('Option 1', 'option1');
      const option2 = new PropertyOption('Option 1', 'option1');

      // When & Then
      expect(option1.equals(option2)).toBe(true);
    });

    it('다른 라벨을 가진 옵션은 다르다고 판단되어야 한다', () => {
      // Given
      const option1 = new PropertyOption('Option 1', 'option1');
      const option2 = new PropertyOption('Option 2', 'option1');

      // When & Then
      expect(option1.equals(option2)).toBe(false);
    });

    it('다른 값을 가진 옵션은 다르다고 판단되어야 한다', () => {
      // Given
      const option1 = new PropertyOption('Option 1', 'option1');
      const option2 = new PropertyOption('Option 1', 'option2');

      // When & Then
      expect(option1.equals(option2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('라벨을 문자열로 반환해야 한다', () => {
      // Given
      const option = new PropertyOption('Option 1', 'option1');

      // When
      const result = option.toString();

      // Then
      expect(result).toBe('Option 1');
    });
  });

  describe('toJSON', () => {
    it('JSON 직렬화가 올바르게 작동해야 한다', () => {
      // Given
      const option = new PropertyOption('Option 1', 'option1');

      // When
      const json = option.toJSON();

      // Then
      expect(json).toEqual({
        label: 'Option 1',
        value: 'option1'
      });
    });
  });
});
