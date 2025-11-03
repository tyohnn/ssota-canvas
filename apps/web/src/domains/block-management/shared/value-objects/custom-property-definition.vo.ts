import { BlockManagementError } from '../errors/block-management.error';
import { PropertyType, PropertyOption } from './block-properties/common-types';
import { PropertyTypeVO } from './property-type.vo';
import { PropertyOptionVO } from './property-option.vo';

/**
 * Custom Property Definition Value Object
 *
 * 커스텀 속성 정의의 비즈니스 로직과 검증을 캡슐화
 */
export class CustomPropertyDefinitionVO {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: PropertyTypeVO,
    public readonly options: PropertyOptionVO[] = [],
    public readonly order: number = 0,
    public readonly visible: boolean = true,
    public readonly required: boolean = false,
    public readonly defaultValue: any = null,
    public readonly validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    }
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        'Property ID cannot be empty'
      );
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        'Property name cannot be empty'
      );
    }

    if (this.order < 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        'Property order cannot be negative'
      );
    }

    // 타입에 따른 옵션 검증
    if (this.type.requiresOptions() && this.options.length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        `${this.type.value} type requires at least one option`
      );
    }

    // 옵션 ID 중복 검증
    const optionIds = this.options.map(option => option.id);
    const uniqueIds = new Set(optionIds);
    if (optionIds.length !== uniqueIds.size) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        'Option IDs must be unique'
      );
    }
  }

  /**
   * 속성명 변경
   */
  setName(name: string): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      name,
      this.type,
      this.options,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 타입 변경
   */
  setType(type: PropertyTypeVO): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      type,
      this.options,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 옵션 추가
   */
  addOption(option: PropertyOptionVO): CustomPropertyDefinitionVO {
    const newOptions = [...this.options, option];
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      newOptions,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 옵션 제거
   */
  removeOption(optionId: string): CustomPropertyDefinitionVO {
    const newOptions = this.options.filter(option => option.id !== optionId);
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      newOptions,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 옵션 업데이트
   */
  updateOption(
    optionId: string,
    updatedOption: PropertyOptionVO
  ): CustomPropertyDefinitionVO {
    const newOptions = this.options.map(option =>
      option.id === optionId ? updatedOption : option
    );
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      newOptions,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 순서 변경
   */
  setOrder(order: number): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      this.options,
      order,
      this.visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 가시성 변경
   */
  setVisible(visible: boolean): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      this.options,
      this.order,
      visible,
      this.required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 필수 여부 변경
   */
  setRequired(required: boolean): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      this.options,
      this.order,
      this.visible,
      required,
      this.defaultValue,
      this.validation
    );
  }

  /**
   * 기본값 변경
   */
  setDefaultValue(defaultValue: any): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      this.options,
      this.order,
      this.visible,
      this.required,
      defaultValue,
      this.validation
    );
  }

  /**
   * 검증 규칙 변경
   */
  setValidation(validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  }): CustomPropertyDefinitionVO {
    return new CustomPropertyDefinitionVO(
      this.id,
      this.name,
      this.type,
      this.options,
      this.order,
      this.visible,
      this.required,
      this.defaultValue,
      validation
    );
  }

  /**
   * 옵션 ID로 옵션 찾기
   */
  findOption(optionId: string): PropertyOptionVO | undefined {
    return this.options.find(option => option.id === optionId);
  }

  /**
   * 옵션 정렬 (order 기준)
   */
  getSortedOptions(): PropertyOptionVO[] {
    return [...this.options].sort((a, b) => a.order - b.order);
  }

  /**
   * 활성화된 옵션들만 반환
   */
  getActiveOptions(): PropertyOptionVO[] {
    return this.options.filter(option => !option.disabled);
  }

  /**
   * 값 검증
   */
  validateValue(value: any): boolean {
    // 필수 값 검증
    if (
      this.required &&
      (value === null || value === undefined || value === '')
    ) {
      return false;
    }

    // 타입별 검증
    if (this.type.isNumber() && typeof value !== 'number') {
      return false;
    }

    if (this.type.isBoolean() && typeof value !== 'boolean') {
      return false;
    }

    if (this.type.isEmail() || this.type.isUrl() || this.type.isPhone()) {
      const pattern = this.type.getValidationPattern();
      if (pattern && !pattern.test(value)) {
        return false;
      }
    }

    // 범위 검증
    if (this.validation?.min !== undefined && value < this.validation.min) {
      return false;
    }

    if (this.validation?.max !== undefined && value > this.validation.max) {
      return false;
    }

    // 패턴 검증
    if (this.validation?.pattern) {
      const pattern = new RegExp(this.validation.pattern);
      if (!pattern.test(value)) {
        return false;
      }
    }

    return true;
  }

  equals(other: CustomPropertyDefinitionVO): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): {
    id: string;
    name: string;
    type: PropertyType;
    options: PropertyOption[];
    order: number;
    visible: boolean;
    required: boolean;
    defaultValue: any;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
  } {
    return {
      id: this.id,
      name: this.name,
      type: this.type.value,
      options: this.options.map(option => option.toJSON()),
      order: this.order,
      visible: this.visible,
      required: this.required,
      defaultValue: this.defaultValue,
      validation: this.validation,
    };
  }

  /**
   * JSON 데이터로부터 CustomPropertyDefinitionVO 생성
   */
  static fromJSON(data: {
    id: string;
    name: string;
    type: PropertyType;
    options?: PropertyOption[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: any;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
  }): CustomPropertyDefinitionVO {
    const typeVO = PropertyTypeVO.fromPropertyType(data.type);
    const options = (data.options || []).map(option =>
      PropertyOptionVO.fromJSON(option)
    );

    return new CustomPropertyDefinitionVO(
      data.id,
      data.name,
      typeVO,
      options,
      data.order ?? 0,
      data.visible ?? true,
      data.required ?? false,
      data.defaultValue ?? null,
      data.validation
    );
  }

  /**
   * 기본 속성 정의 생성
   */
  static createDefault(
    id: string,
    name: string,
    type: PropertyType
  ): CustomPropertyDefinitionVO {
    const typeVO = PropertyTypeVO.fromPropertyType(type);
    const defaultValue = typeVO.getDefaultValue();

    return new CustomPropertyDefinitionVO(
      id,
      name,
      typeVO,
      [],
      0,
      true,
      false,
      defaultValue
    );
  }
}
