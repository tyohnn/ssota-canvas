'use client';

import { useCallback } from 'react';
import { Palette } from 'lucide-react';

interface RichStyleToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentRichStyle: boolean;
  disabled?: boolean;
  onRichStyleChange?: (richStyle: boolean) => Promise<void>;
}

export function RichStyleToolbarItem({
  blockId,
  blockMountId,
  currentRichStyle,
  disabled = false,
  onRichStyleChange,
}: RichStyleToolbarItemProps) {
  const handleToggle = useCallback(async () => {
    if (onRichStyleChange) {
      await onRichStyleChange(!currentRichStyle);
    }
  }, [currentRichStyle, onRichStyleChange]);

  return (
    <button
      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        currentRichStyle
          ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
          : 'hover:bg-black/5'
      }`}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        handleToggle();
      }}
      title={currentRichStyle ? 'Disable Rich Style' : 'Enable Rich Style'}
      disabled={disabled}
    >
      <Palette className="h-4 w-4" />
    </button>
  );
}
