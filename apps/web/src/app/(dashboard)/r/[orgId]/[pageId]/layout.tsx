import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';

import {
  getAuthenticatedUser,
  verifyAccessByPageId,
} from '@/domains/common/auth/helpers';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';
import { WorkspacePageHeader } from '@/domains/workspace-management/frontend/components/page-viewer/workspace-page-header';

import { PageSyncClient } from '../../../components/sync-client/page-sync-client';
import { Box } from '@/components/ui/box';

interface OrgPageIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string; pageId: string }>;
}

/**
 * /r/[orgId]/[pageId] 레이아웃
 *
 * page 검증(verifyAccessByPageId), page 소속 org가 URL orgId와 일치하는지 확인.
 * PageSyncClient, WorkspacePageHeader, Suspense(children) 렌더.
 */
export default async function OrgPageIdLayout({
  children,
  params,
}: OrgPageIdLayoutProps) {
  const { orgId, pageId } = await params;

  const user = await getAuthenticatedUser();
  const accessResult = await verifyAccessByPageId(pageId, user.id);

  if (!accessResult.success) {
    console.error('[/r/[orgId]/[pageId]/layout] Page access denied:', {
      pageId,
      error: accessResult.error,
    });
    redirect('/unauthorized');
  }

  const pageOrgId = accessResult.workspace!.organizationId.value;
  const workspaceId = accessResult.page!.workspaceId.value;

  if (pageOrgId !== orgId) {
    console.error('[/r/[orgId]/[pageId]/layout] Page org mismatch:', {
      urlOrgId: orgId,
      pageOrgId,
    });
    redirect('/unauthorized');
  }

  return (
    <Box className="flex min-w-0 flex-1 flex-col min-h-0 h-full w-full overflow-hidden m-0 p-0">
      <PageSyncClient
        orgId={orgId}
        workspaceId={workspaceId}
        pageId={pageId}
      />
      <WorkspacePageHeader
        workspaceId={workspaceId}
        pageId={pageId}
      />
      <Box className="flex-1 min-h-0 min-w-0 overflow-hidden w-full">
        <Suspense fallback={<CanvasLoadingSkeleton />}>
          {children}
        </Suspense>
      </Box>
    </Box>
  );
}
