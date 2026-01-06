import { forwardRef } from 'react';

import { AlignJustify } from 'lucide-react';

import {
  ToolbarIconButton,
  type ToolbarIconButtonProps,
} from '@/components/ssota-ui/toolbar-icon-button';

/**
 * Trigger Button Component
 *
 * Presentational component: Renders based on props only
 * - No Context dependencies
 * - Can be tested independently in Storybook
 */
export interface TriggerButtonProps extends Partial<
  Omit<ToolbarIconButtonProps, 'icon' | 'tooltip'>
> {}

export const TriggerButton = forwardRef<HTMLButtonElement, TriggerButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <ToolbarIconButton
        ref={ref}
        icon={<AlignJustify className="h-3 w-3" />}
        tooltip="Arrange"
        className={className}
        tooltipSide="top"
        {...props}
      />
    );
  }
);

TriggerButton.displayName = 'TriggerButton';
