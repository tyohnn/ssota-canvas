'use client';

import { useCallback } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
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
        <Button
          onClick={handleToggle}
          variant={currentValue ? 'secondary' : 'ghost'}
          size="sm"
          disabled={disabled}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>{currentValue ? 'Hide caption' : 'Show caption'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
