'use client';

import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Invite Member Dialog Footer (Presentational)
 *
 * Displays action buttons (Cancel/Skip and Invite)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InviteMemberDialogFooterProps {
  showSkipButton: boolean;
  selectedMembersCount: number;
  isSubmitting: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InviteMemberDialogFooter({
  showSkipButton,
  selectedMembersCount,
  isSubmitting,
  isLoading,
  onSubmit,
  onCancel,
}: InviteMemberDialogFooterProps) {
  const isDisabled = isSubmitting || isLoading || selectedMembersCount === 0;

  return (
    <DialogFooter>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting || isLoading}
      >
        {showSkipButton ? 'Skip' : 'Cancel'}
      </Button>
      <Button onClick={onSubmit} disabled={isDisabled}>
        {isSubmitting
          ? 'Inviting...'
          : selectedMembersCount > 0
            ? `Invite ${selectedMembersCount} member${selectedMembersCount > 1 ? 's' : ''}`
            : 'Invite'}
      </Button>
    </DialogFooter>
  );
}
