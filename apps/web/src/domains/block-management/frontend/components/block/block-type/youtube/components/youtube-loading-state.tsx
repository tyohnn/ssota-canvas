'use client';

import React from 'react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

/**
 * YouTube Loading State Component
 *
 * 메타데이터를 로딩 중일 때 표시되는 스켈레톤 컴포넌트
 * PreviewCard와 동일한 레이아웃 구조를 사용하여 부드러운 전환 제공
 */
export function YoutubeLoadingState() {
  return (
    <>
      {/* 플레이어 영역 스켈레톤 */}
      <Box className="flex-1 relative min-h-0">
        <Skeleton className="absolute inset-0" />
      </Box>

      {/* 하단 정보 섹션 스켈레톤 */}
      <Box className="p-3 flex items-start gap-3 bg-background border-t border-border">
        {/* 채널 아바타 스켈레톤 */}
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />

        {/* 텍스트 정보 스켈레톤 */}
        <Box className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" /> {/* 제목 */}
          <Skeleton className="h-3 w-full" /> {/* 채널명 + 조회수 */}
        </Box>
      </Box>
    </>
  );
}
