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
 * 랜덤 블록 생성 (서버 컴포넌트 호환)
 * 매번 새로고침할 때마다 다른 위치 생성
 */
function generateRandomBlocks() {
  const blocks = [];
  const blockCount = 6;

  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: 50 + Math.random() * 800, // 50~850px
      y: 50 + Math.random() * 400, // 50~450px
      width: 200 + Math.random() * 150, // 200~350px
      height: 100 + Math.random() * 100, // 100~200px
      delay: i * 50, // 순차적 애니메이션 딜레이
    });
  }

  return blocks;
}

/**
 * Canvas Error Fallback
 */
function CanvasErrorFallback({ error }: { error: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-destructive text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground">캔버스 로드 실패</h2>
        <p className="text-muted-foreground">{error}</p>
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
    console.error('[PageContent] Canvas 로드 실패:', canvasViewResult.error);
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
 * - Suspense는 layout.tsx에서 관리 (로딩 단계 통합)
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

  // Suspense는 layout.tsx에서 처리되므로 직접 렌더링
  return (
    <PageContent pageId={pageId} orgId={orgId} workspaceId={workspaceId} />
  );
}
