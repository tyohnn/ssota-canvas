import {
  BlockPropertySchema,
  BlockSchemaRegistry,
} from './block-schema.interface';

/**
 * Block Schema Registry
 *
 * 블록 타입별 스키마를 등록하고 관리하는 레지스트리
 */
class BlockSchemaRegistryImpl implements BlockSchemaRegistry {
  private schemas: Map<string, BlockPropertySchema> = new Map();

  /**
   * 블록 타입 스키마 등록
   */
  register(blockType: string, schema: BlockPropertySchema): void {
    this.schemas.set(blockType, schema);
  }

  /**
   * 블록 타입 스키마 조회
   */
  get(blockType: string): BlockPropertySchema {
    const schema = this.schemas.get(blockType);
    if (!schema) {
      // 기본 스키마 반환 (fallback)
      return this.getDefaultSchema();
    }
    return schema;
  }

  /**
   * 블록 타입 스키마 존재 여부 확인
   */
  has(blockType: string): boolean {
    return this.schemas.has(blockType);
  }

  /**
   * 모든 스키마 조회
   */
  getAll(): Record<string, BlockPropertySchema> {
    return Object.fromEntries(this.schemas);
  }

  /**
   * 기본 스키마 반환 (fallback)
   */
  private getDefaultSchema(): BlockPropertySchema {
    return {
      required: ['title', 'content'],
      optional: ['description', 'tags'],
      defaults: {
        title: '',
        content: '',
        description: '',
        tags: [],
      },
      validation: {
        title: { type: 'string', minLength: 1, maxLength: 100, required: true },
        content: { type: 'string', minLength: 1, required: true },
        description: { type: 'string', maxLength: 500 },
        tags: { type: 'array' },
      },
    };
  }
}

// 싱글톤 인스턴스
export const blockSchemaRegistry = new BlockSchemaRegistryImpl();
