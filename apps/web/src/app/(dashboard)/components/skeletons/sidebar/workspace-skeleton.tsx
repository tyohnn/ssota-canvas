import { Box } from '@/components/ui/box';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@workspace/ui/components/ui/sidebar';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

/**
 * 워크스페이스 목록 로딩 스켈레톤.
 * SidebarSkeleton 및 DashboardSidebar Suspense fallback에서 재사용.
 */
export function WorkspaceSkeleton() {
  return (
    <>
      {/* Favorites Section Skeleton */}
      <SidebarGroup>
        <SidebarGroupLabel>
          <Skeleton className="h-3 w-16" />
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <Box className="space-y-1">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </Box>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Workspaces Section Skeleton */}
      <SidebarGroup>
        <Box className="flex items-center justify-between">
          <SidebarGroupLabel>
            <Skeleton className="h-3 w-20" />
          </SidebarGroupLabel>
          <Skeleton className="h-3 w-3 mr-1" />
        </Box>
        <SidebarGroupContent>
          <Box className="space-y-1 py-1">
            {/* 워크스페이스 1 */}
            <Box className="space-y-1">
              <Box className="flex items-center gap-1.5 px-2 py-1">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </Box>
              <Box className="pl-4 space-y-1">
                <Box className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </Box>
                <Box className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-3/4" />
                </Box>
              </Box>
            </Box>

            {/* 워크스페이스 2 */}
            <Box className="space-y-1">
              <Box className="flex items-center gap-1.5 px-2 py-1">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 w-2/3" />
              </Box>
              <Box className="pl-4 space-y-1">
                <Box className="flex items-center gap-1.5 px-2 py-1">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <Skeleton className="h-4 w-5/6" />
                </Box>
              </Box>
            </Box>

            {/* 워크스페이스 3 */}
            <Box className="flex items-center gap-1.5 px-2 py-1">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 w-1/2" />
            </Box>
          </Box>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
