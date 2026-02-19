/**
 * Shared empty state for link block editor tab sections.
 * Used when properties[section] has no data yet.
 */

'use client';

import { Info } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';

export interface TabEmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULT_MESSAGE = 'No data yet. Run the tool to generate.';

export function TabEmptyState({
  message = DEFAULT_MESSAGE,
  actionLabel,
  onAction,
}: TabEmptyStateProps) {
  return (
    <Box className="px-6 py-6">
      <Box className="bg-muted border border-border rounded-lg px-4 py-6">
        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Info aria-hidden className="shrink-0 opacity-60" size={16} />
          {message}
        </p>
        {actionLabel && (
          <Box className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={onAction ?? (() => {})}
            >
              {actionLabel}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
