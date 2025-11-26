/**
 * Form Footer Component
 */

'use client';

import { CardFooter } from '@workspace/ui/components/ui/card';
import { SubmitButton } from './submit-button';

export interface FormFooterProps {
  submitText?: string;
  noticeText?: string;
  className?: string;
}

/**
 * Form Footer
 *
 * Contains submit button and privacy notice
 */
export function FormFooter({
  submitText,
  noticeText = 'Your information will only be used for beta participant selection.',
  className,
}: FormFooterProps) {
  return (
    <CardFooter className={className || 'flex flex-col gap-2'}>
      <SubmitButton text={submitText} />
      <p className="text-xs text-center text-gray-500">{noticeText}</p>
    </CardFooter>
  );
}
