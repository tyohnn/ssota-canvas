import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

/**
 * /r/orgId/pageId 레이아웃 로딩.
 * [pageId]/layout 구조와 동일: WorkspacePageHeader(h-12) + flex-1 overflow-hidden.
 * Inset 안에서만 표시되므로 헤더 높이/구조를 실제 레이아웃에 맞춤.
 */
export default function OrgPageIdLoading() {
  return (
    <div className="flex flex-col h-full">
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
    </div>
  );
}
