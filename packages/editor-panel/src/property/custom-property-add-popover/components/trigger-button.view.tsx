'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

export interface CustomPropertyAddTriggerButtonViewProps {
  title?: string;
  isOpen?: boolean;
  className?: string;
}

export function CustomPropertyAddTriggerButtonView({
  title = 'Add Property',
  isOpen = false,
  className,
}: CustomPropertyAddTriggerButtonViewProps): React.JSX.Element {
  return (
    <Box
      className={cn(
        'w-fit flex items-center justify-start text-xs px-2 py-1 gap-1 ml-1 rounded-md cursor-pointer transition-colors',
        isOpen
          ? 'bg-accent/50 text-foreground dark:bg-accent/50'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50',
        className
      )}
    >
      <Plus className="w-3 h-3" />
      {title}
    </Box>
  );
}
