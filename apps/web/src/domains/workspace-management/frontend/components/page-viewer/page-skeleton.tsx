'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page Skeleton
 *
 * 페이지 로딩 상태 (Screen 3)
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 스켈레톤 */}
      <div className="border-b px-8 py-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* 콘텐츠 스켈레톤 */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
