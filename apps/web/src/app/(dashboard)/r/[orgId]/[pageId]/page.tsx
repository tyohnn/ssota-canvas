import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import type { Edge } from '@xyflow/react';

import { getCanvasViewAction } from '@/domains/canvas-management/actions/canvas-query.actions';
import {
  type CustomNodeType,
  sortNodesForReactFlow,
  toReactFlowEdgeFromCanvasView,
  toReactFlowNodeFromCanvasView,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { CanvasClient } from '@/domains/canvas-management/frontend/components';
import {
  getAuthenticatedUser,
  verifyAccessByPageId,
} from '@/domains/common/auth/helpers';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

import { CanvasLoadErrorCanvas } from '@/app/(main)/_components/not-found/CanvasLoadErrorCanvas';

interface OrgPageIdRouteProps {
  params: Promise<{ orgId: string; pageId: string }>;
}

/** Open Graph shown when shared link has no access / private / expired: landing message + CTA */
const SHARED_LINK_FALLBACK_METADATA: Metadata = {
  title: 'SSOTA - Structure research. Build the next big thing.',
  description:
    'This link is private or has expired. Drop your sources on one canvas. SSOTA turns them into a structured board—so you can reach a plan, make a decision, and make your next big move.',
  openGraph: {
    type: 'website',
    siteName: 'SSOTA',
    title: 'SSOTA - Structure research. Build the next big thing.',
    description:
      'This link is private or has expired. Drop your sources on one canvas. SSOTA turns them into a structured board—so you can reach a plan, make a decision, and make your next big move.',
    url: 'https://ssota.io',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSOTA - Structure research. Build the next big thing.',
    description:
      'This link is private or has expired. Drop your sources on one canvas. SSOTA turns them into a structured board—from research to a plan.',
  },
};

/**
 * Generate dynamic metadata for page (orgId, pageId from params)
 */
export async function generateMetadata({
  params,
}: OrgPageIdRouteProps): Promise<Metadata> {
  const { orgId, pageId } = await params;

  const user = await getAuthenticatedUser();
  const accessResult = await verifyAccessByPageId(pageId, user.id);
  if (!accessResult.success) {
    return SHARED_LINK_FALLBACK_METADATA;
  }

  const workspaceId = accessResult.page!.workspaceId.value;

  const workspacePageResult = await getOrganizationWorkspacePageViewAction({
    organizationId: orgId,
  });
  if (!workspacePageResult.success) {
    return SHARED_LINK_FALLBACK_METADATA;
  }

  const workspace = workspacePageResult.data.workspaces.find(
    w => w.workspaceId === workspaceId
  );
  if (!workspace) {
    return SHARED_LINK_FALLBACK_METADATA;
  }

  const findPageInTree = (
    pages: typeof workspace.pageTree,
    targetId: string
  ): (typeof workspace.pageTree)[0] | null => {
    for (const page of pages) {
      if (page.id === targetId) return page;
      if (page.children?.length) {
        const found = findPageInTree(page.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const page = findPageInTree(workspace.pageTree, pageId);
  const pageName = page?.title || 'Untitled';
  const workspaceName = workspace.workspaceName;

  return {
    title: `${pageName}`,
    description: `Edit and collaborate on ${pageName} canvas. Create blocks, manage content, and work together with AI assistance in ${workspaceName}.`,
    openGraph: {
      title: `${pageName}`,
      description: `Edit and collaborate on ${pageName} canvas. Create blocks, manage content, and work together with AI assistance in ${workspaceName}.`,
    },
  };
}

async function PageContent({
  orgId: orgIdFromRoute,
  pageId,
}: {
  orgId: string;
  pageId: string;
}) {
  const canvasViewResult = await getCanvasViewAction({ pageId });

  if (!canvasViewResult.success) {
    const isUnauthenticated =
      canvasViewResult.code === 'UNAUTHORIZED' ||
      String(canvasViewResult.error ?? '').includes('UNAUTHORIZED');
    const isAccessDenied = canvasViewResult.code === 'ACCESS_DENIED';

    if (isUnauthenticated) {
      redirect('/login?message=Please%20log%20in%20to%20continue.');
    }
    if (isAccessDenied) {
      redirect('/unauthorized');
    }

    console.error('[PageContent] Canvas load failed:', canvasViewResult.error);
    return (
      <CanvasLoadErrorCanvas
        error={canvasViewResult.error ?? 'Unable to load canvas data.'}
        orgId={orgIdFromRoute}
      />
    );
  }

  const { orgId, workspaceId, ...canvasViewData } = canvasViewResult.data;

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

export default async function OrgPageIdRoute({ params }: OrgPageIdRouteProps) {
  const { orgId, pageId } = await params;

  if (!pageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a page</p>
      </div>
    );
  }

  return <PageContent orgId={orgId} pageId={pageId} />;
}
