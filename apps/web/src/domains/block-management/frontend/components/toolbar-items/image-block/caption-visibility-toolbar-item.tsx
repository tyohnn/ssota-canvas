'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface CaptionVisibilityToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: boolean;
  disabled?: boolean;
  onValueChange?: (value: boolean) => Promise<void>;
}

export function CaptionVisibilityToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  onValueChange,
}: CaptionVisibilityToolbarItemProps) {
  const handleToggle = useCallback(async () => {
    if (onValueChange) {
      await onValueChange(!currentValue);
    }
  }, [currentValue, onValueChange]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center p-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            currentValue
              ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              : 'hover:bg-black/5'
          )}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleToggle}
          disabled={disabled}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>{currentValue ? '캡션 숨기기' : '캡션 보기'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
