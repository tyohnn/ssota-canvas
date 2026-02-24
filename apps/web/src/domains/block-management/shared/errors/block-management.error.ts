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
  | 'BLOCK_PROPERTY_UPDATE_FAILED'
  | 'CONTENT_VERSION_MISMATCH';

// User-facing error messages (English)
export const BLOCK_MANAGEMENT_ERROR_MESSAGES: Record<
  BlockManagementErrorCode,
  string
> = {
  INVALID_BLOCK_ID: 'Invalid block ID.',
  INVALID_BLOCK_TYPE: 'Invalid block type.',
  INVALID_WORKSPACE_ID: 'Invalid workspace ID.',
  INVALID_METADATA_SCHEMA: 'Invalid metadata schema.',
  BLOCK_NOT_FOUND: 'Block not found.',
  BLOCK_ALREADY_EXISTS: 'Block already exists.',
  BLOCK_ALREADY_DELETED: 'Block is already deleted.',
  INVALID_OPERATION: 'Invalid operation.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions.',
  WORKSPACE_ACCESS_DENIED: 'Workspace access denied.',
  WORKSPACE_MISMATCH: 'Block does not belong to this workspace.',
  DATABASE_CONNECTION_FAILED: 'Database connection failed.',
  CUSTOM_PROPERTY_LIMIT_EXCEEDED: 'Custom property limit exceeded.',
  PROPERTY_NOT_FOUND: 'Property not found.',
  PROPERTY_TYPE_MISMATCH: 'Property type mismatch.',
  PROPERTY_CREATE_FAILED: 'Failed to create property.',
  PROPERTY_UPDATE_FAILED: 'Failed to update property.',
  PROPERTY_DELETE_FAILED: 'Failed to delete property.',
  PROPERTY_FETCH_FAILED: 'Failed to fetch property.',
  INVALID_PROPERTY_TYPE: 'Invalid property type.',
  INVALID_PROPERTY_OPTION: 'Invalid property option.',
  INVALID_PROPERTY_DEFINITION: 'Invalid property definition.',
  INVALID_PROPERTY_VALIDATION: 'Invalid property validation.',
  INVALID_MEDIA_URL: 'Invalid media URL.',
  MEDIA_FILE_TYPE_MISMATCH: 'Media file type mismatch.',
  MEDIA_FILE_SIZE_EXCEEDED: 'Media file size exceeded.',
  MEDIA_FILE_TYPE_NOT_SUPPORTED: 'Media file type not supported.',
  BLOCK_TOOL_EXECUTION_FAILED: 'Block tool execution failed.',
  TOOL_EXECUTION_FAILED: 'Tool execution failed.',
  TOOL_HISTORY_FETCH_FAILED: 'Failed to fetch tool history.',
  TOOL_EXECUTION_FETCH_FAILED: 'Failed to fetch tool execution result.',
  BLOCK_CREATION_FAILED: 'Failed to create block.',
  BLOCK_FETCH_FAILED: 'Failed to fetch block.',
  BLOCK_UPDATE_FAILED: 'Failed to update block.',
  BLOCK_TYPE_UPDATE_FAILED: 'Failed to update block type.',
  BLOCK_DELETE_FAILED: 'Failed to delete block.',
  BLOCK_RESTORE_FAILED: 'Failed to restore block.',
  BLOCKS_FETCH_FAILED: 'Failed to fetch blocks.',
  BLOCK_EXISTS_CHECK_FAILED: 'Failed to check block existence.',
  BLOCK_COUNT_FAILED: 'Failed to count blocks.',
  BLOCK_DUPLICATION_FAILED: 'Failed to duplicate block.',
  BLOCK_SAVE_FAILED: 'Failed to save block.',
  BLOCK_HARD_DELETE_FAILED: 'Failed to permanently delete block.',
  PROFILE_NOT_FOUND: 'User profile not found.',
  INVALID_PROPERTY_PATH: 'Invalid property path.',
  BLOCK_PROPERTY_UPDATE_FAILED: 'Failed to update block property.',
  CONTENT_VERSION_MISMATCH:
    'Content version mismatch. Please sync to the latest content.',
};
