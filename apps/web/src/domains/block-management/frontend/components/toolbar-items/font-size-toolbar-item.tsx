'use client';

import { useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { ALargeSmall } from 'lucide-react';
import { FontSize } from '../../../shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';

interface FontSizeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentFontSize: FontSize;
  disabled?: boolean;
  onFontSizeChange?: (fontSize: FontSize) => Promise<void>;
}

const FONT_SIZE_OPTIONS = [
  { value: FontSize.SMALL, label: 'S', displayLabel: 'Small' },
  { value: FontSize.MEDIUM, label: 'M', displayLabel: 'Medium' },
  { value: FontSize.LARGE, label: 'L', displayLabel: 'Large' },
  { value: FontSize.XLARGE, label: 'XL', displayLabel: 'Extra Large' },
];

export function FontSizeToolbarItem({
  blockId,
  blockMountId,
  currentFontSize,
  disabled = false,
  onFontSizeChange,
}: FontSizeToolbarItemProps) {
  const handleFontSizeSelect = useCallback(
    async (fontSize: FontSize) => {
      if (onFontSizeChange) {
        await onFontSizeChange(fontSize);
      }
    },
    [onFontSizeChange]
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseDown={e => e.stopPropagation()}
              disabled={disabled}
            >
              <ALargeSmall className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>글자 크기</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="flex gap-1.5">
          {FONT_SIZE_OPTIONS.map(option => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleFontSizeSelect(option.value);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className={cn(
                    'h-7 w-7 flex items-center justify-center font-medium rounded text-sm transition hover:scale-110',
                    {
                      'ring-1 ring-black/10': currentFontSize !== option.value,
                      'ring-2 ring-blue-400': currentFontSize === option.value,
                    }
                  )}
                  aria-label={option.displayLabel}
                >
                  {option.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                <p>{option.displayLabel}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
