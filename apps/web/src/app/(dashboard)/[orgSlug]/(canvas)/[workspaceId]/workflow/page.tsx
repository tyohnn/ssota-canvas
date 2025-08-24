import { CanvasPage } from "@/domains/workflow-canvas/components/canvas-page";
import {
  getWorkspaceBlocks,
  getWorkspaceBlockPositions,
} from "@/domains/workflow-canvas/actions/block.action";
import { getWorkspaceEdges } from "@/domains/workflow-canvas/actions/edge.action";

interface CanvasPageProps {
  params: Promise<{ workspaceId?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CanvasPageRoute({
  params,
  searchParams,
}: CanvasPageProps) {
  const { workspaceId } = await params;

  // Use provided workspaceId or fallback to mockup workspace
  const actualWorkspaceId = workspaceId!;

  // console.log("🔵 [DB] 초기 데이터 로드 시작:", {
  //   workspaceId: actualWorkspaceId,
  // });

  try {
    // Load data from DB
    const [blocksResult, edgesResult, positionsResult] = await Promise.all([
      getWorkspaceBlocks(actualWorkspaceId),
      getWorkspaceEdges(actualWorkspaceId),
      getWorkspaceBlockPositions(actualWorkspaceId),
    ]);

    const dbBlocks = blocksResult.success ? blocksResult.data : [];
    const dbEdges = edgesResult.success ? edgesResult.data : [];
    const dbBlockPositions = positionsResult.success
      ? positionsResult.data
      : [];

    // console.log("✅ [DB] 초기 데이터 로드 완료:", {
    //   blocksCount: dbBlocks.length,
    //   edgesCount: dbEdges.length,
    //   positionsCount: dbBlockPositions.length,
    // });

    return (
      <div className="flex-1 w-full">
        <CanvasPage
          workspaceId={actualWorkspaceId}
          initialDbBlocks={dbBlocks}
          initialDbEdges={dbEdges}
          initialDbBlockPositions={dbBlockPositions}
        />
      </div>
    );
  } catch (error) {
    // console.error("❌ [DB] 초기 데이터 로드 중 오류:", error);

    return (
      <div className="flex-1 w-full">
        <CanvasPage
          workspaceId={actualWorkspaceId}
          initialDbBlocks={[]}
          initialDbEdges={[]}
          initialDbBlockPositions={[]}
        />
      </div>
    );
  }
}
