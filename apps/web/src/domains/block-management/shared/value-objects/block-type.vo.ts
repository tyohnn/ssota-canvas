import { BlockManagementError } from '../errors/block-management.error';

/**
 * 지원되는 블록 타입 목록
 */
export const SUPPORTED_BLOCK_TYPES = [
  'basic',
  'text',
  'image',
  'video',
  'map',
  'code',
  'page',
  'shape',
  'shape-square',
  'shape-circle',
  'todo',
] as const;

export type SupportedBlockType = (typeof SUPPORTED_BLOCK_TYPES)[number];

/**
 * BlockType Value Object
 *
 * 블록 타입의 유효성을 검증하고 도메인 로직을 캡슐화
 */
export class BlockType {
  private readonly _value: SupportedBlockType;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new BlockManagementError(
        'INVALID_BLOCK_TYPE',
        'Invalid block type'
      );
    }
    this._value = value as SupportedBlockType;
  }

  get value(): SupportedBlockType {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    return SUPPORTED_BLOCK_TYPES.includes(value as SupportedBlockType);
  }

  equals(other: BlockType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * page 타입인지 확인
   */
  isPageType(): boolean {
    return this._value === 'page';
  }

  /**
   * 블록 타입 문자열 반환
   */
  toString(): string {
    return this._value;
  }
}
