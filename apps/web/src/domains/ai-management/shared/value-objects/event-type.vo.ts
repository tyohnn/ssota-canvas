import {
  AIManagementError,
  AIManagementErrorCode,
} from '../errors/ai-management.error';

/**
 * 이벤트 타입 리터럴
 */
export type EventTypeValue =
  | 'user_utterance'
  | 'ai_response'
  | 'tool_call'
  | 'block_created'
  | 'block_updated'
  | 'block_deleted'
  | 'edge_created'
  | 'edge_updated'
  | 'edge_deleted'
  | 'component_created'
  | 'component_updated'
  | 'component_deleted'
  | 'instance_created'
  | 'instance_updated'
  | 'instance_deleted'
  | 'property_created'
  | 'property_updated'
  | 'property_deleted'
  | 'property_value_set'
  | 'property_value_reset';

/**
 * EventType Value Object
 * 이벤트 로그의 타입 (user_utterance, ai_response, tool_call, block_created, block_updated, block_deleted)
 */
export class EventType {
  private static readonly VALID_TYPES: EventTypeValue[] = [
    'user_utterance',
    'ai_response',
    'tool_call',
    'block_created',
    'block_updated',
    'block_deleted',
    'edge_created',
    'edge_updated',
    'edge_deleted',
    'component_created',
    'component_updated',
    'component_deleted',
    'instance_created',
    'instance_updated',
    'instance_deleted',
    'property_created',
    'property_updated',
    'property_deleted',
    'property_value_set',
    'property_value_reset',
  ];

  constructor(private readonly _value: EventTypeValue) {
    this.validate(_value);
  }

  get value(): EventTypeValue {
    return this._value;
  }

  private validate(value: string): void {
    // 1. 빈 값 검증
    if (!value || value.trim().length === 0) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_EVENT_TYPE,
        'Event type cannot be empty'
      );
    }

    // 2. 유효한 타입 검증
    if (!EventType.VALID_TYPES.includes(value as EventTypeValue)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_EVENT_TYPE,
        `Invalid event type: ${value}. Must be one of: ${EventType.VALID_TYPES.join(', ')}`
      );
    }
  }

  /**
   * 값 기반 동등성 비교
   */
  equals(other: EventType): boolean {
    return this._value === other._value;
  }

  /**
   * 사용자 발화 타입인지 확인
   */
  isUserUtterance(): boolean {
    return this._value === 'user_utterance';
  }

  /**
   * AI 응답 타입인지 확인
   */
  isAIResponse(): boolean {
    return this._value === 'ai_response';
  }

  /**
   * 툴 호출 타입인지 확인
   */
  isToolCall(): boolean {
    return this._value === 'tool_call';
  }

  /**
   * 블럭 생성 타입인지 확인
   */
  isBlockCreated(): boolean {
    return this._value === 'block_created';
  }

  /**
   * 블럭 수정 타입인지 확인
   */
  isBlockUpdated(): boolean {
    return this._value === 'block_updated';
  }

  /**
   * 블럭 삭제 타입인지 확인
   */
  isBlockDeleted(): boolean {
    return this._value === 'block_deleted';
  }

  /**
   * 블럭 변경 타입인지 확인 (created, updated, deleted 중 하나)
   */
  isBlockChange(): boolean {
    return (
      this.isBlockCreated() || this.isBlockUpdated() || this.isBlockDeleted()
    );
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value;
  }
}
