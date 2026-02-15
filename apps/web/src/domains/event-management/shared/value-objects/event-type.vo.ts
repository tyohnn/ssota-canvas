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
  | 'block_deleted' // 블록 엔티티 영구 삭제 (휴지통 등에서 사용, 예정)
  | 'block_mount_updated'
  | 'block_mount_soft_deleted' // 블록 마운트 소프트 삭제 (캔버스에서 제거)
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
  'block_mount_updated',
  'block_mount_soft_deleted',
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

  isBlockMountUpdated(): boolean {
    return this._value === 'block_mount_updated';
  }

  /** 블록 마운트 소프트 삭제 (캔버스에서 제거). 휴지통 영구 삭제는 block_deleted. */
  isBlockMountSoftDeleted(): boolean {
    return this._value === 'block_mount_soft_deleted';
  }

  toString(): string {
    return this._value;
  }
}
