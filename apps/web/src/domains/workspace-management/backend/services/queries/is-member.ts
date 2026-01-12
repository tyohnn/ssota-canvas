// apps/web/src/domains/workspace-management/backend/services/queries/is-member.ts

import { WorkspaceMemberRepository } from '../../repositories/interfaces/workspace-member.repository.interface';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function isMember(
  workspaceId: WorkspaceId,
  userId: string,
  workspaceMemberRepository: WorkspaceMemberRepository
): Promise<Result<boolean, WorkspaceManagementError>> {
  try {
    const isMember = await workspaceMemberRepository.isMember(
      workspaceId,
      userId
    );
    return Result.success(isMember);
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to check workspace membership',
        { error }
      )
    );
  }
}
