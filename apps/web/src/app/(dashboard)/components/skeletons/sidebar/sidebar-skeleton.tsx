import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/ui/sidebar';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { OrgSwitcherSkeleton } from './org-switcher-skeleton';
import { WorkspaceSkeleton } from './workspace-skeleton';

/**
 * 전체 사이드바 로딩 스켈레톤.
 * OrgSwitcherSkeleton + WorkspaceSkeleton 조합.
 */
export function SidebarSkeleton() {
  return (
    <Sidebar className="border-r-0 p-0">
      <SidebarHeader>
        <OrgSwitcherSkeleton />
        <Box className="space-y-1 px-2 py-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </Box>
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceSkeleton />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {Array.from({ length: 3 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <Box className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </Box>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
