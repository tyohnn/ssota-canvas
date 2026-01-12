// apps/web/src/domains/workspace-management/backend/services/queries/get-page-info.ts

import { PageRepository } from '../../repositories/interfaces/page.repository.interface';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';
import { WorkspaceManagementError } from '../../../shared/errors/workspace-management.error';

export async function getPageInfo(
  pageId: string,
  pageRepository: PageRepository
): Promise<
  Result<
    {
      pageId: string;
      title: string;
      icon?: string;
      workspaceId?: string;
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

    return Result.success({
      pageId: page.pageId.value,
      title: page.title,
      icon: page.icon ?? undefined,
      workspaceId: page.workspaceId?.value,
    });
  } catch (error) {
    return Result.error(
      new WorkspaceManagementError(
        'WORKSPACE_RETRIEVAL_FAILED',
        'Failed to get page info',
        { error }
      )
    );
  }
}
