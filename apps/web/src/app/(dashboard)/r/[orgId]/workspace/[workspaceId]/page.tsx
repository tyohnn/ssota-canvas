import { redirect } from 'next/navigation';

interface WorkspaceIdPageProps {
  params: Promise<{ orgId: string; workspaceId: string }>;
}

/**
 * 워크스페이스 ID 페이지
 *
 * 조직 루트로 리다이렉트하여 적절한 페이지로 이동
 */
export default async function WorkspaceIdPageRoute({
  params,
}: WorkspaceIdPageProps) {
  const { orgId } = await params;
  redirect(`/r/${orgId}`);
}
