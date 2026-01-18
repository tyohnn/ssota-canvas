// apps/web/src/domains/share/shared/errors/share-management.error.ts

export class ShareManagementError extends Error {
  constructor(
    public readonly code: ShareManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ShareManagementError';
  }
}

export type ShareManagementErrorCode =
  | 'NOT_PAGE_OWNER'
  | 'ALREADY_PUBLISHED'
  | 'PAGE_NOT_PUBLISHED'
  | 'INVALID_PUBLISH_TOKEN'
  | 'INVALID_PUBLISH_LINK'
  | 'PUBLISH_LINK_NOT_FOUND'
  | 'LOGIN_REQUIRED'
  | 'WORKSPACE_FORBIDDEN'
  | 'COPY_FAILED'
  | 'INVALID_WORKFLOW_STATE'
  | 'INVALID_REQUEST'
  | 'GET_PUBLISHED_LINK_FAILED'
  | 'PUBLISH_PAGE_FAILED'
  | 'UNPUBLISH_PAGE_FAILED';

export const SHARE_MANAGEMENT_ERROR_MESSAGES: Record<
  ShareManagementErrorCode,
  string
> = {
  NOT_PAGE_OWNER: 'Only the page owner can publish this page.',
  ALREADY_PUBLISHED: 'This page is already published.',
  PAGE_NOT_PUBLISHED: 'Page is not published.',
  INVALID_PUBLISH_TOKEN: 'Invalid publish token.',
  INVALID_PUBLISH_LINK: 'Invalid publish link.',
  PUBLISH_LINK_NOT_FOUND: 'Publish link not found.',
  LOGIN_REQUIRED: 'Login required to continue.',
  WORKSPACE_FORBIDDEN: 'No permission for the selected workspace.',
  COPY_FAILED: 'Failed to copy page.',
  INVALID_WORKFLOW_STATE: 'Invalid workflow state.',
  INVALID_REQUEST: 'Invalid request.',
  GET_PUBLISHED_LINK_FAILED: 'Failed to get published link.',
  PUBLISH_PAGE_FAILED: 'Failed to publish page.',
  UNPUBLISH_PAGE_FAILED: 'Failed to unpublish page.',
};
