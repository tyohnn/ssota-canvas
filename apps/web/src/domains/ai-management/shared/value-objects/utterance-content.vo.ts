import {
  AIManagementError,
  AIManagementErrorCode,
} from '../errors/ai-management.error';

/**
 * UtteranceContent Value Object
 * 사용자 발화 내용 (최대 길이 제한 없음)
 */
export class UtteranceContent {
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
        AIManagementErrorCode.INVALID_UTTERANCE_CONTENT,
        'Utterance content cannot be empty'
      );
    }
  }

  /**
   * 값 기반 동등성 비교
   */
  equals(other: UtteranceContent): boolean {
    return this._value === other._value;
  }

  /**
   * 발화 내용의 길이 반환
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * 내용이 비어있는지 확인 (trim 후)
   */
  isEmpty(): boolean {
    return this._value.trim().length === 0;
  }

  /**
   * 앞뒤 공백이 제거된 내용 반환
   */
  getTrimmed(): string {
    return this._value.trim();
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value;
  }
}
