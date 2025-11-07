/**
 * Block UI Schema Registry
 *
 * 블록 UI 스키마를 등록하고 조회하는 레지스트리
 */

import {
  BlockUISchema,
  BlockUISchemaRegistry,
} from './block-ui-schema.interface';
import { textBlockUISchema } from './text-block.ui-schema';
import { shapeBlockUISchema } from './shape-block.ui-schema';
import { imageBlockUISchema } from './image-block.ui-schema';
import { markdownBlockUISchema } from './markdown-block.ui-schema';
import { linkBlockUISchema } from './link-block.ui-schema';
import { youtubeBlockUISchema } from './youtube-block.ui-schema';
import { pdfBlockUISchema } from './pdf-block.ui-schema';
import { audioBlockUISchema } from './audio-block.ui-schema';

class BlockUISchemaRegistryImpl implements BlockUISchemaRegistry {
  private schemas: Map<string, BlockUISchema> = new Map();

  constructor() {
    // 기본 스키마 등록
    this.registerDefaultSchemas();
  }

  private registerDefaultSchemas(): void {
    // Text Block 스키마 등록
    this.register(textBlockUISchema.blockType, textBlockUISchema);

    // Shape Block 스키마 등록
    this.register(shapeBlockUISchema.blockType, shapeBlockUISchema);

    // Image Block 스키마 등록
    this.register(imageBlockUISchema.blockType, imageBlockUISchema);

    // Markdown Block 스키마 등록
    this.register(markdownBlockUISchema.blockType, markdownBlockUISchema);

    // Link Block 스키마 등록
    this.register(linkBlockUISchema.blockType, linkBlockUISchema);

    // YouTube Block 스키마 등록
    this.register(youtubeBlockUISchema.blockType, youtubeBlockUISchema);

    // PDF Block 스키마 등록
    this.register(pdfBlockUISchema.blockType, pdfBlockUISchema);

    // Audio Block 스키마 등록
    this.register(audioBlockUISchema.blockType, audioBlockUISchema);

    // 추후 다른 블록 타입 스키마 추가
  }

  register(blockType: string, schema: BlockUISchema): void {
    this.schemas.set(blockType, schema);
  }

  get(blockType: string): BlockUISchema | null {
    return this.schemas.get(blockType) || null;
  }

  has(blockType: string): boolean {
    return this.schemas.has(blockType);
  }

  getAll(): Record<string, BlockUISchema> {
    const result: Record<string, BlockUISchema> = {};
    this.schemas.forEach((schema, blockType) => {
      result[blockType] = schema;
    });
    return result;
  }
}

// Singleton instance
export const blockUISchemaRegistry = new BlockUISchemaRegistryImpl();

/**
 * 블록 타입에 대한 UI 스키마 조회
 */
export function getBlockUISchema(blockType: string): BlockUISchema | null {
  return blockUISchemaRegistry.get(blockType);
}

/**
 * UI 스키마 존재 여부 확인
 */
export function hasBlockUISchema(blockType: string): boolean {
  return blockUISchemaRegistry.has(blockType);
}
