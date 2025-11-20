'use client';

import { useCallback } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
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
import { TextAlign } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';

interface TextAlignToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentAlign: TextAlign;
  disabled?: boolean;
  onAlignChange?: (align: TextAlign) => Promise<void>;
}

const ALIGNMENT_OPTIONS = [
  { align: TextAlign.LEFT, icon: AlignLeft, title: 'Align Left' },
  { align: TextAlign.CENTER, icon: AlignCenter, title: 'Align Center' },
  { align: TextAlign.RIGHT, icon: AlignRight, title: 'Align Right' },
];

export function TextAlignToolbarItem({
  blockId,
  blockMountId,
  currentAlign,
  disabled = false,
  onAlignChange,
}: TextAlignToolbarItemProps) {
  const handleAlignSelect = useCallback(
    async (align: TextAlign) => {
      if (onAlignChange) {
        await onAlignChange(align);
      }
    },
    [onAlignChange]
  );

  const currentOption =
    ALIGNMENT_OPTIONS.find(option => option.align === currentAlign) ||
    ALIGNMENT_OPTIONS[1]!;
  const CurrentIcon = currentOption.icon;

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
              <CurrentIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>텍스트 정렬</p>
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
          {ALIGNMENT_OPTIONS.map(({ align, icon: Icon, title }) => (
            <Tooltip key={align}>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleAlignSelect(align);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className={cn(
                    'h-7 w-7 rounded flex items-center justify-center transition hover:scale-110',
                    {
                      'ring-1 ring-black/10': currentAlign !== align,
                      'ring-2 ring-blue-400': currentAlign === align,
                    }
                  )}
                  aria-label={title}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                <p>{title}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
