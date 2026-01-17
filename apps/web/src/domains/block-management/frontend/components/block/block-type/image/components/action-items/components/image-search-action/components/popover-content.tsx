/**
 * Dialog Content Component
 *
 * Generate Image Action과 동일한 크기 적용
 */

'use client';

import React from 'react';
import {
  DialogPopup as RadixDialogContent,
  DialogTitle,
} from '@workspace/ui/components/coss-ui/dialog';
import { cn } from '@workspace/ui/lib/utils';
import { useImageSearchActionContext } from '../image-search-action.context';

/**
 * Dialog Content Props
 */
export interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog Content Wrapper
 */
export function PopoverContent({
  children,
  className,
}: PopoverContentProps): React.ReactElement {
  const { results, searchQuery, isSearching } = useImageSearchActionContext();

  // 검색 결과가 있거나 검색 중일 때만 고정 높이 사용
  const hasContent = results.length > 0 || searchQuery || isSearching;

  return (
    <RadixDialogContent
      className={cn(
        'max-w-[40vw]! w-full p-0 gap-0 overflow-hidden rounded-lg',
        hasContent ? 'h-[50vh] max-h-[80vh]!' : 'h-auto max-h-[80vh]!',
        className
      )}
      showCloseButton={true}
    >
      {/* 접근성을 위한 숨겨진 타이틀 */}
      <DialogTitle className="sr-only">Image Search</DialogTitle>

      {children}
    </RadixDialogContent>
  );
}
