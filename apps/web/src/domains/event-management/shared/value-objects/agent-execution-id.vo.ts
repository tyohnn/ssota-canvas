import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

/**
 * Agent execution trace identifier (e.g. one agent run).
 */
export class AgentExecutionId {
  constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'Agent execution ID cannot be empty'
      );
    }
    this._value = _value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: AgentExecutionId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
