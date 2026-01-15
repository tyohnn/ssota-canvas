/**
 * Generate Image Trigger Component
 */

'use client';

import React from 'react';
import { Wand2, LucideIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useGenerateImageActionContext } from '../generate-image-action.context';

/**
 * Trigger Props
 */
export interface TriggerProps {
  /** 아이콘 컴포넌트 */
  icon?: LucideIcon;

  /** 툴팁 텍스트 */
  tooltip?: string;
}

/**
 * Generate Image Trigger
 */
export function Trigger({
  icon: Icon = Wand2,
  tooltip = 'Generate image',
}: TriggerProps): React.ReactElement {
  const { open, setOpen } = useGenerateImageActionContext();

  // open 상태에 따라 variant 자동 설정
  const buttonVariant = open ? 'secondary' : 'ghost';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={buttonVariant} size="sm" onClick={() => setOpen(true)}>
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
