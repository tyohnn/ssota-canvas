// Visual Canvas Domain - BlockId Value Object
// DDD Value Object: 불변, 값으로 식별

import { v4 as uuidv4 } from 'uuid';

export class BlockId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('BlockId cannot be empty');
    }

    // UUID 형식 검증 (선택적)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('BlockId must be a valid UUID');
    }
  }

  static generate(): BlockId {
    return new BlockId(uuidv4());
  }

  static fromString(value: string): BlockId {
    return new BlockId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: BlockId): boolean {
    return this.value === other.value;
  }

  // 해시 코드 (Map, Set에서 사용)
  hashCode(): string {
    return this.value;
  }
}


