/**
 * Sign Out Button Component
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useBetaPendingStatusContext } from '../core/context';

export interface SignOutButtonProps {
  text?: string;
  loadingText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

/**
 * Sign Out Button
 *
 * Sign-out button
 */
export function SignOutButton({
  text = 'Sign Out',
  loadingText = 'Signing out...',
  className,
  variant = 'outline',
}: SignOutButtonProps) {
  const { isSigningOut, handleSignOut } = useBetaPendingStatusContext();

  return (
    <Button
      variant={variant}
      className={className || 'w-full'}
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
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
