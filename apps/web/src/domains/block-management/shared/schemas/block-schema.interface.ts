/**
 * Block Schema Interface
 *
 * 각 블록 타입별 스키마를 정의하는 기본 인터페이스
 */

export interface BlockPropertySchema {
  /** 필수 속성 목록 */
  required: string[];
  /** 선택 속성 목록 */
  optional: string[];
  /** 속성별 기본값 */
  defaults: Record<string, any>;
  /** 속성별 검증 규칙 */
  validation: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      required?: boolean;
    }
  >;
}

/**
 * 블록 스키마 레지스트리 인터페이스
 */
export interface BlockSchemaRegistry {
  register(blockType: string, schema: BlockPropertySchema): void;
  get(blockType: string): BlockPropertySchema;
  has(blockType: string): boolean;
  getAll(): Record<string, BlockPropertySchema>;
}

/**
 * 블록 스키마 팩토리 인터페이스
 */
export interface BlockSchemaFactory {
  createSchema(): BlockPropertySchema;
}
