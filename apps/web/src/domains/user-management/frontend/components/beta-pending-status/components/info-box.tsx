/**
 * Info Box Component
 */

'use client';

import { Mail } from 'lucide-react';
import { Box } from '@/components/ui/box';

export interface InfoBoxProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * Info Box
 *
 * Displays information box with icon
 */
export function InfoBox({
  title = 'Result Notification',
  message = 'We will send you the approval or rejection result via email. Please check your spam folder as well.',
  className,
}: InfoBoxProps) {
  return (
    <Box
      className={
        className || 'rounded-lg bg-blue-50 border border-blue-100 p-4'
      }
    >
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900">{title}</h4>
          <p className="text-xs text-blue-700 mt-1">{message}</p>
        </div>
      </div>
    </Box>
  );
}
