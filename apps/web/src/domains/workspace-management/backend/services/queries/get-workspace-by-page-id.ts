// apps/web/src/domains/workspace-management/backend/services/queries/get-workspace-by-page-id.ts

import { PageRepository } from '../../repositories/interfaces/page.repository.interface';
import { WorkspaceRepository } from '../../repositories/interfaces/workspace.repository.interface';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getWorkspaceByPageId(
  pageId: string,
  pageRepository: PageRepository,
  workspaceRepository: WorkspaceRepository
): Promise<
  Result<
    {
      workspaceId: string;
      workspaceName: string;
      organizationId: string;
    },
    WorkspaceManagementError
  >
> {
  try {
    const page = await pageRepository.findById(new PageId(pageId));

    if (!page) {
      return Result.error(
        new WorkspaceManagementError('PAGE_NOT_FOUND', 'Page not found')
      );
    }

    const workspace = await workspaceRepository.findById(
      page.workspaceId
    );

    if (!workspace) {
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_NOT_FOUND',
          'Workspace not found'
        )
      );
    }

    return Result.success({
      workspaceId: workspace.workspaceId.value,
      workspaceName: workspace.name,
      organizationId: workspace.organizationId.value,
    });
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get workspace by page id',
        { error }
      )
    );
  }
}
