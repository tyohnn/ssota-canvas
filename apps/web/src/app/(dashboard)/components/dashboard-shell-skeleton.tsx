/**
 * Dashboard shell skeleton: Sidebar + SidebarInset (header + canvas).
 * Matches [orgId]/layout structure so loading → layout transition has no layout shift.
 * - SidebarInset: same className as layout (overflow-hidden overscroll-none h-svh)
 * - Header: h-12 to match WorkspacePageHeader
 */
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

export function DashboardShellSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 p-0">
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
        <SidebarContent>
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
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>
                <Skeleton className="h-3 w-20" />
              </SidebarGroupLabel>
              <Skeleton className="h-3 w-3 mr-1" />
            </div>
            <SidebarGroupContent>
              <div className="space-y-1 py-1">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {[1, 2, 3].map(i => (
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
      <SidebarInset className="overflow-hidden overscroll-none h-svh flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="mx-2 h-4 w-px bg-border/50" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CanvasLoadingSkeleton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
