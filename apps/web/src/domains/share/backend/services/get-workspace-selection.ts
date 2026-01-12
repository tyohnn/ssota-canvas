// apps/web/src/domains/share/backend/services/get-workspace-selection.ts

import { WorkspaceSelectionViewDTO } from '../../shared/dtos';
import { getWorkspacesForUser } from '@/domains/workspace-management/backend/services';
import { WorkspaceRepository } from '@/domains/workspace-management/backend/repositories/interfaces/workspace.repository.interface';

export async function getWorkspaceSelection(
  userId: string,
  workspaceRepository: WorkspaceRepository
): Promise<WorkspaceSelectionViewDTO> {
  const result = await getWorkspacesForUser(userId, workspaceRepository);

  if (result.isError()) {
    return { workspaces: [] };
  }

  return { workspaces: result.value };
}
