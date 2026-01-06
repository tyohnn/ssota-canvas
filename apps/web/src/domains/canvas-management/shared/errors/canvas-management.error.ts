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
  | 'INVALID_EDGE_HANDLE'
  | 'INVALID_EDGE_COLOR'
  | 'INVALID_EDGE_THICKNESS'
  | 'BLOCK_NOT_FOUND'
  | 'EDGE_CONNECTION_FAILED'
  | 'VIEWPORT_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATABASE_CONNECTION_FAILED'
  | 'INVALID_CANVAS_ID'
  | 'INVALID_BLOCK_MOUNT_ID'
  | 'INVALID_EDGE_ID'
  | 'INVALID_EDGE_TYPE'
  | 'INVALID_PAGE_ID'
  | 'BLOCK_MOUNT_NOT_FOUND'
  | 'EDGE_NOT_FOUND'
  | 'BLOCK_DUPLICATION_FAILED'
  | 'BLOCK_MOUNT_DELETION_FAILED'
  | 'EDGE_DELETION_FAILED'
  | 'EDGE_LABEL_UPDATE_FAILED'
  | 'BLOCK_MOVE_FAILED'
  | 'POSITION_UPDATE_FAILED'
  | 'SIZE_UPDATE_FAILED'
  | 'EDGE_STYLE_UPDATE_FAILED'
  | 'EDGE_SHAPE_UPDATE_FAILED'
  | 'CONNECTED_EDGES_DELETION_FAILED'
  | 'PAGE_MISMATCH'
  | 'EDGE_CREATION_FAILED'
  | 'BLOCK_MOUNT_CREATION_FAILED'
  | 'BLOCK_MOUNT_DUPLICATION_FAILED';

// 사용자 메시지 매핑
export const CANVAS_MANAGEMENT_ERROR_MESSAGES: Record<
  CanvasManagementErrorCode,
  string
> = {
  INVALID_POSITION: '좌표 값이 유효하지 않습니다.',
  INVALID_SIZE: '블럭 크기가 유효하지 않습니다.',
  INVALID_ZORDER: 'z-order 값이 유효하지 않습니다.',
  INVALID_EDGE_SHAPE: '올바르지 않은 엣지 모양입니다.',
  INVALID_EDGE_HANDLE: '올바르지 않은 엣지 핸들 위치입니다.',
  INVALID_EDGE_COLOR: '올바르지 않은 엣지 색상입니다.',
  INVALID_EDGE_THICKNESS: '올바르지 않은 엣지 두께입니다.',
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
  BLOCK_MOUNT_NOT_FOUND: '블럭 마운트를 찾을 수 없습니다.',
  EDGE_NOT_FOUND: '엣지를 찾을 수 없습니다.',
  BLOCK_DUPLICATION_FAILED: '블럭 복제에 실패했습니다.',
  BLOCK_MOUNT_DELETION_FAILED: '블럭 마운트 삭제에 실패했습니다.',
  EDGE_DELETION_FAILED: '엣지 삭제에 실패했습니다.',
  EDGE_LABEL_UPDATE_FAILED: '엣지 레이블 업데이트에 실패했습니다.',
  BLOCK_MOVE_FAILED: '블럭 이동에 실패했습니다.',
  POSITION_UPDATE_FAILED: '위치 업데이트에 실패했습니다.',
  SIZE_UPDATE_FAILED: '크기 업데이트에 실패했습니다.',
  EDGE_STYLE_UPDATE_FAILED: '엣지 스타일 업데이트에 실패했습니다.',
  EDGE_SHAPE_UPDATE_FAILED: '엣지 모양 업데이트에 실패했습니다.',
  CONNECTED_EDGES_DELETION_FAILED: '연결된 엣지 삭제에 실패했습니다.',
  PAGE_MISMATCH: '페이지가 일치하지 않습니다.',
  EDGE_CREATION_FAILED: '엣지 생성에 실패했습니다.',
  BLOCK_MOUNT_CREATION_FAILED: '블럭 마운트 생성에 실패했습니다.',
  BLOCK_MOUNT_DUPLICATION_FAILED: '블럭 마운트 복제에 실패했습니다.',
};
