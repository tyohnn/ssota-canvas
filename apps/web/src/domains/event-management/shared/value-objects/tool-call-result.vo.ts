import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

export class ToolCallResult {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_TOOL_CALL_RESULT,
        'Tool call result cannot be empty'
      );
    }
  }

  equals(other: ToolCallResult): boolean {
    return this._value === other._value;
  }

  parseJSON<T = unknown>(): T {
    try {
      return JSON.parse(this._value) as T;
    } catch (error) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_TOOL_CALL_RESULT,
        `Failed to parse tool call result as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getLength(): number {
    return this._value.length;
  }

  toString(): string {
    return this._value;
  }
}
