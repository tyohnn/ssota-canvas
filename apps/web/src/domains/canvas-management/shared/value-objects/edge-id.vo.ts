import { CanvasManagementError } from '../errors/canvas-management.error';

export class EdgeId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new CanvasManagementError(
        'INVALID_EDGE_ID',
        'Invalid EdgeId format'
      );
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // 공백 제거 후 빈 문자열 체크
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return false;
    }

    // UUID v4 형식 검증 (고정된 패턴 사용)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmedValue);
  }

  equals(other: EdgeId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  static generate(): EdgeId {
    // 간단한 UUID v4 생성 (실제 프로덕션에서는 crypto.randomUUID() 사용 권장)
    const generateUUID = (): string => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };

    return new EdgeId(generateUUID());
  }
}
