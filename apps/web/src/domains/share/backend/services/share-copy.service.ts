// apps/web/src/domains/share/backend/services/share-copy.service.ts

import {
  CopyPublishedPageRequest,
  CopyResult,
  WorkspaceSelectionView,
} from '../../shared/dtos';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { WorkspaceManagementAcl } from './workspace-management.acl';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';
import { PageCopyService } from '@/domains/workspace-management/backend/services/page-copy.service';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';

export class ShareCopyService {
  constructor(
    private readonly publishedPageRepository: PublishedPageRepository,
    private readonly workspaceManagementAcl: WorkspaceManagementAcl
  ) { }

  async getWorkspaceSelection(userId: string): Promise<WorkspaceSelectionView> {
    // Authentication is handled by the action layer
    const workspaces = await this.workspaceManagementAcl.getWorkspacesForUser(
      userId
    );

    return { workspaces };
  }

  async copyPublishedPage(
    userId: string,
    request: CopyPublishedPageRequest
  ): Promise<CopyResult> {
    // Authentication is handled by the action layer
    const publishToken = new PublishToken(request.publishToken);
    const publishedPage = await this.publishedPageRepository.findByToken(
      publishToken
    );

    if (!publishedPage) {
      throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
    }

    try {
      // Use PageCopyService from Workspace domain
      const pageCopyService = new PageCopyService(new DrizzlePageRepository());
      const copyResult = await pageCopyService.copyPageToWorkspace(
        publishedPage.pageId,
        request.targetWorkspaceId,
        userId
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
}
