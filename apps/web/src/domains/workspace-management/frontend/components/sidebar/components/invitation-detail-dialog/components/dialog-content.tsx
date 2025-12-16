'use client';

import { DialogContent } from '@/components/ui/dialog';
import { InvitationDetailDialogHeader } from './dialog-header';
import { InvitationInfo } from './invitation-info';
import { InvitationDetailDialogFooter } from './dialog-footer';
import type { InvitationDetailDialogContextValue } from '../core/types';

/**
 * Main content of InvitationDetailDialog (Presentational)
 *
 * Combines:
 * - Header
 * - Invitation info
 * - Footer (Accept/Reject/Close)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InvitationDetailDialogContentProps
  extends InvitationDetailDialogContextValue {
  className?: string;
  headerTitle?: string;
}

export function InvitationDetailDialogContent({
  className = 'sm:max-w-[500px] rounded-md',
  headerTitle,
  ...dialogState
}: InvitationDetailDialogContentProps) {
  return (
    <DialogContent className={className}>
      <InvitationDetailDialogHeader
        title={headerTitle}
        status={dialogState.status}
      />

      <InvitationInfo
        invitation={dialogState.invitation}
        status={dialogState.status}
      />

      <InvitationDetailDialogFooter
        status={dialogState.status}
        isLoading={dialogState.isLoading}
        handleAccept={dialogState.handleAccept}
        handleReject={dialogState.handleReject}
        handleClose={dialogState.handleClose}
      />
    </DialogContent>
  );
}
