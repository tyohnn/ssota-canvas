import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * EventId Value Object
 */
export class EventId {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_EVENT_ID,
        'Event ID cannot be empty'
      );
    }
    if (!UUID_REGEX.test(value)) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_EVENT_ID,
        'Invalid Event ID format'
      );
    }
  }

  equals(other: EventId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
