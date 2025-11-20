/**
 * Canvas 관련 Request 타입들 (Server Actions 입력)
 */

import type { Position } from '../../types';

/**
 * 캔버스 초기화 요청
 */
export interface InitializeCanvasRequest {
  pageId: string;
}

/**
 * 뷰포트 업데이트 요청
 */
export interface UpdateViewportRequest {
  pageId: string;
  zoomLevel?: number;
  center?: Position;
}
