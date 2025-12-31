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
 * ⚠️ Handle은 항상 존재해야 함 (Entity에서 required)
 */
export interface EdgeView {
  edgeId: string;
  pageId: string;
  sourceBlockMountId: string;
  targetBlockMountId: string;
  sourceHandle: string;
  targetHandle: string;
  edgeShape: string;
  label?: string;
  style?: EdgeStyle;
  createdAt: string;
  updatedAt: string;
}
