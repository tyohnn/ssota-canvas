import { Box } from '@/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

/**
 * 페이지 헤더 로딩 스켈레톤.
 * SidebarInsetSkeleton에서 사용.
 */
export function HeaderSkeleton() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <Box className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Box className="mx-2 h-4 w-px bg-border/50" />
        <Skeleton className="h-5 w-32 rounded-md" />
      </Box>
      <Box className="flex items-center gap-2">
        <Box className="flex items-center gap-1 mr-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </Box>
        <Box className="h-4 w-px bg-border/50 mx-1" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </Box>
    </header>
  );
}
