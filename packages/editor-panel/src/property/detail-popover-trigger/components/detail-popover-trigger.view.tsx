'use client';

import * as React from 'react';
import { PopoverTrigger } from '@workspace/ui/components/ui/popover';
import { cn } from '@workspace/ui/lib/utils';

const triggerVariantsBase = (state: 'closed' | 'open') =>
  state === 'open'
    ? 'bg-accent/50 text-foreground dark:bg-accent/50'
    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50';
export const triggerVariants = Object.assign(
  (state: 'closed' | 'open') => triggerVariantsBase(state),
  { base: 'flex h-fit w-[120px] items-center justify-start gap-1.5 px-1 py-0.5 cursor-pointer rounded-xs' }
);

export interface DetailPopoverTriggerViewProps
  extends React.PropsWithChildren,
    Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  open?: boolean;
}

export function DetailPopoverTriggerView({
  children,
  open,
  className,
  ...props
}: DetailPopoverTriggerViewProps): React.JSX.Element {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        className={cn(
          'flex h-fit w-[120px] items-center justify-start gap-1.5 px-1 py-0.5 cursor-pointer rounded-xs',
          triggerVariantsBase(open ? 'open' : 'closed'),
          className
        )}
        {...props}
      >
        {children}
      </button>
    </PopoverTrigger>
  );
}
