/**
 * Block Editor Schema Registry
 *
 * 블록 에디터 스키마를 등록하고 조회하는 레지스트리
 * 각 블록 타입별 에디터 UI 렌더링 스키마를 관리
 */

import {
  BlockEditorSchema,
  BlockEditorSchemaRegistry,
} from '../../../types/block-editor-schema.interface';
import { textEditorSchema } from '../../block/block-type/text/text-editor-schema';
import { shapeEditorSchema } from '../../block/block-type/shape/shape-editor-schema';
import { imageEditorSchema } from '../../block/block-type/image/image-editor-schema';
import { markdownEditorSchema } from '../../block/block-type/markdown/markdown-editor-schema';
import { linkEditorSchema } from '../../block/block-type/link/link-editor-schema';
import { youtubeEditorSchema } from '../../block/block-type/youtube/youtube-editor-schema';
import { pdfEditorSchema } from '../../block/block-type/pdf/pdf-editor-schema';
import { audioEditorSchema } from '../../block/block-type/audio/audio-editor-schema';

class BlockEditorSchemaRegistryImpl implements BlockEditorSchemaRegistry {
  private schemas: Map<string, BlockEditorSchema> = new Map();

  constructor() {
    // 기본 스키마 등록
    this.registerDefaultSchemas();
  }

  private registerDefaultSchemas(): void {
    // Text Block 스키마 등록
    this.register(textEditorSchema.blockType, textEditorSchema);

    // Shape Block 스키마 등록
    this.register(shapeEditorSchema.blockType, shapeEditorSchema);

    // Image Block 스키마 등록
    this.register(imageEditorSchema.blockType, imageEditorSchema);

    // Markdown Block 스키마 등록
    this.register(markdownEditorSchema.blockType, markdownEditorSchema);

    // Link Block 스키마 등록
    this.register(linkEditorSchema.blockType, linkEditorSchema);

    // YouTube Block 스키마 등록
    this.register(youtubeEditorSchema.blockType, youtubeEditorSchema);

    // PDF Block 스키마 등록
    this.register(pdfEditorSchema.blockType, pdfEditorSchema);

    // Audio Block 스키마 등록
    this.register(audioEditorSchema.blockType, audioEditorSchema);

    // 추후 다른 블록 타입 스키마 추가
  }

  register(blockType: string, schema: BlockEditorSchema): void {
    this.schemas.set(blockType, schema);
  }

  get(blockType: string): BlockEditorSchema | null {
    return this.schemas.get(blockType) || null;
  }

  has(blockType: string): boolean {
    return this.schemas.has(blockType);
  }

  getAll(): Record<string, BlockEditorSchema> {
    const result: Record<string, BlockEditorSchema> = {};
    this.schemas.forEach((schema, blockType) => {
      result[blockType] = schema;
    });
    return result;
  }
}

// Singleton instance
export const blockEditorSchemaRegistry = new BlockEditorSchemaRegistryImpl();

/**
 * 블록 타입에 대한 에디터 스키마 조회
 */
export function getBlockEditorSchema(
  blockType: string
): BlockEditorSchema | null {
  return blockEditorSchemaRegistry.get(blockType);
}

/**
 * 에디터 스키마 존재 여부 확인
 */
export function hasBlockEditorSchema(blockType: string): boolean {
  return blockEditorSchemaRegistry.has(blockType);
}
