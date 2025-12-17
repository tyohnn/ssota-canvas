'use client';

import { InviteMemberDialog } from '@/domains/workspace-management/frontend/components/sidebar/components/workspace-item/components/invite-member-dialog';

/**
 * Invite Dialog Wrapper (Presentational)
 *
 * Wraps InviteMemberDialog and handles success callback
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (no local Context)
 */

interface InviteDialogWrapperProps {
  workspaceId: string;
  workspaceName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess: () => void;
}

export function InviteDialogWrapper({
  workspaceId,
  workspaceName,
  isOpen,
  onOpenChange,
  onInviteSuccess,
}: InviteDialogWrapperProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    // When dialog closes after successful invite, refresh member list
    if (!open) {
      onInviteSuccess();
    }
  };

  return (
    <InviteMemberDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
    />
  );
}
