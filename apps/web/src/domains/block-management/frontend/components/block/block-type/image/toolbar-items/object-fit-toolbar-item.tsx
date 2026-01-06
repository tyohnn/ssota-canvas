'use client';

import { useCallback, useState } from 'react';

import { Crop, Maximize, ScanEye } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';
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

import type { ObjectFit } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { cn } from '@/lib/utils';

import { useImageToolbarContext } from './core/image-toolbar.context';

const OBJECT_FIT_OPTIONS: Array<{
  value: ObjectFit;
  label: string;
  icon: any;
}> = [
  { value: 'contain', label: 'Contain', icon: ScanEye },
  { value: 'cover', label: 'Cover', icon: Crop },
  { value: 'fill', label: 'Fill', icon: Maximize },
];

/**
 * 맞춤 방식 미리보기 렌더링
 */
function renderPreview(value: ObjectFit, size: number = 16) {
  const option = OBJECT_FIT_OPTIONS.find(opt => opt.value === value);
  const Icon = option?.icon || ScanEye;
  return <Icon size={size} />;
}

/**
 * Object Fit Toolbar Item Component
 *
 * Context에서 필요한 데이터 가져오기 (Props 없음)
 */
export function ObjectFitToolbarItem() {
  const { imageProperties, disabled, updateProperty } =
    useImageToolbarContext();
  const currentValue = imageProperties.objectFit as ObjectFit;

  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback(
    async (value: ObjectFit) => {
      await updateProperty('objectFit', value);
    },
    [updateProperty]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={isOpen ? 'secondary' : 'ghost'}
              size="sm"
              disabled={disabled}
            >
              {renderPreview(currentValue, 14)}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>Object fit</p>
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
