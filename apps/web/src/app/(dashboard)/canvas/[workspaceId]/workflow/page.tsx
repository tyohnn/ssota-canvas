import { CanvasPage } from "@/domains/workflow-canvas/components/canvas-page";
import {
  getWorkspaceBlocks,
  getWorkspaceBlockPositions,
} from "@/domains/workflow-canvas/actions/block.action";
import { getWorkspaceEdges } from "@/domains/workflow-canvas/actions/edge.action";
import { mockupData } from "../../mockup-data";

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
  const actualWorkspaceId = workspaceId || mockupData.workspace.id;

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

    if (
      !blocksResult.success ||
      !edgesResult.success ||
      !positionsResult.success
    ) {
      // console.error("❌ [DB] 초기 데이터 로드 실패:", {
      //   blocksError: !blocksResult.success ? blocksResult.error : null,
      //   edgesError: !edgesResult.success ? edgesResult.error : null,
      //   positionsError: !positionsResult.success ? positionsResult.error : null,
      // });

      // Fallback to mockup data
      const { blocks, blockPositions, edges } = mockupData;
      // console.log("⚠️ [DB] 목업 데이터로 폴백:", { nodesCount: blocks.length });

      return (
        <div className="flex-1 w-full">
          <CanvasPage
            workspaceId={actualWorkspaceId}
            initialDbBlocks={blocks}
            initialDbEdges={edges}
            initialDbBlockPositions={blockPositions}
          />
        </div>
      );
    }

    const dbBlocks = blocksResult.data || [];
    const dbEdges = edgesResult.data || [];
    const dbBlockPositions = positionsResult.data || [];

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

    // Fallback to mockup data on error
    const { blocks, blockPositions, edges } = mockupData;
    // console.log("⚠️ [DB] 오류로 인한 목업 데이터 폴백:", {
    //   blocksCount: blocks.length,
    // });

    return (
      <div className="flex-1 w-full">
        <CanvasPage
          workspaceId={actualWorkspaceId}
          initialDbBlocks={blocks}
          initialDbEdges={edges}
          initialDbBlockPositions={blockPositions}
        />
      </div>
    );
  }
}
