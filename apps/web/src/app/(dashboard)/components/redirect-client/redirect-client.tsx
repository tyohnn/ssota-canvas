'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useOrganization } from '@/domains/organization-management/frontend/hooks/use-organization';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';

interface RedirectClientProps {
  redirectUrl: string;
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

/**
 * 클라이언트 사이드 리다이렉트 컴포넌트
 *
 * 서버 사이드 리다이렉트 시 발생하는 클라이언트 에러를 방지하기 위해 사용.
 */
export function RedirectClient({ redirectUrl }: RedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectUrl);
  }, [redirectUrl, router]);

  return null;
}

/** workspaces에서 첫 페이지 ID 반환 (selectedPageId 우선, 없으면 첫 루트 페이지) */
function getFirstPageId(
  workspaces: WorkspaceWithPagesDTO[],
  selectedPageId: string | null
): string | null {
  if (selectedPageId) return selectedPageId;
  for (const ws of workspaces) {
    const first = ws.pageTree?.[0];
    if (first?.id) return first.id;
  }
  return null;
}

interface RedirectToDefaultPageClientProps {
  /** /r/[orgId] 페이지에서 사용 시 URL의 orgId 전달 */
  orgIdFromUrl?: string;
  children?: React.ReactNode;
}

/**
 * /r 또는 /r/[orgId]에서 /r/[orgId]/[pageId]로 리다이렉트.
 * 컨텍스트(선택 조직, 워크스페이스·페이지)에서 대상 URL 계산.
 *
 * When orgIdFromUrl is set (/r/[orgId] index), only redirect once context
 * matches the URL org. Otherwise we would use stale context (previous org's
 * workspaces/selectedPageId) and redirect to /r/newOrg/oldOrgPageId, causing
 * "Page org mismatch" in the layout.
 */
export function RedirectToDefaultPageClient({
  orgIdFromUrl,
  children,
}: RedirectToDefaultPageClientProps) {
  const { selectedOrganization } = useOrganization();
  const { workspaces, selectedPageId } = useWorkspace();

  const redirectUrl = useMemo(() => {
    const orgId = orgIdFromUrl ?? selectedOrganization?.id ?? null;
    if (!orgId) return null;
    // On /r/[orgId], wait for context to match URL org before using workspaces
    // so we don't redirect to a page that belongs to the previous org.
    if (orgIdFromUrl != null && selectedOrganization?.id !== orgIdFromUrl) {
      return null;
    }
    // 조직이 있으면 drive로 리다이렉트
    return `/r/${orgId}/drive`;
    // 기존: 캔버스 첫 페이지로 리다이렉트
    // const pageId = getFirstPageId(workspaces, selectedPageId);
    // if (pageId) return `/r/${orgId}/${pageId}`;
    // return null;
  }, [orgIdFromUrl, selectedOrganization?.id]);

  if (redirectUrl) {
    return (
      <>
        {children}
        <RedirectClient redirectUrl={redirectUrl} />
      </>
    );
  }

  return <>{children}</>;
}
