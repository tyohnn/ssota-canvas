'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarProvider,
  SidebarInset,
} from '@workspace/ui/components/ui/sidebar';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

interface RedirectClientProps {
  redirectUrl: string;
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

/**
 * 클라이언트 사이드 리다이렉트 컴포넌트
 *
 * 서버 사이드 리다이렉트 시 발생하는 클라이언트 에러를 방지하기 위해 사용
 * 로딩 상태를 유지하다가 클라이언트에서 안전하게 이동
 */
export function RedirectClient({ redirectUrl }: RedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    // 리다이렉트 수행
    router.replace(redirectUrl);
  }, [redirectUrl, router]);

  // 리다이렉트 중에도 대시보드 스켈레톤 표시 (화면 깜빡임 방지)
  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 p-0">
        {/* Header Skeleton */}
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <div className="space-y-1 px-2 py-2">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </SidebarHeader>

        {/* Content Skeleton */}
        <SidebarContent>
          {/* Favorites Section Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-3 w-16" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Workspaces Section Skeleton */}
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>
                <Skeleton className="h-3 w-20" />
              </SidebarGroupLabel>
              <Skeleton className="h-3 w-3 mr-1" />
            </div>
            <SidebarGroupContent>
              <div className="space-y-1 py-1">
                {/* 워크스페이스 1 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Skeleton className="h-4 w-4 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
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

                {/* 워크스페이스 2 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Skeleton className="h-4 w-4 shrink-0" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="pl-4 space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Skeleton className="h-4 w-4 shrink-0" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </div>

                {/* 워크스페이스 3 */}
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer Skeleton */}
        <SidebarFooter>
          <SidebarMenu>
            {Array.from({ length: 3 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main Content Skeleton - Canvas Loading Style with Header */}
      <SidebarInset className="overflow-hidden overscroll-none h-svh flex flex-col">
        {/* Header Skeleton */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" /> {/* Sidebar Trigger */}
            <div className="mx-2 h-4 w-px bg-border/50" /> {/* Separator */}
            <Skeleton className="h-5 w-32 rounded-md" />{' '}
            {/* Page Title / Breadcrumb */}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Skeleton className="h-8 w-8 rounded-md" /> {/* Action Icon */}
              <Skeleton className="h-8 w-8 rounded-md" /> {/* Action Icon */}
            </div>
            <div className="h-4 w-px bg-border/50 mx-1" />
            <Skeleton className="h-8 w-16 rounded-md" /> {/* Share Button */}
            <Skeleton className="h-8 w-8 rounded-md" /> {/* More Menu */}
          </div>
        </header>

        {/* Canvas Skeleton */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasLoadingSkeleton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
