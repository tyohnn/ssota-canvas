import { describe, it, expect } from 'vitest';
import { PropertyType } from '../property-type.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('PropertyType Value Object', () => {
  describe('생성자', () => {
    it('유효한 속성 타입으로 생성되어야 한다', () => {
      // Given
      const validTypes = ['text', 'url', 'email', 'select', 'multiselect', 'datetime', 'media', 'profile'];

      // When & Then
      validTypes.forEach(type => {
        const propertyType = new PropertyType(type);
        expect(propertyType.value).toBe(type);
      });
    });

    it('잘못된 속성 타입에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = 'invalid-type';

      // When & Then
      expect(() => new PropertyType(invalidType)).toThrow(BlockManagementError);
      expect(() => new PropertyType(invalidType)).toThrow('Invalid property type');
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyType = '';

      // When & Then
      expect(() => new PropertyType(emptyType)).toThrow(BlockManagementError);
      expect(() => new PropertyType(emptyType)).toThrow('Property type cannot be empty');
    });

    it('null 또는 undefined에 대해 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(() => new PropertyType(null as any)).toThrow(BlockManagementError);
      expect(() => new PropertyType(undefined as any)).toThrow(BlockManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 속성 타입은 같다고 판단되어야 한다', () => {
      // Given
      const type1 = new PropertyType('text');
      const type2 = new PropertyType('text');

      // When & Then
      expect(type1.equals(type2)).toBe(true);
    });

    it('다른 속성 타입은 다르다고 판단되어야 한다', () => {
      // Given
      const type1 = new PropertyType('text');
      const type2 = new PropertyType('url');

      // When & Then
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('isTextType', () => {
    it('텍스트 관련 타입을 올바르게 식별해야 한다', () => {
      // Given
      const textType = new PropertyType('text');
      const urlType = new PropertyType('url');
      const emailType = new PropertyType('email');

      // When & Then
      expect(textType.isTextType()).toBe(true);
      expect(urlType.isTextType()).toBe(true);
      expect(emailType.isTextType()).toBe(true); // email도 텍스트 타입
    });
  });

  describe('isSelectType', () => {
    it('선택형 타입을 올바르게 식별해야 한다', () => {
      // Given
      const selectType = new PropertyType('select');
      const multiselectType = new PropertyType('multiselect');
      const textType = new PropertyType('text');

      // When & Then
      expect(selectType.isSelectType()).toBe(true);
      expect(multiselectType.isSelectType()).toBe(true);
      expect(textType.isSelectType()).toBe(false);
    });
  });

  describe('isMediaType', () => {
    it('미디어 타입을 올바르게 식별해야 한다', () => {
      // Given
      const mediaType = new PropertyType('media');
      const textType = new PropertyType('text');

      // When & Then
      expect(mediaType.isMediaType()).toBe(true);
      expect(textType.isMediaType()).toBe(false);
    });
  });

  describe('isProfileType', () => {
    it('프로필 타입을 올바르게 식별해야 한다', () => {
      // Given
      const profileType = new PropertyType('profile');
      const textType = new PropertyType('text');

      // When & Then
      expect(profileType.isProfileType()).toBe(true);
      expect(textType.isProfileType()).toBe(false);
    });
  });

  describe('isDateTimeType', () => {
    it('날짜시간 타입을 올바르게 식별해야 한다', () => {
      // Given
      const datetimeType = new PropertyType('datetime');
      const textType = new PropertyType('text');

      // When & Then
      expect(datetimeType.isDateTimeType()).toBe(true);
      expect(textType.isDateTimeType()).toBe(false);
    });
  });
});