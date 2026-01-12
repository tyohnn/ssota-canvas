// apps/web/src/domains/workspace-management/backend/services/queries/get-workspaces-for-user.ts

import { WorkspaceRepository } from '../../repositories/interfaces/workspace.repository.interface';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getWorkspacesForUser(
  userId: string,
  workspaceRepository: WorkspaceRepository
): Promise<
  Result<
    Array<{
      id: string;
      name: string;
      icon?: string;
      organizationName?: string;
    }>,
    WorkspaceManagementError
  >
> {
  try {
    const workspaces = await workspaceRepository.findByUserId(new UserId(userId));

    const result = workspaces.map(ws => ({
      id: ws.workspaceId.value,
      name: ws.name,
      icon: ws.icon ?? undefined,
      organizationName: ws.organizationName,
    }));

    return Result.success(result);
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get workspaces for user',
        { error }
      )
    );
  }
}
