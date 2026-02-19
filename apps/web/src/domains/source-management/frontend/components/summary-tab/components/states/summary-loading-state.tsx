/**
 * Summary Loading State
 *
 * 요약을 로드 중일 때 표시하는 컴포넌트 (Skeleton 사용)
 */

'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

interface SummaryLoadingStateProps {
  isExtracting?: boolean;
}

export function SummaryLoadingState({
  isExtracting = false,
}: SummaryLoadingStateProps) {
  return (
    <Box className="space-y-4">
      <Box className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {isExtracting
            ? 'Generating summary with AI... This may take a moment.'
            : 'Loading summary...'}
        </p>
        {isExtracting && (
          <p className="text-xs text-muted-foreground">
            Processing content and generating summary
          </p>
        )}
      </Box>

      <Box className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Box key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            {index % 2 === 0 && <Skeleton className="h-4 w-5/6" />}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
