'use client';

import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDetailPopoverContext } from '../core/context';
import { ComponentProps, PropsWithChildren } from 'react';

export function ActionWrapper({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof Box>>) {
  return (
    <Box className="space-y-1" {...props}>
      {children}
    </Box>
  );
}

export function ActionButtons() {
  const { handleDuplicate, handleDelete } = useDetailPopoverContext();

  return (
    <ActionWrapper>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDuplicate}
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
        onClick={handleDelete}
        className={cn(
          'w-full flex items-center justify-start h-7 px-2 text-xs text-destructive hover:text-destructive has-[>svg]:px-2',
          'hover:bg-destructive/10'
        )}
      >
        <Trash2 className="h-2.5 w-2.5" />
        Delete
      </Button>
    </ActionWrapper>
  );
}
