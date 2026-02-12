import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';

export type EventTypeValue =
  | 'user_utterance'
  | 'ai_response'
  | 'tool_call'
  | 'block_created'
  | 'block_updated'
  | 'block_deleted'
  | 'edge_created'
  | 'edge_updated'
  | 'edge_deleted';

const VALID_TYPES: EventTypeValue[] = [
  'user_utterance',
  'ai_response',
  'tool_call',
  'block_created',
  'block_updated',
  'block_deleted',
  'edge_created',
  'edge_updated',
  'edge_deleted',
];

export class EventType {
  constructor(private readonly _value: EventTypeValue) {
    this.validate(_value);
  }

  get value(): EventTypeValue {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_EVENT_TYPE,
        'Event type cannot be empty'
      );
    }
    if (!VALID_TYPES.includes(value as EventTypeValue)) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_EVENT_TYPE,
        `Invalid event type: ${value}. Must be one of: ${VALID_TYPES.join(', ')}`
      );
    }
  }

  equals(other: EventType): boolean {
    return this._value === other._value;
  }

  isUserUtterance(): boolean {
    return this._value === 'user_utterance';
  }

  isAIResponse(): boolean {
    return this._value === 'ai_response';
  }

  isToolCall(): boolean {
    return this._value === 'tool_call';
  }

  isBlockCreated(): boolean {
    return this._value === 'block_created';
  }

  isBlockUpdated(): boolean {
    return this._value === 'block_updated';
  }

  isBlockDeleted(): boolean {
    return this._value === 'block_deleted';
  }

  isBlockChange(): boolean {
    return (
      this.isBlockCreated() || this.isBlockUpdated() || this.isBlockDeleted()
    );
  }

  toString(): string {
    return this._value;
  }
}
