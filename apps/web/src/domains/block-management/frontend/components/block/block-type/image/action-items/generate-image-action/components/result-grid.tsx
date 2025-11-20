/**
 * Result Grid Component
 */

'use client';

import React from 'react';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useGenerateImageActionContext } from '../generate-image-action.context';
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
  const { results, isGenerating } = useGenerateImageActionContext();

  // 결과가 없고 생성 중이 아니면 표시하지 않음
  if (results.length === 0 && !isGenerating) {
    return null;
  }

  // 로딩 상태
  if (isGenerating) {
    return (
      <Box className={cn('p-4 border-b', className)}>
        <Box className="w-full max-w-[600px] mx-auto">
          <Box className="columns-2" style={{ columnGap: '0.5rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-square mb-2 break-inside-avoid"
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // 결과 표시 (Masonry 갤러리 레이아웃)
  return (
    <Box className={cn('p-4 border-b', className)}>
      <Box className="w-full max-w-[600px] mx-auto">
        <Box className="columns-2" style={{ columnGap: '0.5rem' }}>
          {results.map(image => (
            <ImageCard key={image.id} image={image} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
