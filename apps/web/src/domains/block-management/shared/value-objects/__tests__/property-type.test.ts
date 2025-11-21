import { describe, it, expect } from 'vitest';
import { PropertyTypeVO } from '../property-type.vo';
import { BlockManagementError } from '../../errors/block-management.error';
import { PropertyType } from '../block-properties/common-types';

describe('PropertyType Value Object', () => {
  describe('생성자', () => {
    it('유효한 속성 타입으로 생성되어야 한다', () => {
      // Given
      const validTypes = [PropertyType.TEXT, PropertyType.URL, PropertyType.EMAIL, PropertyType.SELECT, PropertyType.MULTISELECT, PropertyType.PROFILE];

      // When & Then
      validTypes.forEach(type => {
        const propertyType = new PropertyTypeVO(type);
        expect(propertyType.value).toBe(type);
      });
    });

    it('잘못된 속성 타입에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = 'invalid-type' as any;

      // When & Then
      expect(() => new PropertyTypeVO(invalidType)).toThrow(BlockManagementError);
    });

    it('null 또는 undefined에 대해 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(() => new PropertyTypeVO(null as any)).toThrow(BlockManagementError);
      expect(() => new PropertyTypeVO(undefined as any)).toThrow(BlockManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 속성 타입은 같다고 판단되어야 한다', () => {
      // Given
      const type1 = new PropertyTypeVO(PropertyType.TEXT);
      const type2 = new PropertyTypeVO(PropertyType.TEXT);

      // When & Then
      expect(type1.equals(type2)).toBe(true);
    });

    it('다른 속성 타입은 다르다고 판단되어야 한다', () => {
      // Given
      const type1 = new PropertyTypeVO(PropertyType.TEXT);
      const type2 = new PropertyTypeVO(PropertyType.URL);

      // When & Then
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('isText', () => {
    it('텍스트 관련 타입을 올바르게 식별해야 한다', () => {
      // Given
      const textType = new PropertyTypeVO(PropertyType.TEXT);
      const urlType = new PropertyTypeVO(PropertyType.URL);
      const emailType = new PropertyTypeVO(PropertyType.EMAIL);

      // When & Then
      expect(textType.isText()).toBe(true);
      expect(urlType.isUrl()).toBe(true);
      expect(emailType.isEmail()).toBe(true);
    });
  });

  describe('isSelect', () => {
    it('선택형 타입을 올바르게 식별해야 한다', () => {
      // Given
      const selectType = new PropertyTypeVO(PropertyType.SELECT);
      const multiselectType = new PropertyTypeVO(PropertyType.MULTISELECT);
      const textType = new PropertyTypeVO(PropertyType.TEXT);

      // When & Then
      expect(selectType.isSelect()).toBe(true);
      expect(multiselectType.isMultiSelect()).toBe(true);
      expect(textType.isText()).toBe(true);
    });
  });

  describe('isProfile', () => {
    it('프로필 타입을 올바르게 식별해야 한다', () => {
      // Given
      const profileType = new PropertyTypeVO(PropertyType.PROFILE);
      const textType = new PropertyTypeVO(PropertyType.TEXT);

      // When & Then
      expect(profileType.isProfile()).toBe(true);
      expect(textType.isProfile()).toBe(false);
    });
  });

  describe('isDate', () => {
    it('날짜 타입을 올바르게 식별해야 한다', () => {
      // Given
      const dateType = new PropertyTypeVO(PropertyType.DATE);
      const textType = new PropertyTypeVO(PropertyType.TEXT);

      // When & Then
      expect(dateType.isDate()).toBe(true);
      expect(textType.isDate()).toBe(false);
    });
  });
});