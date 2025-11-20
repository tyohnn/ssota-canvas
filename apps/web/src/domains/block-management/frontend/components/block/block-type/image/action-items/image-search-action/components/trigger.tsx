/**
 * Image Search Trigger Component
 */

'use client';

import React, { useEffect } from 'react';
import { Search, LucideIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useImageSearchActionContext } from '../image-search-action.context';
import type { SearchType } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Trigger Props
 */
export interface TriggerProps {
  /** 기본 검색 타입 (Popover 열릴 때 자동 설정) */
  defaultSearchType?: SearchType;

  /** 아이콘 컴포넌트 */
  icon?: LucideIcon;

  /** 툴팁 텍스트 */
  tooltip?: string;
}

/**
 * Image Search Trigger
 */
export function Trigger({
  defaultSearchType = 'combined',
  icon: Icon = Search,
  tooltip = 'Search images',
}: TriggerProps): React.ReactElement {
  const { open, setOpen, setSearchType } = useImageSearchActionContext();

  // Dialog 열릴 때 searchType 자동 설정
  useEffect(() => {
    if (open && defaultSearchType) {
      setSearchType(defaultSearchType);
    }
  }, [open, defaultSearchType, setSearchType]);

  // open 상태에 따라 variant 자동 설정
  const buttonVariant = open ? 'secondary' : 'ghost';

  const handleClick = () => {
    setSearchType(defaultSearchType);
    setOpen(true);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={buttonVariant} size="sm" onClick={handleClick}>
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
