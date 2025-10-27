'use client';

import { useCallback } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { TextAlign } from '../../../shared/types/block-properties.types';

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

  const CurrentIcon =
    ALIGNMENT_OPTIONS.find(option => option.align === currentAlign)?.icon ||
    AlignCenter;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          title="Text Alignment"
          disabled={disabled}
        >
          <CurrentIcon className="h-4 w-4" />
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
          {ALIGNMENT_OPTIONS.map(({ align, icon: Icon, title }) => (
            <button
              key={align}
              onClick={e => {
                e.stopPropagation();
                handleAlignSelect(align);
              }}
              onMouseDown={e => e.stopPropagation()}
              className={`h-8 w-8 rounded flex items-center justify-center ring-1 ring-black/10 transition hover:scale-110 ${
                currentAlign === align
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              title={title}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
