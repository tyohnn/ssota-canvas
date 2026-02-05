// apps/web/src/domains/user-management/errors/user-management.error.ts

export class UserManagementError extends Error {
  constructor(
    public readonly code: UserManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export type UserManagementErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_NAME_DUPLICATE'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_USER_ID'
  | 'INVALID_ORGANIZATION_ID'
  | 'INVALID_ORGANIZATION_TYPE'
  | 'SUPABASE_AUTH_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'PROFILE_UPDATE_FAILED'
  | 'ORGANIZATION_CREATION_FAILED'
  | 'ORGANIZATION_RETRIEVAL_FAILED'
  | 'DEFAULT_ORGANIZATION_NOT_FOUND'
  | 'DEFAULT_WORKSPACE_NOT_FOUND'
  | 'FIRST_PAGE_NOT_FOUND'
  | 'ORGANIZATION_PAYLOAD_FAILED'
  | 'DEFAULT_ORGANIZATION_FETCH_FAILED'
  | 'SETUP_STATUS_CHECK_FAILED';

// User-facing error message mapping
export const USER_MANAGEMENT_ERROR_MESSAGES: Record<
  UserManagementErrorCode,
  string
> = {
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'User already exists.',
  ORGANIZATION_NOT_FOUND: 'Organization not found.',
  ORGANIZATION_NAME_DUPLICATE: 'Organization name already exists.',
  INVALID_EMAIL_FORMAT: 'Invalid email format.',
  INVALID_USER_ID: 'Invalid user ID.',
  INVALID_ORGANIZATION_ID: 'Invalid organization ID.',
  INVALID_ORGANIZATION_TYPE: 'Invalid organization type.',
  SUPABASE_AUTH_FAILED: 'Authentication failed.',
  PROFILE_CREATION_FAILED: 'Failed to create profile.',
  PROFILE_UPDATE_FAILED: 'Failed to update profile.',
  ORGANIZATION_CREATION_FAILED: 'Failed to create organization.',
  ORGANIZATION_RETRIEVAL_FAILED: 'Failed to retrieve organization.',
  DEFAULT_ORGANIZATION_NOT_FOUND: 'Default organization not found.',
  DEFAULT_WORKSPACE_NOT_FOUND: 'Default workspace not found.',
  FIRST_PAGE_NOT_FOUND: 'First page of default workspace not found.',
  ORGANIZATION_PAYLOAD_FAILED: 'Failed to load organization data.',
  DEFAULT_ORGANIZATION_FETCH_FAILED: 'Failed to fetch default organization.',
  SETUP_STATUS_CHECK_FAILED: 'Failed to check setup status.',
};
