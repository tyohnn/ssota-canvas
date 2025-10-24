import { BlockManagementError } from '../errors/block-management.error';

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export class PropertyValidation {
  constructor(public readonly rules: ValidationRules) {
    this.validate(rules);
  }

  private validate(rules: ValidationRules): void {
    if (rules === null || rules === undefined) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_VALIDATION',
        'Validation rules cannot be null or undefined'
      );
    }
  }

  isRequired(): boolean {
    return this.rules.required === true;
  }

  getMinLength(): number | undefined {
    return this.rules.minLength;
  }

  getMaxLength(): number | undefined {
    return this.rules.maxLength;
  }

  getPattern(): string | undefined {
    return this.rules.pattern;
  }

  hasLengthValidation(): boolean {
    return this.rules.minLength !== undefined || this.rules.maxLength !== undefined;
  }

  hasPatternValidation(): boolean {
    return this.rules.pattern !== undefined;
  }

  equals(other: PropertyValidation): boolean {
    return JSON.stringify(this.rules) === JSON.stringify(other.rules);
  }

  toJSON(): ValidationRules {
    return { ...this.rules };
  }
}
