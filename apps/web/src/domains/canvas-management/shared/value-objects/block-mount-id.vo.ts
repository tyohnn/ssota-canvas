import { CanvasManagementError } from '../errors/canvas-management.error';

export class BlockMountId {
  private readonly _value: string;

  constructor(value: string) {
    // 1. 빈 값 검증
    if (!value || typeof value !== 'string') {
      throw new CanvasManagementError(
        'INVALID_BLOCK_MOUNT_ID',
        'BlockMountId value is required'
      );
    }

    // 2. UUID 형식 검증 (정규식)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value.trim())) {
      throw new CanvasManagementError(
        'INVALID_BLOCK_MOUNT_ID',
        `Invalid BlockMountId UUID format: ${value}`
      );
    }

    // 3. value 할당 (소문자로 정규화)
    this._value = value.trim().toLowerCase();
  }

  get value(): string {
    return this._value;
  }

  equals(other: BlockMountId): boolean {
    // 1. null/undefined 체크
    if (!other) {
      return false;
    }

    // 2. value 비교
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
