/**
 * Mock Visual Summary Action View
 *
 * Structure 탭용 - PopoverContent에 overflow-visible 추가 (highlight glow 클리핑 방지)
 */

"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { ToolbarIconButton } from "@workspace/ui/components/ssota-ui/toolbar-icon-button";
import { Box } from "@/components/ui/box";

export interface MockVisualSummaryActionViewProps {
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  popoverContent: React.ReactNode;
}

export function MockVisualSummaryActionView({
  icon,
  tooltip,
  disabled = false,
  isPopoverOpen,
  onPopoverOpenChange,
  popoverContent,
}: MockVisualSummaryActionViewProps) {
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
        className="w-[300px] p-2 overflow-visible"
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}
