export class BlockManagementError extends Error {
  constructor(
    public readonly code: BlockManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BlockManagementError';
  }
}

export type BlockManagementErrorCode =
  | 'INVALID_BLOCK_ID'
  | 'INVALID_BLOCK_TYPE'
  | 'INVALID_WORKSPACE_ID'
  | 'INVALID_METADATA_SCHEMA'
  | 'BLOCK_NOT_FOUND'
  | 'BLOCK_ALREADY_EXISTS'
  | 'BLOCK_ALREADY_DELETED'
  | 'INVALID_OPERATION'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'WORKSPACE_ACCESS_DENIED'
  | 'DATABASE_CONNECTION_FAILED';

// 사용자 메시지 매핑
export const BLOCK_MANAGEMENT_ERROR_MESSAGES: Record<
  BlockManagementErrorCode,
  string
> = {
  INVALID_BLOCK_ID: '올바르지 않은 블럭 ID입니다.',
  INVALID_BLOCK_TYPE: '올바르지 않은 블럭 타입입니다.',
  INVALID_WORKSPACE_ID: '올바르지 않은 워크스페이스 ID입니다.',
  INVALID_METADATA_SCHEMA: '메타데이터 스키마가 유효하지 않습니다.',
  BLOCK_NOT_FOUND: '블럭을 찾을 수 없습니다.',
  BLOCK_ALREADY_EXISTS: '이미 존재하는 블럭입니다.',
  BLOCK_ALREADY_DELETED: '이미 삭제된 블럭입니다.',
  INVALID_OPERATION: '유효하지 않은 작업입니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  WORKSPACE_ACCESS_DENIED: '워크스페이스 접근이 거부되었습니다.',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
};
