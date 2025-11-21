// apps/web/src/domains/canvas-management/shared/errors/canvas-management.error.ts

export class CanvasManagementError extends Error {
  constructor(
    public readonly code: CanvasManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CanvasManagementError';
  }
}

export type CanvasManagementErrorCode =
  | 'INVALID_POSITION'
  | 'INVALID_SIZE'
  | 'INVALID_ZORDER'
  | 'INVALID_EDGE_SHAPE'
  | 'BLOCK_NOT_FOUND'
  | 'EDGE_CONNECTION_FAILED'
  | 'VIEWPORT_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATABASE_CONNECTION_FAILED'
  | 'INVALID_CANVAS_ID'
  | 'INVALID_BLOCK_MOUNT_ID'
  | 'INVALID_EDGE_ID'
  | 'INVALID_EDGE_TYPE'
  | 'INVALID_PAGE_ID';

// 사용자 메시지 매핑
export const CANVAS_MANAGEMENT_ERROR_MESSAGES: Record<
  CanvasManagementErrorCode,
  string
> = {
  INVALID_POSITION: '좌표 값이 유효하지 않습니다.',
  INVALID_SIZE: '블럭 크기가 유효하지 않습니다.',
  INVALID_ZORDER: 'z-order 값이 유효하지 않습니다.',
  INVALID_EDGE_SHAPE: '올바르지 않은 엣지 모양입니다.',
  BLOCK_NOT_FOUND: '블럭을 찾을 수 없습니다.',
  EDGE_CONNECTION_FAILED: '엣지 연결에 실패했습니다.',
  VIEWPORT_LIMIT_EXCEEDED: '뷰포트 제한을 초과했습니다.',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다.',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
  INVALID_CANVAS_ID: '올바르지 않은 캔버스 ID입니다.',
  INVALID_BLOCK_MOUNT_ID: '올바르지 않은 블럭 마운트 ID입니다.',
  INVALID_EDGE_ID: '올바르지 않은 엣지 ID입니다.',
  INVALID_EDGE_TYPE: '올바르지 않은 엣지 타입입니다.',
  INVALID_PAGE_ID: '올바르지 않은 페이지 ID입니다.',
};
