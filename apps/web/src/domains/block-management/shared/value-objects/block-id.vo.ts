import { BlockManagementError } from '../errors/block-management.error';

export class BlockId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new BlockManagementError(
        'INVALID_BLOCK_ID',
        'Invalid BlockId format'
      );
    }
    this._value = value;
  }

  /**
   * 새로운 BlockId 생성
   */
  static generate(): BlockId {
    // UUID v4 생성
    const uuid = crypto.randomUUID();
    return new BlockId(uuid);
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

    // UUID v4 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmedValue);
  }

  equals(other: BlockId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
