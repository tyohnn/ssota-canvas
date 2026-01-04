// apps/web/src/domains/share/backend/services/share-copy.service.ts

import {
  CopyPublishedPageRequest,
  CopyResult,
  WorkspaceSelectionView,
} from '../../shared/dtos';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import { PublishedPageRepository } from '../repositories/published-page.repository';
import { CopyWorkflowRepository } from '../repositories/copy-workflow.repository';
import { AuthDomainAcl } from '../acl/auth-domain.acl';
import { WorkspaceManagementAcl } from '../acl/workspace-management.acl';
import { CopyWorkflow } from '../../shared/entities/copy-workflow.entity';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';

export class ShareCopyService {
  constructor(
    private readonly publishedPageRepository: PublishedPageRepository,
    private readonly copyWorkflowRepository: CopyWorkflowRepository,
    private readonly authDomainAcl: AuthDomainAcl,
    private readonly workspaceManagementAcl: WorkspaceManagementAcl
  ) {}

  async getWorkspaceSelection(userId: string): Promise<WorkspaceSelectionView> {
    const isMember = await this.authDomainAcl.isMember(userId);
    if (!isMember) {
      throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
    }

    const workspaces = await this.workspaceManagementAcl.getWorkspacesForUser(
      userId
    );

    return { workspaces };
  }

  async copyPublishedPage(
    userId: string,
    request: CopyPublishedPageRequest
  ): Promise<CopyResult> {
    const isMember = await this.authDomainAcl.isMember(userId);
    if (!isMember) {
      throw new ShareManagementError('LOGIN_REQUIRED', 'Login required');
    }

    const publishToken = new PublishToken(request.publishToken);
    const publishedPage = await this.publishedPageRepository.findByToken(
      publishToken
    );

    if (!publishedPage) {
      throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
    }

    const workflow = new CopyWorkflow(
      crypto.randomUUID(),
      publishToken,
      'copying',
      userId,
      request.targetWorkspaceId
    );

    await this.copyWorkflowRepository.save(workflow);

    try {
      const copiedPageId = await this.workspaceManagementAcl.copyPageToWorkspace(
        publishedPage.pageId,
        request.targetWorkspaceId,
        userId
      );

      workflow.markCompleted();
      await this.copyWorkflowRepository.save(workflow);

      return {
        copiedPageId,
        targetWorkspaceId: request.targetWorkspaceId,
        status: 'completed',
      };
    } catch (error) {
      workflow.markFailed('COPY_FAILED');
      await this.copyWorkflowRepository.save(workflow);

      return {
        copiedPageId: '',
        targetWorkspaceId: request.targetWorkspaceId,
        status: 'failed',
        errorMessage: 'Failed to copy page',
      };
    }
  }
}
