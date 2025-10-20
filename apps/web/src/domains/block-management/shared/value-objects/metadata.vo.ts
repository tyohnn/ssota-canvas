/**
 * Metadata Value Object
 *
 * 블록 타입별 확장 속성을 관리하고 스키마 검증
 */
export class Metadata {
  private readonly _value: Record<string, any> | null;

  constructor(value?: Record<string, any> | null) {
    // undefined는 빈 객체로 처리
    if (value === undefined) {
      this._value = {};
    } else {
      this._value = value;
    }
  }

  get value(): Record<string, any> | null {
    return this._value;
  }

  /**
   * 두 메타데이터를 병합
   * @param other - 병합할 메타데이터
   * @returns 병합된 새로운 Metadata 인스턴스
   */
  merge(other: Metadata): Metadata {
    // null 메타데이터 병합 시 원본 유지
    if (other._value === null) {
      return new Metadata(this._value);
    }

    if (this._value === null) {
      return new Metadata(other._value);
    }

    // 두 객체 병합 (나중 값으로 덮어쓰기)
    return new Metadata({ ...this._value, ...other._value });
  }

  /**
   * 특정 필드의 값을 반환
   * @param key - 필드 키
   * @returns 필드 값 또는 undefined
   */
  get(key: string): any {
    if (this._value === null) {
      return undefined;
    }
    return this._value[key];
  }

  /**
   * 필드가 존재하는지 확인
   * @param key - 필드 키
   * @returns 존재 여부
   */
  has(key: string): boolean {
    if (this._value === null) {
      return false;
    }
    return key in this._value;
  }

  /**
   * 메타데이터를 JSON 문자열로 변환
   * @returns JSON 문자열
   */
  toJSON(): string {
    return JSON.stringify(this._value);
  }

  /**
   * 두 메타데이터가 같은지 비교
   * @param other - 비교할 메타데이터
   * @returns 같은지 여부
   */
  equals(other: Metadata): boolean {
    if (!other) return false;
    return this.toJSON() === other.toJSON();
  }
}
