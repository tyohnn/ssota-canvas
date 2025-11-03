import { Suspense } from 'react';
import { getCanvasViewAction } from '@/domains/canvas-management/actions/canvas-query.actions';
import {
  toReactFlowNodeFromCanvasView,
  toReactFlowEdgeFromCanvasView,
  type CustomNodeType,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { CanvasClient } from '@/domains/canvas-management/frontend/components/core/canvas-client';
import type { Edge } from '@xyflow/react';

interface WorkspacePageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * Canvas Loading Skeleton
 */
function CanvasLoadingSkeleton() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-lg text-gray-600">캔버스를 로딩하고 있습니다...</p>
      </div>
    </div>
  );
}

/**
 * Canvas Error Fallback
 */
function CanvasErrorFallback({ error }: { error: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900">캔버스 로드 실패</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );
}

/**
 * 페이지의 캔버스 콘텐츠를 렌더링하는 서버 컴포넌트
 */
async function PageContent({
  pageId,
  orgId,
  workspaceId,
}: {
  pageId: string;
  orgId: string;
  workspaceId: string;
}) {
  const canvasViewResult = await getCanvasViewAction(
    pageId,
    orgId,
    workspaceId
  );

  if (!canvasViewResult.success) {
    return (
      <CanvasErrorFallback
        error={canvasViewResult.error || '캔버스 데이터를 불러올 수 없습니다.'}
      />
    );
  }

  const canvasViewData = canvasViewResult.data;

  // ACL 변환: CanvasViewData → React Flow 초기 데이터
  const initialNodes: CustomNodeType[] = canvasViewData.blocks.map(block =>
    toReactFlowNodeFromCanvasView(block, {
      pageId,
      orgId,
      workspaceId,
    })
  );

  const initialEdges: Edge[] = canvasViewData.edges.map(edge =>
    toReactFlowEdgeFromCanvasView(edge)
  );

  return (
    <CanvasClient
      pageId={pageId}
      orgId={orgId}
      workspaceId={workspaceId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}

/**
 * 페이지 렌더링
 *
 * - URL이 Single Source of Truth
 * - Suspense로 데이터 로딩 처리
 * - CanvasClient를 사용하여 캔버스 렌더링
 */
export default async function WorkspacePageRoute({
  params,
}: WorkspacePageProps) {
  const { orgId, workspaceId, pageId } = await params;

  if (!pageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">페이지를 선택해주세요</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<CanvasLoadingSkeleton />}>
      <PageContent pageId={pageId} orgId={orgId} workspaceId={workspaceId} />
    </Suspense>
  );
}
