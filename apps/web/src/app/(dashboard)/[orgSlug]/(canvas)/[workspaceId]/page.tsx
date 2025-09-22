import React, { Suspense } from "react";
import { CanvasPageContent } from "@/domains/canvas/components/canvas-page";
import { Block } from "@/db/schema";
import {
  listWorkspacePageBlocks,
  listWorkspaceComponentBlocks,
} from "@/domains/canvas/actions/block.action";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { CanvasRoot } from "@/domains/canvas/providers/CanvasRoot";

interface CanvasPageProps {
  params: Promise<{ workspaceId?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CanvasPageRoute({
  params,
  searchParams,
}: CanvasPageProps) {
  const { workspaceId } = await params;

  // Fetch page blocks from DB
  const pageBlocksRes = await listWorkspacePageBlocks({
    workspaceId: workspaceId!,
  });
  const pageBlocks = (
    pageBlocksRes.success ? pageBlocksRes.data : []
  ) as Block[];

  // Fetch component blocks from DB
  const componentBlocksRes = await listWorkspaceComponentBlocks({
    workspaceId: workspaceId!,
  });
  const componentBlocks = (
    componentBlocksRes.success ? componentBlocksRes.data : []
  ) as Block[];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
        <div className="h-full w-full">
          <Suspense fallback={<CanvasSkeleton />}>
            <CanvasRoot
              workspaceId={workspaceId!}
              initialPageBlocks={pageBlocks}
              initialComponentBlocks={componentBlocks}
            >
              <CanvasPageContent workspaceId={workspaceId!} />
            </CanvasRoot>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar skeleton */}
      <div className="h-10 border-b flex items-center gap-3 px-3">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      {/* Main canvas area skeleton */}
      <div className="flex-1 grid place-items-center">
        <Skeleton className="w-3/5 h-3/5 rounded-lg" />
      </div>
    </div>
  );
}
