/**
 * Empty State Component
 */

'use client';

import React from 'react';
import { ImageIcon } from 'lucide-react';
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
        'flex flex-col items-center justify-center flex-1 min-h-0 text-center p-8',
        className
      )}
    >
      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">
        No images generated yet.
        <br />
        Enter a prompt and click the generate button.
      </p>
    </Box>
  );
}
