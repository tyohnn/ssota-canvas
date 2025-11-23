import { redirect } from 'next/navigation';
import { OrgRedirectClient } from '../org-redirect-client';

export const dynamic = 'force-dynamic';

interface WorkspacePageProps {
  params: Promise<{ orgId: string }>;
}

/**
 * Workspace 페이지
 *
 * 조직 루트로 리다이렉트하여 적절한 페이지로 이동
 */
export default async function WorkspacePageRoute({
  params,
}: WorkspacePageProps) {
  const { orgId } = await params;
  return <OrgRedirectClient redirectUrl={`/r/${orgId}`} />;
}
