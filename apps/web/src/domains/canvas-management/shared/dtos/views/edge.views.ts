/**
 * Edge 관련 View 타입들 (조회용)
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */

import type { EdgeStyle } from '../../types';

/**
 * EdgeView - 엣지 정보
 *
 * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
 */
export interface EdgeView {
  edgeId: string;
  pageId: string;
  sourceBlockMountId: string;
  targetBlockMountId: string;
  sourceHandle?: string; // React Flow handle ID ('left', 'right', 'top', 'bottom')
  targetHandle?: string; // React Flow handle ID ('left', 'right', 'top', 'bottom')
  edgeShape: string; // 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier'
  label?: string;
  style?: EdgeStyle;
  createdAt: string;
  updatedAt: string;
}
