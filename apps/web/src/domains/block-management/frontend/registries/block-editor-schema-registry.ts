/**
 * Block Editor Schema Registry
 *
 * 블록 에디터 스키마를 등록하고 조회하는 레지스트리
 * 각 블록 타입별 에디터 UI 렌더링 스키마를 관리
 */
import {
  BlockEditorSchema,
  BlockEditorSchemaRegistry,
} from '../types/block-editor-schema.interface';
import { audioEditorPanelSchema } from '../components/block/block-type/audio/config/audio-editor-panel-schema';
import { imageEditorPanelSchema } from '../components/block/block-type/image/config/image-editor-panel-schema';
import { linkEditorPanelSchema } from '../components/block/block-type/link/config/link-editor-panel-schema';
import { markdownEditorPanelSchema } from '../components/block/block-type/markdown/config/markdown-editor-panel-schema';
import { pdfEditorPanelSchema } from '../components/block/block-type/pdf/config/pdf-editor-panel-schema';
import { shapeEditorPanelSchema } from '../components/block/block-type/shape/config/shape-editor-panel-schema';
import { textEditorPanelSchema } from '../components/block/block-type/text/config/text-editor-panel-schema';
import { youtubeEditorPanelSchema } from '../components/block/block-type/youtube/config/youtube-editor-panel-schema';

class BlockEditorSchemaRegistryImpl implements BlockEditorSchemaRegistry {
  private schemas: Map<string, BlockEditorSchema> = new Map();

  constructor() {
    this.registerDefaultSchemas();
  }

  private registerDefaultSchemas(): void {
    this.register(textEditorPanelSchema.blockType, textEditorPanelSchema);
    this.register(shapeEditorPanelSchema.blockType, shapeEditorPanelSchema);
    this.register(imageEditorPanelSchema.blockType, imageEditorPanelSchema);
    this.register(
      markdownEditorPanelSchema.blockType,
      markdownEditorPanelSchema
    );
    this.register(linkEditorPanelSchema.blockType, linkEditorPanelSchema);
    this.register(youtubeEditorPanelSchema.blockType, youtubeEditorPanelSchema);
    this.register(pdfEditorPanelSchema.blockType, pdfEditorPanelSchema);
    this.register(audioEditorPanelSchema.blockType, audioEditorPanelSchema);
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

export const blockEditorSchemaRegistry = new BlockEditorSchemaRegistryImpl();

export function getBlockEditorSchema(
  blockType: string
): BlockEditorSchema | null {
  return blockEditorSchemaRegistry.get(blockType);
}

export function hasBlockEditorSchema(blockType: string): boolean {
  return blockEditorSchemaRegistry.has(blockType);
}
