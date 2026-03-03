'use client';

import React from 'react';
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
} from '../utils/color-tokens';
import type { PropertyUIDefinition } from '../types';
import { cn } from '@workspace/ui/lib/utils';

export interface ColorPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
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

export function ColorProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: ColorPropertyProps) {
  // value를 직접 사용하여 항상 최신 값 반영
  const currentColor = (value as ColorToken) || ColorToken.GRAY;

  const handleColorSelect = (color: ColorToken) => {
    onChange(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-full flex items-center justify-start p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
          title={getColorLabel(currentColor)}
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
        align="start"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1.5">
          {COLOR_OPTIONS.map(colorOption => {
            const isSelected = currentColor === colorOption.value;
            return (
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
                    'ring-1 ring-black/10': !isSelected,
                    [getSelectedRingClasses(colorOption.value)]: isSelected,
                  }
                )}
                title={colorOption.label}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
