import type { WorkspaceCrudService } from '@/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface';

/**
 * Context passed to InvitationAcceptedEvent.handle() to trigger add-to-default-workspace policy.
 * When provided, InvitationAcceptedEvent calls workspaceCrudService.addMemberToDefaultWorkspace.
 */
export interface InvitationAcceptedPolicyContext {
  workspaceCrudService: WorkspaceCrudService;
}
