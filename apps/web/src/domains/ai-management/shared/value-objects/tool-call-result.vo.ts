import {
  AIManagementError,
  AIManagementErrorCode,
} from '../errors/ai-management.error';

/**
 * ToolCallResult Value Object
 * 툴 호출 결과 (JSON 문자열 형태)
 */
export class ToolCallResult {
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
        AIManagementErrorCode.INVALID_TOOL_CALL_RESULT,
        'Tool call result cannot be empty'
      );
    }
  }

  /**
   * 값 기반 동등성 비교
   */
  equals(other: ToolCallResult): boolean {
    return this._value === other._value;
  }

  /**
   * JSON 파싱
   */
  parseJSON<T = unknown>(): T {
    try {
      return JSON.parse(this._value) as T;
    } catch (error) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_TOOL_CALL_RESULT,
        `Failed to parse tool call result as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 결과 내용의 길이 반환
   */
  getLength(): number {
    return this._value.length;
  }

  /**
   * 문자열 표현
   */
  toString(): string {
    return this._value;
  }
}
