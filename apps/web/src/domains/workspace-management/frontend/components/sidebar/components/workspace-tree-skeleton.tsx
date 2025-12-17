'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Workspace Tree Skeleton
 *
 * CollapsibleContent 내부에서 사용하는 트리 스켈레톤
 * (SidebarGroup 없이 트리만 표시)
 */
export function WorkspaceTreeSkeleton() {
  return (
    <div className="space-y-1 py-1">
      {/* 워크스페이스 스켈레톤 1 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-2 py-1">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
        {/* 하위 페이지 스켈레톤 */}
        <div className="pl-4 space-y-1">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* 워크스페이스 스켈레톤 2 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 px-2 py-1">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* 하위 페이지 스켈레톤 */}
        <div className="pl-4 space-y-1">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      {/* 워크스페이스 스켈레톤 3 */}
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Skeleton className="h-4 w-4 shrink-0" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
