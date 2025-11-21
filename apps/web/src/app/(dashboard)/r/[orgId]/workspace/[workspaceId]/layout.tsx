import React from 'react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgId: string;
    workspaceId: string;
  }>;
}

/**
 * Workspace Layout
 *
 * 같은 워크스페이스 내 페이지 간 이동 시 레이아웃 유지
 * - 사이드바는 상위 layout에서 렌더링되므로 유지됨
 * - 페이지 콘텐츠만 변경됨
 */
export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  // params는 필요 시 사용 가능하지만 현재는 pass-through만 수행
  await params;

  return <>{children}</>;
}
