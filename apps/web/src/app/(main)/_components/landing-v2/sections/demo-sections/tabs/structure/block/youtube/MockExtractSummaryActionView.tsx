/**
 * Mock Extract Summary Action View
 *
 * Structure 탭 전용 - StepHighlight 없음 (Extract Summary는 완료 상태)
 */

'use client';

import React from 'react';
import { Check } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Box } from '@/components/ui/box';

export interface MockExtractSummaryActionViewProps {
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  languages: { code: string; label: string }[];
  availableLanguages: string[];
  onLanguageSelect: (language: string) => void;
}

export function MockExtractSummaryActionView({
  isPopoverOpen,
  onPopoverOpenChange,
  icon,
  tooltip,
  disabled = false,
  languages,
  availableLanguages,
  onLanguageSelect,
}: MockExtractSummaryActionViewProps) {
  return (
    <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <ToolbarIconButton
          icon={icon}
          tooltip={tooltip}
          tooltipSide="top"
          tooltipOffset={5}
          disabled={disabled}
          onMouseDown={e => e.stopPropagation()}
          className="h-7 w-7 p-0"
          iconClassName="size-3.5"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Box className="space-y-1">
          <Box className="px-2 py-1.5 text-sm font-semibold">
            Select Language
          </Box>
          <Box className="max-h-[300px] overflow-y-auto">
            {languages.map(({ code, label }) => {
              const isAvailable = availableLanguages.includes(code);
              return (
                <Box
                  key={code}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onLanguageSelect(code)}
                >
                  <span>{label}</span>
                  {isAvailable && (
                    <Check className="ml-2 h-3 w-3 text-green-600" />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </PopoverContent>
    </Popover>
  );
}
