/**
 * Empty State Component
 */

'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Empty State Props
 */
export interface EmptyStateProps {
  className?: string;
}

/**
 * Empty State Component
 */
export function EmptyState({ className }: EmptyStateProps): React.ReactElement {
  return (
    <Box
      className={cn(
        'flex flex-col items-center justify-center flex-1 min-h-0 text-center p-8 text-muted-foreground',
        className
      )}
    >
      <ImageOff className="h-10 w-10 mb-3" />
      <p className="text-sm font-medium">No results found</p>
      <p className="text-xs mt-1">Try different search terms</p>
    </Box>
  );
}
