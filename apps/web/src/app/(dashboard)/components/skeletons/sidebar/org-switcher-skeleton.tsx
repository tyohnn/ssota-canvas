import { Box } from '@/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

/**
 * 조직 스위처 로딩 스켈레톤.
 * SidebarSkeleton 및 DashboardSidebar Suspense fallback에서 재사용.
 */
export function OrgSwitcherSkeleton() {
  return (
    <Box className="flex items-center gap-2 px-2 py-1.5">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-5 flex-1" />
    </Box>
  );
}
