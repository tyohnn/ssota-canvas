'use client';

import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Footer section with action buttons (Presentational)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
import type { InvitationStatus } from '../core/types';

interface InvitationDetailDialogFooterProps {
  acceptText?: string;
  rejectText?: string;
  closeText?: string;
  processingText?: string;
  className?: string;
  status: InvitationStatus;
  isLoading: boolean;
  handleAccept: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleClose: () => void;
}

export function InvitationDetailDialogFooter({
  acceptText = 'Accept',
  rejectText = 'Reject',
  closeText = 'Close',
  processingText = 'Processing...',
  className,
  status,
  isLoading,
    handleAccept,
    handleReject,
    handleClose,
}: InvitationDetailDialogFooterProps) {
  return (
    <DialogFooter className={className}>
      {status === 'pending' ? (
        <>
          <Button variant="outline" onClick={handleReject} disabled={isLoading}>
            {rejectText}
          </Button>
          <Button onClick={handleAccept} disabled={isLoading}>
            {isLoading ? processingText : acceptText}
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={handleClose}>
          {closeText}
        </Button>
      )}
    </DialogFooter>
  );
}
