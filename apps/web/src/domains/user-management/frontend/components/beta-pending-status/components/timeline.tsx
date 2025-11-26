/**
 * Timeline Component
 */

'use client';

import { Clock, Mail, CheckCircle2 } from 'lucide-react';
import { Box } from '@/components/ui/box';

export interface TimelineProps {
  className?: string;
}

/**
 * Timeline
 *
 * Displays application review timeline
 */
export function Timeline({ className }: TimelineProps) {
  return (
    <Box className={className || 'space-y-4'}>
      {/* Step 1: Submitted */}
      <Box className="flex gap-4">
        <Box className="flex flex-col items-center">
          <Box className="rounded-full bg-green-500 p-2">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </Box>
          <Box className="h-full w-0.5 bg-gray-200 mt-2" />
        </Box>
        <Box className="pb-4">
          <h3 className="font-medium text-sm">Application Submitted</h3>
          <p className="text-xs text-gray-500 mt-1">Just completed</p>
        </Box>
      </Box>

      {/* Step 2: Under Review */}
      <Box className="flex gap-4">
        <Box className="flex flex-col items-center">
          <Box className="rounded-full bg-blue-500 p-2 animate-pulse">
            <Clock className="h-4 w-4 text-white" />
          </Box>
          <div className="h-full w-0.5 bg-gray-200 mt-2" />
        </Box>
        <Box className="pb-4">
          <h3 className="font-medium text-sm">Under Review</h3>
          <p className="text-xs text-gray-500 mt-1">
            Expected 1-2 business days
          </p>
        </Box>
      </Box>

      {/* Step 3: Email Notification */}
      <Box className="flex gap-4">
        <Box className="flex flex-col items-center">
          <Box className="rounded-full bg-gray-200 p-2">
            <Mail className="h-4 w-4 text-gray-400" />
          </Box>
        </Box>
        <Box>
          <h3 className="font-medium text-sm text-gray-500">
            Email Notification
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            We will notify you via email
          </p>
        </Box>
      </Box>
    </Box>
  );
}
