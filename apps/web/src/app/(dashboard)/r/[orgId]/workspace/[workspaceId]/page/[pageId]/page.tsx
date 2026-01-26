import type { Metadata } from 'next';

import type { Edge } from '@xyflow/react';

import { getCanvasViewAction } from '@/domains/canvas-management/actions/canvas-query.actions';
import {
  type CustomNodeType,
  sortNodesForReactFlow,
  toReactFlowEdgeFromCanvasView,
  toReactFlowNodeFromCanvasView,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { CanvasClient } from '@/domains/canvas-management/frontend/components';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

interface WorkspacePageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * Generate dynamic metadata for page
 */
export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { orgId, workspaceId, pageId } = await params;

  // Fetch workspace data to get the page name
  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });

  if (!workspacePageResult.success) {
    return {
      title: 'Page',
      description: 'View and edit your canvas page.',
    };
  }

  // Find the workspace and page
  const workspace = workspacePageResult.data.workspaces.find(
    w => w.workspaceId === workspaceId
  );

  if (!workspace) {
    return {
      title: 'Page',
      description: 'View and edit your canvas page.',
    };
  }

  // Recursively find the page in the tree
  const findPageInTree = (
    pages: typeof workspace.pageTree,
    targetId: string
  ): (typeof workspace.pageTree)[0] | null => {
    for (const page of pages) {
      if (page.id === targetId) return page;
      if (page.children && page.children.length > 0) {
        const found = findPageInTree(page.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const page = findPageInTree(workspace.pageTree, pageId);
  const pageName = page?.title || 'Untitled';
  const workspaceName = workspace.workspaceName;
  const organizationName = workspace.organizationName;

  return {
    title: `${pageName}`,
    description: `Edit and collaborate on ${pageName} canvas. Create blocks, manage content, and work together with AI assistance in ${workspaceName}.`,
    openGraph: {
      title: `${pageName}`,
      description: `Edit and collaborate on ${pageName} canvas. Create blocks, manage content, and work together with AI assistance in ${workspaceName}.`,
    },
  };
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
  // 부모 노드가 자식보다 먼저 오도록 정렬 (React Flow 요구사항)
  const unsortedNodes: CustomNodeType[] = canvasViewData.blocks.map(block =>
    toReactFlowNodeFromCanvasView(block)
  );
  const initialNodes = sortNodesForReactFlow(unsortedNodes);

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
