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
import { cn } from '@/lib/utils';
import type { ObjectFit } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { ScanEye, Crop, Maximize } from 'lucide-react';

interface ObjectFitToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: ObjectFit;
  disabled?: boolean;
  onValueChange?: (value: ObjectFit) => Promise<void>;
}

const OBJECT_FIT_OPTIONS: Array<{
  value: ObjectFit;
  label: string;
  icon: any;
}> = [
  { value: 'contain', label: '전체 표시', icon: ScanEye },
  { value: 'cover', label: '채우기', icon: Crop },
  { value: 'fill', label: '늘리기', icon: Maximize },
];

/**
 * 맞춤 방식 미리보기 렌더링
 */
function renderPreview(value: ObjectFit, size: number = 16) {
  const option = OBJECT_FIT_OPTIONS.find(opt => opt.value === value);
  const Icon = option?.icon || ScanEye;
  return <Icon size={size} />;
}

export function ObjectFitToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  onValueChange,
}: ObjectFitToolbarItemProps) {
  const handleSelect = useCallback(
    async (value: ObjectFit) => {
      if (onValueChange) {
        await onValueChange(value);
      }
    },
    [onValueChange]
  );

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
              {renderPreview(currentValue, 16)}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>맞춤 방식</p>
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
          {OBJECT_FIT_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    className={cn(
                      'h-7 w-7 flex items-center justify-center rounded transition hover:scale-110',
                      {
                        'ring-1 ring-black/10': currentValue !== option.value,
                        'ring-2 ring-blue-400': currentValue === option.value,
                      }
                    )}
                    aria-label={option.label}
                  >
                    <Icon size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                  <p>{option.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
