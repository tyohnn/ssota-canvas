'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Box } from '@workspace/ui/components/ui/box';
import { Copy, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

export interface PropertyDetailActionButtonsViewProps {
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PropertyDetailActionButtonsView({
  onDuplicate,
  onDelete,
}: PropertyDetailActionButtonsViewProps): React.JSX.Element {
  return (
    <Box className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void onDuplicate()}
        className={cn(
          'w-full flex items-center justify-start h-7 px-2 text-xs has-[>svg]:px-2',
          'hover:bg-accent/30'
        )}
      >
        <Copy className="h-2.5 w-2.5" />
        Duplicate
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void onDelete()}
        className={cn(
          'w-full flex items-center justify-start h-7 px-2 text-xs text-destructive hover:text-destructive has-[>svg]:px-2',
          'hover:bg-destructive/10'
        )}
      >
        <Trash2 className="h-2.5 w-2.5" />
        Delete
      </Button>
    </Box>
  );
}
