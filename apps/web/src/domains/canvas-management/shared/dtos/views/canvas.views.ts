/**
 * Canvas 관련 View 타입들 (조회용)
 */

import type { ViewportInfo } from '../../types';
import type { BlockView } from './block.views';
import type { EdgeView } from './edge.views';

/**
 * CanvasView - 캔버스 기본 정보
 */
export interface CanvasView {
  canvasId: string;
  pageId: string;
  reactFlowInstanceId: string | null;
  isInitialized: boolean;
  blockCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * CanvasViewData - 페이지별 캔버스 전체 데이터
 */
export interface CanvasViewData {
  pageId: string;
  blocks: BlockView[];
  edges: EdgeView[];
  viewport: ViewportInfo | null;
}

/**
 * ViewportView - 뷰포트 상태 정보
 */
export interface ViewportView {
  viewportId: string;
  pageId: string;
  userId: string;
  zoomLevel: number;
  center: { x: number; y: number };
  minZoom: number;
  maxZoom: number;
  lastSavedAt: string;
}
