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
  | 'VIEW_MODE_UPDATE_FAILED'
  | 'EDGE_STYLE_UPDATE_FAILED'
  | 'EDGE_SHAPE_UPDATE_FAILED'
  | 'EDGE_MARKERS_UPDATE_FAILED'
  | 'CONNECTED_EDGES_DELETION_FAILED'
  | 'PAGE_MISMATCH'
  | 'EDGE_CREATION_FAILED'
  | 'BLOCK_MOUNT_CREATION_FAILED'
  | 'BLOCK_MOUNT_DUPLICATION_FAILED'
  | 'GROUP_NODE_NOT_FOUND'
  | 'GROUP_NODE_PAGE_MISMATCH'
  | 'ADD_NODE_TO_GROUP_FAILED'
  | 'REMOVE_NODE_FROM_GROUP_FAILED'
  | 'CREATE_GROUP_FROM_NODES_FAILED'
  | 'NESTED_GROUP_NOT_ALLOWED';

// 사용자 메시지 매핑
export const CANVAS_MANAGEMENT_ERROR_MESSAGES: Record<
  CanvasManagementErrorCode,
  string
> = {
  INVALID_POSITION: 'Invalid position values.',
  INVALID_SIZE: 'Invalid block size.',
  INVALID_ZORDER: 'Invalid z-order value.',
  INVALID_EDGE_SHAPE: 'Invalid edge shape.',
  INVALID_EDGE_HANDLE: 'Invalid edge handle position.',
  INVALID_EDGE_COLOR: 'Invalid edge color.',
  INVALID_EDGE_THICKNESS: 'Invalid edge thickness.',
  BLOCK_NOT_FOUND: 'Block not found.',
  EDGE_CONNECTION_FAILED: 'Edge connection failed.',
  VIEWPORT_LIMIT_EXCEEDED: 'Viewport limit exceeded.',
  UNAUTHORIZED_ACCESS: 'Unauthorized access.',
  DATABASE_CONNECTION_FAILED: 'Database connection failed.',
  INVALID_CANVAS_ID: 'Invalid canvas ID.',
  INVALID_BLOCK_MOUNT_ID: 'Invalid block mount ID.',
  INVALID_EDGE_ID: 'Invalid edge ID.',
  INVALID_EDGE_TYPE: 'Invalid edge type.',
  INVALID_PAGE_ID: 'Invalid page ID.',
  BLOCK_MOUNT_NOT_FOUND: 'Block mount not found.',
  EDGE_NOT_FOUND: 'Edge not found.',
  BLOCK_DUPLICATION_FAILED: 'Block duplication failed.',
  BLOCK_MOUNT_DELETION_FAILED: 'Block mount deletion failed.',
  EDGE_DELETION_FAILED: 'Edge deletion failed.',
  EDGE_LABEL_UPDATE_FAILED: 'Edge label update failed.',
  BLOCK_MOVE_FAILED: 'Block move failed.',
  POSITION_UPDATE_FAILED: 'Position update failed.',
  SIZE_UPDATE_FAILED: 'Size update failed.',
  VIEW_MODE_UPDATE_FAILED: 'View mode update failed.',
  EDGE_STYLE_UPDATE_FAILED: 'Edge style update failed.',
  EDGE_SHAPE_UPDATE_FAILED: 'Edge shape update failed.',
  EDGE_MARKERS_UPDATE_FAILED: 'Edge markers update failed.',
  CONNECTED_EDGES_DELETION_FAILED: 'Connected edges deletion failed.',
  PAGE_MISMATCH: 'Page mismatch.',
  EDGE_CREATION_FAILED: 'Edge creation failed.',
  BLOCK_MOUNT_CREATION_FAILED: 'Block mount creation failed.',
  BLOCK_MOUNT_DUPLICATION_FAILED: 'Block mount duplication failed.',
  GROUP_NODE_NOT_FOUND: 'Group node not found.',
  GROUP_NODE_PAGE_MISMATCH: 'Group node page mismatch.',
  ADD_NODE_TO_GROUP_FAILED: 'Failed to add node to group.',
  REMOVE_NODE_FROM_GROUP_FAILED: 'Failed to remove node from group.',
  CREATE_GROUP_FROM_NODES_FAILED: 'Failed to create group from nodes.',
  NESTED_GROUP_NOT_ALLOWED: 'Group blocks cannot be nested inside another group.',
};
