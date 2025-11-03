/**
 * Shadow Block Preview Registry
 *
 * 블록 타입별 Shadow Preview 컴포넌트 매핑
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { DefaultShadowPreview } from './previews/default-shadow-preview';
import { TextShadowPreview } from './previews/text-shadow-preview';
import { ShapeShadowPreview } from './previews/shape-shadow-preview';

export interface ShadowPreviewProps {
  blockType: BlockType;
  width: number;
  height: number;
}

/**
 * 블록 타입별 Shadow Preview 매핑
 */
const SHADOW_PREVIEW_MAP: Partial<Record<BlockType, React.ComponentType<ShadowPreviewProps>>> = {
  [BlockType.TEXT]: TextShadowPreview,
  [BlockType.SHAPE]: ShapeShadowPreview,
  // 추가 블록 타입들은 필요시 여기에 추가
  // [BlockType.MARKDOWN]: MarkdownShadowPreview,
  // [BlockType.YOUTUBE]: YoutubeShadowPreview,
};

/**
 * 블록 타입에 맞는 Shadow Preview 컴포넌트 반환
 *
 * @param blockType - 블록 타입
 * @returns Shadow Preview 컴포넌트
 */
export function getShadowPreview(
  blockType: BlockType
): React.ComponentType<ShadowPreviewProps> {
  return SHADOW_PREVIEW_MAP[blockType] || DefaultShadowPreview;
}

/**
 * 새로운 Shadow Preview 등록
 *
 * @param blockType - 블록 타입
 * @param component - Preview 컴포넌트
 */
export function registerShadowPreview(
  blockType: BlockType,
  component: React.ComponentType<ShadowPreviewProps>
): void {
  SHADOW_PREVIEW_MAP[blockType] = component;
}

