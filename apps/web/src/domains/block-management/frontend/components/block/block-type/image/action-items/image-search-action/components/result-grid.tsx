/**
 * Result Grid Component
 */

'use client';

import React from 'react';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useImageSearchActionContext } from '../image-search-action.context';
import { ImageCard } from './image-card';
import { EmptyState } from './empty-state';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Result Grid Props
 */
export interface ResultGridProps {
  className?: string;
}

/**
 * Result Grid Component
 */
export function ResultGrid({
  className,
}: ResultGridProps): React.ReactElement | null {
  const { results, isSearching, searchQuery } = useImageSearchActionContext();

  // 초기 상태 (검색 전) - 아무것도 표시하지 않음
  if (results.length === 0 && !searchQuery && !isSearching) {
    return null;
  }

  // 로딩 상태
  if (isSearching) {
    return (
      <ScrollArea className={cn('flex-1 min-h-0', className)}>
        <Box className="columns-2 p-4" style={{ columnGap: 0 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-video mb-0 break-inside-avoid"
            />
          ))}
        </Box>
      </ScrollArea>
    );
  }

  // 결과 없음
  if (results.length === 0 && searchQuery) {
    return <EmptyState className={cn('flex-1', className)} />;
  }

  // 결과 표시 (Masonry 갤러리 레이아웃)
  return (
    <ScrollArea className={cn('flex-1 min-h-0', className)}>
      <Box className="columns-2 p-4" style={{ columnGap: 0 }}>
        {results.map(image => (
          <ImageCard key={image.id} image={image} />
        ))}
      </Box>
    </ScrollArea>
  );
}
