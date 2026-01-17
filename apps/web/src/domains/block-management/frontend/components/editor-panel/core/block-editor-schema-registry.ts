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
import { audioEditorPanelSchema } from '../../block/block-type/audio/config/audio-editor-panel-schema';
import { imageEditorPanelSchema } from '../../block/block-type/image/config/image-editor-panel-schema';
import { linkEditorPanelSchema } from '../../block/block-type/link/config/link-editor-panel-schema';
import { markdownEditorPanelSchema } from '../../block/block-type/markdown/config/markdown-editor-panel-schema';
import { pdfEditorPanelSchema } from '../../block/block-type/pdf/config/pdf-editor-panel-schema';
import { shapeEditorPanelSchema } from '../../block/block-type/shape/config/shape-editor-panel-schema';
import { textEditorPanelSchema } from '../../block/block-type/text/config/text-editor-panel-schema';
import { youtubeEditorPanelSchema } from '../../block/block-type/youtube/config/youtube-editor-panel-schema';

class BlockEditorSchemaRegistryImpl implements BlockEditorSchemaRegistry {
  private schemas: Map<string, BlockEditorSchema> = new Map();

  constructor() {
    // 기본 스키마 등록
    this.registerDefaultSchemas();
  }

  private registerDefaultSchemas(): void {
    // Text Block 스키마 등록
    this.register(textEditorPanelSchema.blockType, textEditorPanelSchema);

    // Shape Block 스키마 등록
    this.register(shapeEditorPanelSchema.blockType, shapeEditorPanelSchema);

    // Image Block 스키마 등록
    this.register(imageEditorPanelSchema.blockType, imageEditorPanelSchema);

    // Markdown Block 스키마 등록
    this.register(
      markdownEditorPanelSchema.blockType,
      markdownEditorPanelSchema
    );

    // Link Block 스키마 등록
    this.register(linkEditorPanelSchema.blockType, linkEditorPanelSchema);

    // YouTube Block 스키마 등록
    this.register(youtubeEditorPanelSchema.blockType, youtubeEditorPanelSchema);

    // PDF Block 스키마 등록
    this.register(pdfEditorPanelSchema.blockType, pdfEditorPanelSchema);

    // Audio Block 스키마 등록
    this.register(audioEditorPanelSchema.blockType, audioEditorPanelSchema);

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
