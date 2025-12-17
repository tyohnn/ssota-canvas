'use client';

import React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Workspace Sidebar Skeleton
 *
 * 사이드바 로딩 상태 (워크스페이스/페이지 목록 로딩 중)
 */
export function WorkspaceSidebarSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="space-y-1">
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
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
