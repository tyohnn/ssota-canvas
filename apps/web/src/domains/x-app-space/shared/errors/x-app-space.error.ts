/**
 * X App Space Domain Errors
 */
export type XAppSpaceErrorCode =
  | 'INVALID_POST_ID'
  | 'POST_ID_NOT_FOUND'
  | 'POST_ID_ALREADY_EXISTS'
  | 'INVALID_POST_SLUG'
  | 'POST_QUERY_FAILED'
  | 'POST_CREATION_FAILED'
  | 'INVALID_X_USER_ID'
  | 'INVALID_PROFILE_ID'
  | 'PROFILE_QUERY_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'X_API_ERROR'
  | 'X_API_TOKEN_MISSING'
  | 'X_API_RATE_LIMIT_EXCEEDED'
  | 'X_API_UNAUTHORIZED'
  | 'X_API_FORBIDDEN'
  | 'X_API_NOT_FOUND'
  | 'X_API_BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

export class XAppSpaceError extends Error {
  constructor(
    public readonly code: XAppSpaceErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'XAppSpaceError';
  }
}
