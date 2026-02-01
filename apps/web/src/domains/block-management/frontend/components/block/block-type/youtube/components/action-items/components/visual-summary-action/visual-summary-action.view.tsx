/**
 * Visual Summary Action View
 *
 * Presentational component for Visual Summary Action
 */

'use client';

import React from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import { Box } from '@/components/ui/box';

export interface VisualSummaryActionViewProps {
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  /** Popover content - e.g. TemplateSelectorContent or "Extract summary first" message */
  popoverContent: React.ReactNode;
}

export function VisualSummaryActionView({
  icon,
  tooltip,
  disabled = false,
  isPopoverOpen,
  onPopoverOpenChange,
  popoverContent,
}: VisualSummaryActionViewProps) {
  return (
    <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <Box>
          <ToolbarIconButton
            icon={icon}
            tooltip={tooltip}
            tooltipSide="top"
            tooltipOffset={5}
            aria-label="Generate Visual Summary"
            disabled={disabled}
          />
        </Box>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[300px] p-2"
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}
