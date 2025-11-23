/**
 * Workspace Management Domain Events
 *
 * 과거형 사실을 표현하는 Domain Event들
 */

// Workspace Events
export interface WorkspaceCreatedEvent {
  type: 'WorkspaceCreated';
  workspaceId: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  occurredAt: Date;
}

export interface WorkspaceUpdatedEvent {
  type: 'WorkspaceUpdated';
  workspaceId: string;
  changes: {
    name?: string;
    description?: string;
    icon?: string;
  };
  occurredAt: Date;
}

export interface WorkspaceDeletedEvent {
  type: 'WorkspaceDeleted';
  workspaceId: string;
  occurredAt: Date;
}

export interface WorkspaceListLoadedEvent {
  type: 'WorkspaceListLoaded';
  organizationId: string;
  workspaceCount: number;
  occurredAt: Date;
}

export interface WorkspaceMembershipVerifiedEvent {
  type: 'WorkspaceMembershipVerified';
  workspaceId: string;
  userId: string;
  hasAccess: boolean;
  occurredAt: Date;
}

// Page Events
export interface PageCreatedEvent {
  type: 'PageCreated';
  pageId: string;
  workspaceId: string;
  parentId?: string;
  title: string;
  depth: number;
  order: number;
  occurredAt: Date;
}

export interface PageUpdatedEvent {
  type: 'PageUpdated';
  pageId: string;
  changes: {
    title?: string;
    icon?: string;
  };
  occurredAt: Date;
}

export interface PageMovedEvent {
  type: 'PageMoved';
  pageId: string;
  oldParentId?: string;
  newParentId?: string;
  oldDepth: number;
  newDepth: number;
  occurredAt: Date;
}

export interface PageDeletedEvent {
  type: 'PageDeleted';
  pageId: string;
  workspaceId: string;
  occurredAt: Date;
}

export interface PageDuplicatedEvent {
  type: 'PageDuplicated';
  originalPageId: string;
  newPageId: string;
  workspaceId: string;
  newTitle: string;
  occurredAt: Date;
}

export interface PageTreeLoadedEvent {
  type: 'PageTreeLoaded';
  workspaceId: string;
  pageCount: number;
  occurredAt: Date;
}

export interface PageAccessVerifiedEvent {
  type: 'PageAccessVerified';
  pageId: string;
  userId: string;
  occurredAt: Date;
}

export interface PageAccessDeniedEvent {
  type: 'PageAccessDenied';
  pageId: string;
  userId: string;
  reason: 'NOT_ORG_MEMBER' | 'NOT_WORKSPACE_MEMBER';
  occurredAt: Date;
}

// Workspace Invitation Events (Scenario 3)
export interface WorkspaceMemberInvitationCreatedEvent {
  type: 'WorkspaceMemberInvitationCreated';
  invitationId: string;
  workspaceId: string;
  invitedUserId: string;
  invitedBy: string;
  occurredAt: Date;
}

export interface WorkspaceInvitationAcceptedEvent {
  type: 'WorkspaceInvitationAccepted';
  invitationId: string;
  workspaceId: string;
  userId: string;
  occurredAt: Date;
}

export interface MemberAddedToWorkspaceEvent {
  type: 'MemberAddedToWorkspace';
  workspaceId: string;
  userId: string;
  occurredAt: Date;
}

export interface WorkspaceInvitationRejectedEvent {
  type: 'WorkspaceInvitationRejected';
  invitationId: string;
  userId: string;
  occurredAt: Date;
}

// Union type for all domain events
export type WorkspaceManagementDomainEvent =
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | WorkspaceListLoadedEvent
  | WorkspaceMembershipVerifiedEvent
  | PageCreatedEvent
  | PageUpdatedEvent
  | PageMovedEvent
  | PageDeletedEvent
  | PageDuplicatedEvent
  | PageTreeLoadedEvent
  | PageAccessVerifiedEvent
  | PageAccessDeniedEvent
  | WorkspaceMemberInvitationCreatedEvent
  | WorkspaceInvitationAcceptedEvent
  | MemberAddedToWorkspaceEvent
  | WorkspaceInvitationRejectedEvent;
