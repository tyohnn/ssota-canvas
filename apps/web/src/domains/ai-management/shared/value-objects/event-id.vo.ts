import {
  AIManagementError,
  AIManagementErrorCode,
} from '../errors/ai-management.error';

// UUID 정규식
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * EventId Value Object
 * 이벤트 로그의 고유 식별자 (UUID 형식)
 */
export class EventId {
  constructor(private readonly _value: string) {
    this.validate(_value);
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    // 1. 빈 값 검증
    if (!value || value.trim().length === 0) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_EVENT_ID,
        'Event ID cannot be empty'
      );
    }

    // 2. UUID 형식 검증
    if (!UUID_REGEX.test(value)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_EVENT_ID,
        'Invalid Event ID format'
      );
    }
  }

  /**
   * 값 기반 동등성 비교
   */
  equals(other: EventId): boolean {
    return this._value === other._value;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value;
  }
}
