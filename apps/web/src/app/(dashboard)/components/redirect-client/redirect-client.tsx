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
 */
export function RedirectToDefaultPageClient({
  orgIdFromUrl,
  children,
}: RedirectToDefaultPageClientProps) {
  const { selectedOrganization } = useOrganization();
  const { workspaces, selectedPageId } = useWorkspace();

  const redirectUrl = useMemo(() => {
    const orgId = orgIdFromUrl ?? selectedOrganization?.id ?? null;
    const pageId = getFirstPageId(workspaces, selectedPageId);
    if (orgId && pageId) return `/r/${orgId}/${pageId}`;
    return null;
  }, [orgIdFromUrl, selectedOrganization?.id, workspaces, selectedPageId]);

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
