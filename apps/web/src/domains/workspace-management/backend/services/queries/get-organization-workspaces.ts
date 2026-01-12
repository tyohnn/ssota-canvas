// apps/web/src/domains/workspace-management/backend/services/queries/get-organization-workspaces.ts

import { WorkspaceRepository } from '../../repositories/interfaces/workspace.repository.interface';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getOrganizationWorkspaces(
  organizationId: OrganizationId,
  workspaceRepository: WorkspaceRepository
): Promise<
  Result<
    Array<{
      id: string;
      name: string;
      isDefault: boolean;
    }>,
    WorkspaceManagementError
  >
> {
  try {
    const workspaces =
      await workspaceRepository.findByOrganizationId(organizationId);

    const workspaceList = workspaces.map(ws => ({
      id: ws.workspaceId.value,
      name: ws.name,
      isDefault: ws.isDefault,
    }));

    return Result.success(workspaceList);
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get organization workspaces',
        { error }
      )
    );
  }
}
