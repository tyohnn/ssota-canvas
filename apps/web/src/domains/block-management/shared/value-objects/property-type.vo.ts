import { BlockManagementError } from '../errors/block-management.error';
import { PropertyType } from './block-properties/common-types';

/**
 * Property Type Value Object
 *
 * 속성 타입의 비즈니스 로직과 검증을 캡슐화
 */
export class PropertyTypeVO {
  constructor(public readonly value: PropertyType) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(PropertyType).includes(this.value)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        `Invalid property type: ${this.value}`
      );
    }
  }

  /**
   * 텍스트 타입인지 확인
   */
  isText(): boolean {
    return this.value === PropertyType.TEXT;
  }

  /**
   * 선택 타입인지 확인
   */
  isSelect(): boolean {
    return this.value === PropertyType.SELECT;
  }

  /**
   * 다중 선택 타입인지 확인
   */
  isMultiSelect(): boolean {
    return this.value === PropertyType.MULTISELECT;
  }

  /**
   * 프로필 타입인지 확인
   */
  isProfile(): boolean {
    return this.value === PropertyType.PROFILE;
  }

  /**
   * 날짜 타입인지 확인
   */
  isDate(): boolean {
    return this.value === PropertyType.DATE;
  }

  /**
   * 숫자 타입인지 확인
   */
  isNumber(): boolean {
    return this.value === PropertyType.NUMBER;
  }

  /**
   * 불린 타입인지 확인
   */
  isBoolean(): boolean {
    return this.value === PropertyType.BOOLEAN;
  }

  /**
   * 색상 타입인지 확인
   */
  isColor(): boolean {
    return this.value === PropertyType.COLOR;
  }

  /**
   * URL 타입인지 확인
   */
  isUrl(): boolean {
    return this.value === PropertyType.URL;
  }

  /**
   * 이메일 타입인지 확인
   */
  isEmail(): boolean {
    return this.value === PropertyType.EMAIL;
  }

  /**
   * 전화번호 타입인지 확인
   */
  isPhone(): boolean {
    return this.value === PropertyType.PHONE;
  }

  /**
   * 옵션이 필요한 타입인지 확인
   */
  requiresOptions(): boolean {
    return this.isSelect() || this.isMultiSelect();
  }

  /**
   * 검증이 필요한 타입인지 확인
   */
  requiresValidation(): boolean {
    return this.isEmail() || this.isUrl() || this.isPhone() || this.isNumber();
  }

  /**
   * 기본값이 필요한 타입인지 확인
   */
  requiresDefaultValue(): boolean {
    return this.isBoolean() || this.isNumber() || this.isText();
  }

  /**
   * 타입별 기본값 반환
   */
  getDefaultValue(): any {
    switch (this.value) {
      case PropertyType.TEXT:
      case PropertyType.URL:
      case PropertyType.EMAIL:
      case PropertyType.PHONE:
        return '';
      case PropertyType.NUMBER:
        return 0;
      case PropertyType.BOOLEAN:
        return false;
      case PropertyType.DATE:
        return null;
      case PropertyType.COLOR:
        return '#000000';
      case PropertyType.SELECT:
      case PropertyType.MULTISELECT:
      case PropertyType.PROFILE:
        return null;
      default:
        return null;
    }
  }

  /**
   * 타입별 검증 패턴 반환
   */
  getValidationPattern(): RegExp | null {
    switch (this.value) {
      case PropertyType.EMAIL:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      case PropertyType.URL:
        return /^https?:\/\/.+/;
      case PropertyType.PHONE:
        return /^[\+]?[1-9][\d]{0,15}$/;
      default:
        return null;
    }
  }

  /**
   * 타입별 검증 메시지 반환
   */
  getValidationMessage(): string | null {
    switch (this.value) {
      case PropertyType.EMAIL:
        return '올바른 이메일 형식을 입력해주세요';
      case PropertyType.URL:
        return '올바른 URL 형식을 입력해주세요 (http:// 또는 https://로 시작)';
      case PropertyType.PHONE:
        return '올바른 전화번호 형식을 입력해주세요';
      default:
        return null;
    }
  }

  equals(other: PropertyTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  /**
   * 문자열로부터 PropertyTypeVO 생성
   */
  static fromString(value: string): PropertyTypeVO {
    if (!Object.values(PropertyType).includes(value as PropertyType)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        `Invalid property type: ${value}`
      );
    }
    return new PropertyTypeVO(value as PropertyType);
  }

  /**
   * PropertyType enum으로부터 PropertyTypeVO 생성
   */
  static fromPropertyType(propertyType: PropertyType): PropertyTypeVO {
    return new PropertyTypeVO(propertyType);
  }
}
