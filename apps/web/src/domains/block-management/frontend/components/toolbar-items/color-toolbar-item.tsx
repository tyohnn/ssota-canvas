'use client';

import { useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  ColorToken,
  getColorPreviewClass,
  getColorLabel,
  getSelectedRingClasses,
} from '../../../shared/types/style-tokens.types';
import { cn } from '@/lib/utils';

interface ColorToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentColor: ColorToken;
  disabled?: boolean;
  onColorChange?: (color: ColorToken) => Promise<void>;
}

const COLOR_OPTIONS = [
  // GRAY를 맨 앞에 배치
  {
    value: ColorToken.GRAY,
    label: getColorLabel(ColorToken.GRAY),
    previewClass: getColorPreviewClass(ColorToken.GRAY),
  },
  // 나머지 색상들
  ...Object.values(ColorToken)
    .filter(token => token !== ColorToken.GRAY)
    .map(token => ({
      value: token,
      label: getColorLabel(token),
      previewClass: getColorPreviewClass(token),
    })),
];

export function ColorToolbarItem({
  blockId,
  blockMountId,
  currentColor,
  disabled = false,
  onColorChange,
}: ColorToolbarItemProps) {
  const handleColorSelect = useCallback(
    async (color: ColorToken) => {
      if (onColorChange) {
        await onColorChange(color);
      }
    },
    [onColorChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          title="Text Color"
          disabled={disabled}
        >
          <div
            className={cn(
              'h-4 w-4 rounded ring-1 ring-black/10',
              getColorPreviewClass(currentColor)
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1.5">
          {COLOR_OPTIONS.map(colorOption => (
            <button
              key={colorOption.value}
              onClick={e => {
                e.stopPropagation();
                handleColorSelect(colorOption.value);
              }}
              onMouseDown={e => e.stopPropagation()}
              className={cn(
                'h-6 w-6 rounded transition hover:scale-110',
                colorOption.previewClass,
                {
                  'ring-1 ring-black/10': currentColor !== colorOption.value,
                  [getSelectedRingClasses(colorOption.value)]:
                    currentColor === colorOption.value,
                }
              )}
              title={colorOption.label}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
