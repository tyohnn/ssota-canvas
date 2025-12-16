'use client';

import { Button } from '@/components/ui/button';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Form Actions (Presentational)
 *
 * Cancel and Save buttons
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (callbacks, state)
 * - Storybook testable
 */

interface FormActionsProps {
  onCancel: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
}

export function FormActions({
  onCancel,
  isDirty,
  isSubmitting,
}: FormActionsProps) {
  return (
    <Box className="flex gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </Box>
  );
}
