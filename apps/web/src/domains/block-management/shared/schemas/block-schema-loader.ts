import { blockSchemaRegistry } from './block-schema-registry';

// 개별 스키마 import
import { basicBlockSchema } from './types/basic-block.schema';
import { markdownBlockSchema } from './types/markdown-block.schema';
import { imageBlockSchema } from './types/image-block.schema';
import { videoBlockSchema } from './types/video-block.schema';
import { shapeSquareBlockSchema } from './types/shape-square-block.schema';
import { shapeCircleBlockSchema } from './types/shape-circle-block.schema';
import { codeBlockSchema } from './types/code-block.schema';

/**
 * Block Schema Loader
 *
 * 모든 블록 타입 스키마를 레지스트리에 등록
 */
export function loadBlockSchemas(): void {
  // 기본 블록 타입들 등록
  blockSchemaRegistry.register('basic', basicBlockSchema);
  blockSchemaRegistry.register('markdown', markdownBlockSchema);
  blockSchemaRegistry.register('image', imageBlockSchema);
  blockSchemaRegistry.register('video', videoBlockSchema);
  blockSchemaRegistry.register('shape-square', shapeSquareBlockSchema);
  blockSchemaRegistry.register('shape-circle', shapeCircleBlockSchema);
  blockSchemaRegistry.register('code', codeBlockSchema);
}

/**
 * 동적 스키마 등록
 *
 * @param blockType - 블록 타입
 * @param schema - 스키마 정의
 */
export function registerBlockSchema(blockType: string, schema: any): void {
  blockSchemaRegistry.register(blockType, schema);
}

/**
 * 스키마 조회
 *
 * @param blockType - 블록 타입
 * @returns 블록 스키마
 */
export function getBlockSchema(blockType: string) {
  return blockSchemaRegistry.get(blockType);
}

/**
 * 스키마 존재 여부 확인
 *
 * @param blockType - 블록 타입
 * @returns 존재 여부
 */
export function hasBlockSchema(blockType: string): boolean {
  return blockSchemaRegistry.has(blockType);
}
