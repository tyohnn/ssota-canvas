/**
 * Canvas 관련 Response 타입들 (Server Actions 출력)
 */

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
