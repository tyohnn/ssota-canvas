'use client';

import * as React from 'react';
import { PopoverTrigger } from '@/components/ui/popover';
import { type PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const triggerVariants = cva(
  'flex h-fit w-[120px] items-center justify-start gap-1.5 px-1 py-0.5 cursor-pointer rounded-xs',
  {
    variants: {
      state: {
        closed:
          'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50',
        open: 'bg-accent/50 text-foreground dark:bg-accent/50',
      },
    },
    defaultVariants: {
      state: 'closed',
    },
  }
);

interface TriggerButtonProps
  extends PropsWithChildren,
    VariantProps<typeof triggerVariants>,
    React.ComponentPropsWithoutRef<'button'> {
  open?: boolean;
}

const TriggerButton = React.forwardRef<HTMLButtonElement, TriggerButtonProps>(
  function TriggerButton({ children, open, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          triggerVariants({ state: open ? 'open' : 'closed' }),
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export interface DetailPopoverTriggerProps
  extends PropsWithChildren,
    VariantProps<typeof triggerVariants>,
    React.ComponentPropsWithoutRef<'button'> {
  open?: boolean;
}

export const DetailPopoverTrigger = function DetailPopoverTrigger({
  children,
  open,
  className,
  ...props
}: DetailPopoverTriggerProps) {
  return (
    <PopoverTrigger asChild>
      <TriggerButton open={open} className={className} {...props}>
        {children}
      </TriggerButton>
    </PopoverTrigger>
  );
};
