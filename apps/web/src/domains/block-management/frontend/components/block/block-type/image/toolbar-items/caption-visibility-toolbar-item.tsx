'use client';

import { useCallback } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';
import { useImageToolbarContext } from './core/image-toolbar.context';

/**
 * Caption Visibility Toolbar Item Component
 *
 * Context에서 필요한 데이터 가져오기 (Props 없음)
 */
export function CaptionVisibilityToolbarItem() {
  // ✅ Context에서 필요한 것만 가져오기
  const { imageProperties, disabled, updateProperty } = useImageToolbarContext();
  const currentValue = imageProperties.isCaptionVisible;

  const handleToggle = useCallback(async () => {
    await updateProperty('isCaptionVisible', !currentValue);
  }, [currentValue, updateProperty]);

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
