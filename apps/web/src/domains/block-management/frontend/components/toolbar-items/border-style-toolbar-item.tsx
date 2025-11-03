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
import type { BorderStyle } from '../../../shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-react';

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
        <TooltipContent side="bottom">
          <p>테두리 스타일</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          {BORDER_STYLE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={e => {
                e.stopPropagation();
                handleBorderStyleSelect(option.value);
              }}
              onMouseDown={e => e.stopPropagation()}
              className={cn(
                'px-3 py-2 flex items-center gap-2 rounded transition hover:bg-black/5 text-sm',
                {
                  'bg-black/10': currentBorderStyle === option.value,
                }
              )}
              title={option.label}
              aria-label={option.label}
            >
              <div
                className={cn(
                  'w-12 h-0 border-t-2 border-gray-700',
                  option.preview
                )}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
