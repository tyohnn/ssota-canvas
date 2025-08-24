import React, { Suspense } from "react";
import { CanvasPageContent } from "@/domains/canvas/components/canvas-page";
import { Block, BlockPosition, Edge } from "@/db/schema";
import {
  listWorkspacePageBlocks,
  listWorkspacePageBlockPositions,
  listWorkspaceComponentBlocks,
  listWorkspaceComponentBlockPositions,
} from "@/domains/canvas/actions/block.action";
import { listWorkspaceEdges } from "@/domains/canvas/actions/edge.action";
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

  // Combine all blocks (pages + components)
  const blocks = [...pageBlocks, ...componentBlocks];

  // Do not preload all positions on initial load; will be lazy-loaded per page
  const blockPositions: BlockPosition[] = [];
  // Note: First page will be auto-selected on mount inside CanvasRoot to trigger page position caching.

  // Fetch edges from DB
  const edgesRes = await listWorkspaceEdges({ workspaceId: workspaceId! });
  const edges = (edgesRes.success ? edgesRes.data : []) as Edge[];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
        <div className="h-full w-full">
          <Suspense fallback={<CanvasSkeleton />}>
            <CanvasRoot
              workspaceId={workspaceId!}
              initialBlocks={blocks}
              initialBlockPositions={blockPositions}
              initialEdges={edges}
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
