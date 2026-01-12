// apps/web/src/domains/workspace-management/backend/services/queries/get-workspace-basic-info.ts

import { WorkspaceRepository } from '../../repositories/interfaces/workspace.repository.interface';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getWorkspaceBasicInfo(
  workspaceId: WorkspaceId,
  workspaceRepository: WorkspaceRepository
): Promise<
  Result<
    {
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      isDefault: boolean;
      organizationId: string;
    },
    WorkspaceManagementError
  >
> {
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

    return Result.success({
      id: workspace.workspaceId.value,
      name: workspace.name,
      description: workspace.description,
      icon: workspace.icon,
      isDefault: workspace.isDefault,
      organizationId: workspace.organizationId.value,
      organizationName: workspace.organizationName,
    });
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get workspace info',
        { error }
      )
    );
  }
}
