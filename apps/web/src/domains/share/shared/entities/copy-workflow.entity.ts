// apps/web/src/domains/share/shared/entities/copy-workflow.entity.ts

import { ShareManagementError } from '../errors/share-management.error';
import { CopyWorkflowId, WorkflowStatus, WorkspaceId, UserId } from '../types';
import { PublishToken } from '../value-objects/publish-token.vo';

export class CopyWorkflow {
  constructor(
    public readonly id: CopyWorkflowId,
    public publishToken: PublishToken,
    public status: WorkflowStatus,
    public requesterId?: UserId,
    public targetWorkspaceId?: WorkspaceId,
    public failureReason?: string
  ) {}

  markWaitingLogin(): void {
    this.status = 'waiting_login';
  }

  selectWorkspace(workspaceId: WorkspaceId): void {
    if (this.status !== 'selecting_workspace') {
      throw new ShareManagementError('INVALID_WORKFLOW_STATE', 'Invalid workflow state');
    }
    this.targetWorkspaceId = workspaceId;
  }

  markCopying(): void {
    this.status = 'copying';
  }

  markCompleted(): void {
    this.status = 'completed';
  }

  markFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
  }
}
