// apps/web/src/domains/workspace-management/backend/services/queries/get-workspace-name.ts

import { WorkspaceRepository } from '../../repositories/interfaces/workspace.repository.interface';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getWorkspaceName(
  workspaceId: WorkspaceId,
  workspaceRepository: WorkspaceRepository
): Promise<Result<string, WorkspaceManagementError>> {
  try {
    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_NOT_FOUND',
          'Workspace not found'
        )
      );
    }

    return Result.success(workspace.name);
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get workspace name',
        { error }
      )
    );
  }
}
