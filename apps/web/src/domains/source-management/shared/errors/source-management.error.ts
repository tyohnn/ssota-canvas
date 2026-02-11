export class SourceManagementError extends Error {
  constructor(
    public readonly code: SourceManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SourceManagementError';
  }
}

export type SourceManagementErrorCode =
  | 'INVALID_SOURCE_ID'
  | 'INVALID_SOURCE_TYPE'
  | 'INVALID_SOURCE_URL'
  | 'INVALID_ORG_ID'
  | 'INVALID_LANGUAGE_CODE'
  | 'SOURCE_NOT_FOUND'
  | 'DUPLICATE_SOURCE'
  | 'SOURCE_CREATION_FAILED'
  | 'SOURCE_UPDATE_FAILED'
  | 'SOURCE_SUMMARY_NOT_FOUND'
  | 'SOURCE_SUMMARY_CREATION_FAILED'
  | 'SOURCE_ACTION_TRANSACTION_CREATION_FAILED'
  | 'EXTRACT_TRANSCRIPT_FAILED';

export const SOURCE_MANAGEMENT_ERROR_MESSAGES: Record<
  SourceManagementErrorCode,
  string
> = {
  INVALID_SOURCE_ID: 'Invalid source ID.',
  INVALID_SOURCE_TYPE: 'Invalid source type.',
  INVALID_SOURCE_URL: 'Invalid source URL.',
  INVALID_ORG_ID: 'Invalid organization ID.',
  INVALID_LANGUAGE_CODE: 'Unsupported language code.',
  SOURCE_NOT_FOUND: 'Source not found.',
  DUPLICATE_SOURCE: 'Source already exists.',
  SOURCE_CREATION_FAILED: 'Failed to create source.',
  SOURCE_UPDATE_FAILED: 'Failed to update source.',
  SOURCE_SUMMARY_NOT_FOUND: 'Source summary not found.',
  SOURCE_SUMMARY_CREATION_FAILED: 'Failed to create source summary.',
  SOURCE_ACTION_TRANSACTION_CREATION_FAILED:
    'Failed to create source action transaction.',
  EXTRACT_TRANSCRIPT_FAILED: 'Failed to extract transcript from YouTube.',
};
