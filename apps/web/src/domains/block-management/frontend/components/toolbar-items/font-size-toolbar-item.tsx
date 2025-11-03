'use client';

import { useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { ALargeSmall } from 'lucide-react';
import { FontSize } from '../../../shared/value-objects/block-properties/common-types';

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
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          title="Font Size"
          disabled={disabled}
        >
          <ALargeSmall className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1">
          {FONT_SIZE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={e => {
                e.stopPropagation();
                handleFontSizeSelect(option.value);
              }}
              onMouseDown={e => e.stopPropagation()}
              className={`px-3 py-1 font-medium rounded text-sm transition-colors ${
                currentFontSize === option.value
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
              title={option.displayLabel}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
