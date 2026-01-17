// apps/web/src/domains/share/backend/services/copy-published-page.ts

import {
  CopyPublishedPageRequest,
  CopyResultDTO,
} from '../../shared/dtos';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';
import { copyPageToWorkspace } from '@/domains/workspace-management/backend/services/copy-page.service';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

export async function copyPublishedPage(
  userId: string,
  request: CopyPublishedPageRequest,
  publishedPageRepository: PublishedPageRepository
): Promise<CopyResultDTO> {
  const publishToken = new PublishToken(request.publishToken);
  const publishedPage = await publishedPageRepository.findByToken(
    publishToken
  );

  if (!publishedPage) {
    throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
  }

  try {
    // Use the functional copy service from Workspace domain
    const copyResult = await copyPageToWorkspace(
      publishedPage.pageId,
      request.targetWorkspaceId,
      userId,
      new DrizzlePageRepository()
    );

    if (!copyResult.success) {
      return {
        copiedPageId: '',
        targetWorkspaceId: request.targetWorkspaceId,
        status: 'failed',
        errorMessage: copyResult.error,
      };
    }

    return {
      copiedPageId: copyResult.data,
      targetWorkspaceId: request.targetWorkspaceId,
      status: 'completed',
    };
  } catch (error) {
    return {
      copiedPageId: '',
      targetWorkspaceId: request.targetWorkspaceId,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to copy page',
    };
  }
}
