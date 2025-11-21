/**
 * Canvas 관련 Internal 타입들 (도메인 내부 처리용)
 */

import type {
  BlockView,
  BlockMountView,
  EdgeView,
  ViewportView,
  CanvasView,
} from '../views';

/**
 * BlockDTO - Block Management Domain에서 가져온 블럭 정보
 */
export interface BlockDTO {
  id: string;
  blockType: string;
  workspaceId: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * CanvasPageData - 서버에서 초기 데이터 로드 시 사용
 */
export interface CanvasPageData {
  canvas: CanvasView | null;
  blocks: BlockDTO[]; // Block 정보 (타입, 메타데이터)
  blockMounts: BlockMountView[]; // BlockMount 정보 (위치, 크기)
  edges: EdgeView[]; // 엣지 정보
  viewport: ViewportView | null;
}
