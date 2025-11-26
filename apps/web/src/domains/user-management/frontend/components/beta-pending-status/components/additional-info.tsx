/**
 * Additional Info Component
 */

'use client';

import { Box } from '@/components/ui/box';

export interface AdditionalInfoProps {
  message?: string;
  className?: string;
}

/**
 * Additional Info
 *
 * Displays additional information
 */
export function AdditionalInfo({
  message = 'After approval, log in again to access all features.',
  className,
}: AdditionalInfoProps) {
  return (
    <Box className={className || 'space-y-2 text-center'}>
      <p className="text-sm text-gray-600">{message}</p>
    </Box>
  );
}
