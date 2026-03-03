'use client';

import { DetailPopoverTriggerView } from './components/detail-popover-trigger.view';

export interface DetailPopoverTriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DetailPopoverTriggerView>,
    'children'
  > {
  children: React.ReactNode;
}

/**
 * Trigger button for property detail popover.
 * No business logic - pure view with open/onOpenChange.
 */
export function DetailPopoverTrigger({
  children,
  open,
  className,
  ...props
}: DetailPopoverTriggerProps): React.JSX.Element {
  return (
    <DetailPopoverTriggerView open={open} className={className} {...props}>
      {children}
    </DetailPopoverTriggerView>
  );
}
