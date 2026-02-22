/**
 * Timeline Loading State
 *
 * 타임라인 스크립트 로딩 중일 때 표시하는 컴포넌트 (Skeleton 사용)
 */

'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

interface TimelineLoadingStateProps {
  isExtracting?: boolean;
}

export function TimelineLoadingState({
  isExtracting = false,
}: TimelineLoadingStateProps) {
  return (
    <Box className="space-y-4">
      <Box className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {isExtracting
            ? 'Extracting video transcript... This may take a moment.'
            : 'Loading script...'}
        </p>
        {isExtracting && (
          <p className="text-xs text-muted-foreground">
            Fetching captions from YouTube and processing transcript
          </p>
        )}
      </Box>

      <Box className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </Box>
      <Box className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-full" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
