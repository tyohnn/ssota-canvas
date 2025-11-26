/**
 * Submit Button Component
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useBetaApplicationFormContext } from '../core/context';

export interface SubmitButtonProps {
  text?: string;
  loadingText?: string;
  className?: string;
}

/**
 * Submit Button
 *
 * Form submission button
 */
export function SubmitButton({
  text = 'Submit Application',
  loadingText = 'Submitting...',
  className,
}: SubmitButtonProps) {
  const { isSubmitting, isValid } = useBetaApplicationFormContext();

  return (
    <Button
      type="submit"
      className={className || 'w-full'}
      disabled={isSubmitting || !isValid}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}
