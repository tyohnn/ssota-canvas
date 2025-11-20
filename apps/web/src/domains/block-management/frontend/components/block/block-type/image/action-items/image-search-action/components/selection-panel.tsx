/**
 * Selection Panel Component
 */

'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useImageSearchActionContext } from '../image-search-action.context';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Selection Panel Props
 */
export interface SelectionPanelProps {
  className?: string;
}

/**
 * Selection Panel Component
 */
export function SelectionPanel({
  className,
}: SelectionPanelProps): React.ReactElement | null {
  const {
    selectedImage,
    selectedBlockIds,
    setApplyMode,
    handleApply,
    isApplying,
    isSearching,
    searchQuery,
    results,
  } = useImageSearchActionContext();

  // 검색 전이거나 검색 중일 때는 버튼 표시 안 함
  if (!searchQuery || isSearching || results.length === 0) {
    return null;
  }

  const canApply = selectedImage !== null && selectedBlockIds.length > 0;

  const handleReplaceClick = async () => {
    setApplyMode('replace');
    await handleApply();
  };

  const handleCreateNewClick = async () => {
    setApplyMode('createNew');
    await handleApply();
  };

  return (
    <Box className={cn('p-3 border-t bg-muted/5', className)}>
      {/* Apply Buttons */}
      <Box className="flex gap-2">
        <Button
          onClick={handleReplaceClick}
          disabled={!canApply || isApplying}
          variant="default"
          size="sm"
          className="flex-1"
        >
          {isApplying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            '교체'
          )}
        </Button>
        <Button
          onClick={handleCreateNewClick}
          disabled={!canApply || isApplying}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {isApplying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            '새 블록'
          )}
        </Button>
      </Box>
    </Box>
  );
}
