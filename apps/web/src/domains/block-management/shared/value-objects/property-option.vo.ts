import { BlockManagementError } from '../errors/block-management.error';

/**
 * Property Option Value Object
 *
 * 선택 옵션의 비즈니스 로직과 검증을 캡슐화
 */
export class PropertyOptionVO {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly value: string,
    public readonly color?: string,
    public readonly order: number = 0,
    public readonly disabled: boolean = false,
    public readonly description?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option ID cannot be empty'
      );
    }

    if (!this.label || this.label.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option label cannot be empty'
      );
    }

    if (!this.value || this.value.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option value cannot be empty'
      );
    }

    if (this.order < 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option order cannot be negative'
      );
    }
  }

  /**
   * 옵션 활성화/비활성화
   */
  setDisabled(disabled: boolean): PropertyOptionVO {
    return new PropertyOptionVO(
      this.id,
      this.label,
      this.value,
      this.color,
      this.order,
      disabled,
      this.description
    );
  }

  /**
   * 색상 변경
   */
  setColor(color: string): PropertyOptionVO {
    return new PropertyOptionVO(
      this.id,
      this.label,
      this.value,
      color,
      this.order,
      this.disabled,
      this.description
    );
  }

  /**
   * 순서 변경
   */
  setOrder(order: number): PropertyOptionVO {
    return new PropertyOptionVO(
      this.id,
      this.label,
      this.value,
      this.color,
      order,
      this.disabled,
      this.description
    );
  }

  /**
   * 설명 추가/수정
   */
  setDescription(description: string): PropertyOptionVO {
    return new PropertyOptionVO(
      this.id,
      this.label,
      this.value,
      this.color,
      this.order,
      this.disabled,
      description
    );
  }

  equals(other: PropertyOptionVO): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.label;
  }

  toJSON(): {
    id: string;
    label: string;
    value: string;
    color?: string;
    order: number;
    disabled: boolean;
    description?: string;
  } {
    return {
      id: this.id,
      label: this.label,
      value: this.value,
      color: this.color,
      order: this.order,
      disabled: this.disabled,
      description: this.description,
    };
  }

  /**
   * JSON 데이터로부터 PropertyOptionVO 생성
   */
  static fromJSON(data: {
    id: string;
    label: string;
    value: string;
    color?: string;
    order?: number;
    disabled?: boolean;
    description?: string;
  }): PropertyOptionVO {
    return new PropertyOptionVO(
      data.id,
      data.label,
      data.value,
      data.color,
      data.order ?? 0,
      data.disabled ?? false,
      data.description
    );
  }

  /**
   * 기본 옵션 생성
   */
  static createDefault(
    id: string,
    label: string,
    value: string
  ): PropertyOptionVO {
    return new PropertyOptionVO(id, label, value);
  }
}
