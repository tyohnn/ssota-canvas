import { SidebarProvider } from '@workspace/ui/components/ui/sidebar';

import { SidebarInsetSkeleton } from './content';
import { SidebarSkeleton } from './sidebar';

/**
 * 전체 대시보드 로딩 스켈레톤.
 * (dashboard)/loading.tsx 및 리다이렉트 전 표시용.
 * SidebarSkeleton + SidebarInsetSkeleton 조합.
 */
export function DashboardLoadingSkeleton({
  loadingMessage,
}: {
  loadingMessage?: string;
} = {}) {
  return (
    <SidebarProvider>
      <SidebarSkeleton />
      <SidebarInsetSkeleton loadingMessage={loadingMessage} />
    </SidebarProvider>
  );
}
