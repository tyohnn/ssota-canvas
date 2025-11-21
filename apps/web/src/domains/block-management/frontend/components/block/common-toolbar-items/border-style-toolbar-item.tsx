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
import type { BorderStyle } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';

interface BorderStyleToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentBorderStyle: BorderStyle;
  disabled?: boolean;
  onBorderStyleChange?: (borderStyle: BorderStyle) => Promise<void>;
}

const BORDER_STYLE_OPTIONS: Array<{
  value: BorderStyle;
  label: string;
  preview: string;
}> = [
  {
    value: 'solid',
    label: '실선',
    preview: 'border-solid',
  },
  {
    value: 'dashed',
    label: '대시선',
    preview: 'border-dashed',
  },
  {
    value: 'dotted',
    label: '점선',
    preview: 'border-dotted',
  },
];

export function BorderStyleToolbarItem({
  blockId,
  blockMountId,
  currentBorderStyle,
  disabled = false,
  onBorderStyleChange,
}: BorderStyleToolbarItemProps) {
  const handleBorderStyleSelect = useCallback(
    async (borderStyle: BorderStyle) => {
      if (onBorderStyleChange) {
        await onBorderStyleChange(borderStyle);
      }
    },
    [onBorderStyleChange]
  );

  // 현재 선택된 스타일 찾기
  const currentOption =
    BORDER_STYLE_OPTIONS.find(opt => opt.value === currentBorderStyle) ||
    BORDER_STYLE_OPTIONS[0]!;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseDown={e => e.stopPropagation()}
              disabled={disabled}
            >
              {/* 현재 선택된 테두리 스타일 미리보기 */}
              <div
                className={cn(
                  'w-4 h-0 border-t-2 border-gray-700',
                  currentOption.preview
                )}
              />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>테두리 스타일</p>
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
          {BORDER_STYLE_OPTIONS.map(option => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleBorderStyleSelect(option.value);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className={cn(
                    'h-7 w-7 flex items-center justify-center rounded transition hover:scale-110',
                    {
                      'ring-1 ring-black/10':
                        currentBorderStyle !== option.value,
                      'ring-2 ring-blue-400':
                        currentBorderStyle === option.value,
                    }
                  )}
                  aria-label={option.label}
                >
                  <div
                    className={cn(
                      'w-4 h-0 border-t-2 border-gray-700',
                      option.preview
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                <p>{option.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
