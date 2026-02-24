import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

export class UtteranceContent {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_UTTERANCE_CONTENT,
        'Utterance content cannot be empty'
      );
    }
  }

  equals(other: UtteranceContent): boolean {
    return this._value === other._value;
  }

  getLength(): number {
    return this._value.length;
  }

  isEmpty(): boolean {
    return this._value.trim().length === 0;
  }

  getTrimmed(): string {
    return this._value.trim();
  }

  toString(): string {
    return this._value;
  }
}
