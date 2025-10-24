import { BlockManagementError } from '../errors/block-management.error';

export class PropertyType {
  private static readonly VALID_TYPES = [
    'text',
    'url',
    'email',
    'select',
    'multiselect',
    'datetime',
    'media',
    'profile',
  ] as const;

  private static readonly TEXT_TYPES = ['text', 'url', 'email'] as const;
  private static readonly SELECT_TYPES = ['select', 'multiselect'] as const;

  constructor(public readonly value: string) {
    this.validate(value);
  }

  private validate(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Property type cannot be empty'
      );
    }

    if (!PropertyType.VALID_TYPES.includes(type as any)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        `Invalid property type: ${type}. Valid types are: ${PropertyType.VALID_TYPES.join(', ')}`
      );
    }
  }

  equals(other: PropertyType): boolean {
    return this.value === other.value;
  }

  isTextType(): boolean {
    return PropertyType.TEXT_TYPES.includes(this.value as any);
  }

  isSelectType(): boolean {
    return PropertyType.SELECT_TYPES.includes(this.value as any);
  }

  isMediaType(): boolean {
    return this.value === 'media';
  }

  isProfileType(): boolean {
    return this.value === 'profile';
  }

  isDateTimeType(): boolean {
    return this.value === 'datetime';
  }

  /**
   * 속성 타입이 옵션을 가져야 하는지 확인
   */
  requiresOptions(): boolean {
    return this.isSelectType();
  }

  /**
   * 속성 타입이 검증 규칙을 가져야 하는지 확인
   */
  requiresValidation(): boolean {
    return this.isTextType() || this.isDateTimeType();
  }
}
