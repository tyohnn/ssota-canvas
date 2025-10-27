import { BlockManagementError } from '../errors/block-management.error';

export class PropertyOption {
  constructor(
    public readonly label: string,
    public readonly value: string
  ) {
    this.validate(label, value);
  }

  private validate(label: string, value: string): void {
    if (!label || label.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option label cannot be empty'
      );
    }

    if (!value || value.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_OPTION',
        'Option value cannot be empty'
      );
    }
  }

  equals(other: PropertyOption): boolean {
    return this.label === other.label && this.value === other.value;
  }

  toString(): string {
    return this.label;
  }

  toJSON(): { label: string; value: string } {
    return {
      label: this.label,
      value: this.value,
    };
  }
}
