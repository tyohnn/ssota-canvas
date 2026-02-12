import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

export class AIResponse {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_AI_RESPONSE,
        'AI response cannot be empty'
      );
    }
  }

  equals(other: AIResponse): boolean {
    return this._value === other._value;
  }

  getLength(): number {
    return this._value.length;
  }

  getTrimmed(): string {
    return this._value.trim();
  }

  toString(): string {
    return this._value;
  }
}
