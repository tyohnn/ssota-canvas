/**
 * Image Grid Skeleton
 *
 * 공통 이미지 그리드 로딩 스켈레톤 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';
import { ImageGridContainer } from './image-grid-container';

export interface ImageGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Image Grid Skeleton
 *
 * 이미지 그리드 로딩 중 표시할 스켈레톤 UI
 */
export function ImageGridSkeleton({
  count = 8,
  className = '',
}: ImageGridSkeletonProps) {
  return (
    <Box className={className}>
      <ImageGridContainer>
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            className="bg-muted animate-pulse mb-0 break-inside-avoid"
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '4/3',
              lineHeight: 0,
              fontSize: 0,
            }}
          />
        ))}
      </ImageGridContainer>
    </Box>
  );
}
