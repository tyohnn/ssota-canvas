'use client';

import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Footer section with Cancel and Create buttons (Presentational)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface CreateWorkspaceDialogFooterProps {
  cancelText?: string;
  submitText?: string;
  loadingText?: string;
  className?: string;
  isLoading: boolean;
  handleCloseDialog: () => void;
}

export function CreateWorkspaceDialogFooter({
  cancelText = 'Cancel',
  submitText = 'Create',
  loadingText = 'Creating...',
  className,
  isLoading,
  handleCloseDialog,
}: CreateWorkspaceDialogFooterProps) {
  return (
    <DialogFooter className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={handleCloseDialog}
        disabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? loadingText : submitText}
      </Button>
    </DialogFooter>
  );
}
