/**
 * Status Footer Component
 */

'use client';

import { CardFooter } from '@workspace/ui/components/ui/card';
import { SignOutButton } from './sign-out-button';

export interface StatusFooterProps {
  contactText?: string;
  contactEmail?: string;
  className?: string;
}

/**
 * Status Footer
 *
 * Contains sign-out button and contact info
 */
export function StatusFooter({
  contactText = 'If you have any questions, please contact',
  contactEmail = 'support@ssota.io',
  className,
}: StatusFooterProps) {
  return (
    <CardFooter className={className || 'flex flex-col gap-2'}>
      <SignOutButton />
      <p className="text-xs text-center text-gray-500">
        {contactText} {contactEmail}
      </p>
    </CardFooter>
  );
}
