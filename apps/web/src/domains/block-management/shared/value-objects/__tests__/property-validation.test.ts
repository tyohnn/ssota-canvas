import { describe, it, expect } from 'vitest';
import { PropertyValidation } from '../property-validation.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('PropertyValidation Value Object', () => {
  describe('생성자', () => {
    it('유효한 검증 규칙으로 생성되어야 한다', () => {
      // Given
      const rules = {
        required: true,
        minLength: 5,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9]+$'
      };

      // When
      const validation = new PropertyValidation(rules);

      // Then
      expect(validation.rules).toEqual(rules);
    });

    it('빈 검증 규칙으로 생성되어야 한다', () => {
      // Given
      const rules = {};

      // When
      const validation = new PropertyValidation(rules);

      // Then
      expect(validation.rules).toEqual(rules);
    });

    it('null 또는 undefined에 대해 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(() => new PropertyValidation(null as any)).toThrow(BlockManagementError);
      expect(() => new PropertyValidation(undefined as any)).toThrow(BlockManagementError);
    });
  });

  describe('isRequired', () => {
    it('required가 true일 때 true를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({ required: true });

      // When & Then
      expect(validation.isRequired()).toBe(true);
    });

    it('required가 false일 때 false를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({ required: false });

      // When & Then
      expect(validation.isRequired()).toBe(false);
    });

    it('required가 없을 때 false를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.isRequired()).toBe(false);
    });
  });

  describe('getMinLength', () => {
    it('minLength가 설정되어 있을 때 해당 값을 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({ minLength: 5 });

      // When & Then
      expect(validation.getMinLength()).toBe(5);
    });

    it('minLength가 없을 때 undefined를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.getMinLength()).toBeUndefined();
    });
  });

  describe('getMaxLength', () => {
    it('maxLength가 설정되어 있을 때 해당 값을 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({ maxLength: 100 });

      // When & Then
      expect(validation.getMaxLength()).toBe(100);
    });

    it('maxLength가 없을 때 undefined를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.getMaxLength()).toBeUndefined();
    });
  });

  describe('getPattern', () => {
    it('pattern이 설정되어 있을 때 해당 값을 반환해야 한다', () => {
      // Given
      const pattern = '^[a-zA-Z0-9]+$';
      const validation = new PropertyValidation({ pattern });

      // When & Then
      expect(validation.getPattern()).toBe(pattern);
    });

    it('pattern이 없을 때 undefined를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.getPattern()).toBeUndefined();
    });
  });

  describe('hasLengthValidation', () => {
    it('minLength 또는 maxLength가 있을 때 true를 반환해야 한다', () => {
      // Given
      const validation1 = new PropertyValidation({ minLength: 5 });
      const validation2 = new PropertyValidation({ maxLength: 100 });
      const validation3 = new PropertyValidation({ minLength: 5, maxLength: 100 });

      // When & Then
      expect(validation1.hasLengthValidation()).toBe(true);
      expect(validation2.hasLengthValidation()).toBe(true);
      expect(validation3.hasLengthValidation()).toBe(true);
    });

    it('minLength와 maxLength가 모두 없을 때 false를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.hasLengthValidation()).toBe(false);
    });
  });

  describe('hasPatternValidation', () => {
    it('pattern이 있을 때 true를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({ pattern: '^[a-zA-Z0-9]+$' });

      // When & Then
      expect(validation.hasPatternValidation()).toBe(true);
    });

    it('pattern이 없을 때 false를 반환해야 한다', () => {
      // Given
      const validation = new PropertyValidation({});

      // When & Then
      expect(validation.hasPatternValidation()).toBe(false);
    });
  });

  describe('equals', () => {
    it('동일한 검증 규칙을 가진 객체는 같다고 판단되어야 한다', () => {
      // Given
      const rules = { required: true, minLength: 5 };
      const validation1 = new PropertyValidation(rules);
      const validation2 = new PropertyValidation(rules);

      // When & Then
      expect(validation1.equals(validation2)).toBe(true);
    });

    it('다른 검증 규칙을 가진 객체는 다르다고 판단되어야 한다', () => {
      // Given
      const validation1 = new PropertyValidation({ required: true });
      const validation2 = new PropertyValidation({ required: false });

      // When & Then
      expect(validation1.equals(validation2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('JSON 직렬화가 올바르게 작동해야 한다', () => {
      // Given
      const rules = { required: true, minLength: 5, maxLength: 100 };
      const validation = new PropertyValidation(rules);

      // When
      const json = validation.toJSON();

      // Then
      expect(json).toEqual(rules);
    });
  });
});
