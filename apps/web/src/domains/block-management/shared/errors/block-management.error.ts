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
  | 'WORKSPACE_MISMATCH'
  | 'DATABASE_CONNECTION_FAILED'
  | 'CUSTOM_PROPERTY_LIMIT_EXCEEDED'
  | 'PROPERTY_NOT_FOUND'
  | 'PROPERTY_TYPE_MISMATCH'
  | 'PROPERTY_CREATE_FAILED'
  | 'PROPERTY_UPDATE_FAILED'
  | 'PROPERTY_DELETE_FAILED'
  | 'PROPERTY_FETCH_FAILED'
  | 'INVALID_PROPERTY_OPTION'
  | 'INVALID_PROPERTY_TYPE'
  | 'INVALID_PROPERTY_DEFINITION'
  | 'INVALID_PROPERTY_VALIDATION'
  | 'INVALID_MEDIA_URL'
  | 'MEDIA_FILE_TYPE_MISMATCH'
  | 'MEDIA_FILE_SIZE_EXCEEDED'
  | 'MEDIA_FILE_TYPE_NOT_SUPPORTED'
  | 'BLOCK_TOOL_EXECUTION_FAILED'
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_HISTORY_FETCH_FAILED'
  | 'TOOL_EXECUTION_FETCH_FAILED'
  | 'BLOCK_CREATION_FAILED'
  | 'BLOCK_FETCH_FAILED'
  | 'BLOCK_UPDATE_FAILED'
  | 'BLOCK_TYPE_UPDATE_FAILED'
  | 'BLOCK_DELETE_FAILED'
  | 'BLOCK_RESTORE_FAILED'
  | 'BLOCKS_FETCH_FAILED'
  | 'BLOCK_EXISTS_CHECK_FAILED'
  | 'BLOCK_COUNT_FAILED'
  | 'BLOCK_DUPLICATION_FAILED'
  | 'BLOCK_SAVE_FAILED'
  | 'BLOCK_HARD_DELETE_FAILED'
  | 'PROFILE_NOT_FOUND'
  | 'INVALID_PROPERTY_PATH'
  | 'BLOCK_PROPERTY_UPDATE_FAILED';

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
  WORKSPACE_MISMATCH: '블록이 해당 워크스페이스에 속하지 않습니다.',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
  CUSTOM_PROPERTY_LIMIT_EXCEEDED: '커스텀 속성 개수 제한을 초과했습니다.',
  PROPERTY_NOT_FOUND: '속성을 찾을 수 없습니다.',
  PROPERTY_TYPE_MISMATCH: '속성 타입이 일치하지 않습니다.',
  PROPERTY_CREATE_FAILED: '속성 생성에 실패했습니다.',
  PROPERTY_UPDATE_FAILED: '속성 업데이트에 실패했습니다.',
  PROPERTY_DELETE_FAILED: '속성 삭제에 실패했습니다.',
  PROPERTY_FETCH_FAILED: '속성 조회에 실패했습니다.',
  INVALID_PROPERTY_TYPE: '올바르지 않은 속성 타입입니다.',
  INVALID_PROPERTY_OPTION: '올바르지 않은 속성 옵션입니다.',
  INVALID_PROPERTY_DEFINITION: '올바르지 않은 속성 정의입니다.',
  INVALID_PROPERTY_VALIDATION: '올바르지 않은 속성 검증 규칙입니다.',
  INVALID_MEDIA_URL: '올바르지 않은 미디어 URL입니다.',
  MEDIA_FILE_TYPE_MISMATCH: '미디어 파일 타입이 일치하지 않습니다.',
  MEDIA_FILE_SIZE_EXCEEDED: '미디어 파일 크기가 제한을 초과했습니다.',
  MEDIA_FILE_TYPE_NOT_SUPPORTED: '지원하지 않는 미디어 파일 타입입니다.',
  BLOCK_TOOL_EXECUTION_FAILED: '블럭 도구 실행에 실패했습니다.',
  TOOL_EXECUTION_FAILED: '도구 실행에 실패했습니다.',
  TOOL_HISTORY_FETCH_FAILED: '도구 히스토리 조회에 실패했습니다.',
  TOOL_EXECUTION_FETCH_FAILED: '도구 실행 결과 조회에 실패했습니다.',
  BLOCK_CREATION_FAILED: '블럭 생성에 실패했습니다.',
  BLOCK_FETCH_FAILED: '블럭 조회에 실패했습니다.',
  BLOCK_UPDATE_FAILED: '블럭 업데이트에 실패했습니다.',
  BLOCK_TYPE_UPDATE_FAILED: '블럭 타입 변경에 실패했습니다.',
  BLOCK_DELETE_FAILED: '블럭 삭제에 실패했습니다.',
  BLOCK_RESTORE_FAILED: '블럭 복원에 실패했습니다.',
  BLOCKS_FETCH_FAILED: '블럭 목록 조회에 실패했습니다.',
  BLOCK_EXISTS_CHECK_FAILED: '블럭 존재 여부 확인에 실패했습니다.',
  BLOCK_COUNT_FAILED: '블럭 개수 조회에 실패했습니다.',
  BLOCK_DUPLICATION_FAILED: '블럭 복제에 실패했습니다.',
  BLOCK_SAVE_FAILED: '블럭 저장에 실패했습니다.',
  BLOCK_HARD_DELETE_FAILED: '블럭 영구 삭제에 실패했습니다.',
  PROFILE_NOT_FOUND: '사용자 프로필을 찾을 수 없습니다.',
  INVALID_PROPERTY_PATH: '올바르지 않은 속성 경로입니다.',
  BLOCK_PROPERTY_UPDATE_FAILED: '블럭 속성 업데이트에 실패했습니다.',
};
