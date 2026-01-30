/**
 * Canvas 관련 Response 타입들 (Server Actions 출력)
 */

import type { CanvasViewData } from '../views/canvas.views';

/**
 * getCanvasViewAction 성공 시 반환 타입 (캔버스 데이터 + org/workspace ID)
 * 페이지 접근 검증된 context에서 orgId, workspaceId를 함께 반환해 호출부에서 재검증 불필요.
 */
export type GetCanvasViewPayload = CanvasViewData & {
  orgId: string;
  workspaceId: string;
};

/**
 * 캔버스 초기화 후 반환되는 DTO
 */
export interface CanvasInitializedDTO {
  canvasId: string;
  pageId: string;
  reactFlowInstanceId: string;
  initializedAt: string;
}

/**
 * 캔버스 데이터 로드 후 반환되는 DTO
 */
export interface CanvasDataLoadedDTO {
  canvasId: string;
  pageId: string;
  blockCount: number;
  edgeCount: number;
  loadedAt: string;
}
