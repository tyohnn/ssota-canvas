'use client';

import { InviteMemberDialog } from '../../workspace-item/components/invite-member-dialog';
import type { CreatedWorkspaceInfo } from '../core/types';

/**
 * Wrapper for InviteMemberDialog (Presentational)
 *
 * Automatically opens after workspace creation
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InviteDialogWrapperProps {
  isInviteDialogOpen: boolean;
  setIsInviteDialogOpen: (open: boolean) => void;
  createdWorkspace: CreatedWorkspaceInfo | null;
}

export function InviteDialogWrapper({
  isInviteDialogOpen,
  setIsInviteDialogOpen,
  createdWorkspace,
}: InviteDialogWrapperProps) {
  if (!createdWorkspace) {
    return null;
  }

  return (
    <InviteMemberDialog
      open={isInviteDialogOpen}
      onOpenChange={setIsInviteDialogOpen}
      workspaceId={createdWorkspace.workspaceId}
      workspaceName={createdWorkspace.workspaceName}
      showSkipButton={true}
    />
  );
}
