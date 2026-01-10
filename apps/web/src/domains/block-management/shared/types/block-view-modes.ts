/**
 * Block View Modes Configuration
 *
 * 블록 타입별로 사용 가능한 View Mode를 정의합니다.
 * - DataBlock: 여러 View Mode를 지원하는 블록 (markdown, shape, image, youtube 등)
 * - BasicBlock: 단일 View Mode만 지원하는 블록 (text, sticker 등)
 */
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import { BlockType } from './block-types';

/**
 * 블록 타입별 사용 가능한 View Mode 목록
 */
export const BLOCK_VIEW_MODES: Record<BlockType, BlockViewModeValue[]> = {
  // DataBlocks - 여러 View Mode 지원
  markdown: ['note', 'card'],
  shape: ['note', 'original', 'card'],
  image: ['note', 'original', 'card'],
  youtube: ['note', 'original', 'card'],

  // BasicBlocks - 단일 View Mode만 지원
  text: ['original'],
  link: ['original'],
  pdf: ['original'],
  audio: ['original'],
  video: ['original'],
  file: ['original'],
  python: ['original'],
  page_mention: ['original'],
  latex: ['original'],
  react_component: ['original'],
  github_branch: ['original'],
  github_commit: ['original'],
  github_pr: ['original'],
  react_preview: ['original'],
  vercel_deployment: ['original'],
};

/**
 * DataBlock 여부 확인
 *
 * @param blockType - 블록 타입
 * @returns DataBlock 여부 (여러 View Mode 지원)
 */
export function isDataBlock(blockType: BlockType): boolean {
  const viewModes = BLOCK_VIEW_MODES[blockType];
  return viewModes ? viewModes.length > 1 : false;
}

/**
 * 블록 타입의 기본 View Mode 가져오기
 *
 * @param blockType - 블록 타입
 * @returns 기본 View Mode
 */
export function getDefaultViewMode(blockType: BlockType): BlockViewModeValue {
  const viewModes = BLOCK_VIEW_MODES[blockType];
  if (!viewModes || viewModes.length === 0) {
    return 'original';
  }
  return viewModes[0]!;
}
