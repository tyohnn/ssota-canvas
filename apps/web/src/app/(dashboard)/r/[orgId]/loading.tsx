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

/**
 * Dashboard Layout Loading Skeleton
 *
 * /r/[orgId] 레이아웃 로딩 시 표시되는 스켈레톤
 */
export default function DashboardLoading() {
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

      {/* Main Content Skeleton */}
      <SidebarInset className="overflow-hidden overscroll-none h-svh">
        <div className="flex flex-col h-full p-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
