/**
 * Status Header Component
 */

'use client';

import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/components/ui/card';
import { Clock } from 'lucide-react';
import { Box } from '@/components/ui/box';

export interface StatusHeaderProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Status Header
 *
 * Displays status header with icon
 */
export function StatusHeader({
  title = 'Beta Application Received',
  description = 'Under review. We will contact you soon!',
  className,
}: StatusHeaderProps) {
  return (
    <CardHeader className={className || 'text-center space-y-2'}>
      <Box className="flex justify-center mb-4">
        <Box className="rounded-full bg-blue-100 p-3">
          <Clock className="h-8 w-8 text-blue-600" />
        </Box>
      </Box>
      <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardHeader>
  );
}
