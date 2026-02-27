'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useWorkspaceContext } from '@/domains/workspace-management/frontend/contexts/workspace/context';

interface DriveRouteSyncClientProps {
  orgId: string;
}

/**
 * Drive 경로 진입 시 selectedPageId 초기화.
 * /r/[orgId]/drive 진입 시 워크스페이스 페이지 선택을 해제하여 사이드바에서 Drive가 활성으로 표시됨.
 */
export function DriveRouteSyncClient({ orgId }: DriveRouteSyncClientProps) {
  const pathname = usePathname();
  const { setSelectedPageId, setSelectedWorkspaceId } = useWorkspaceContext();

  useEffect(() => {
    const isOnDrive = pathname?.startsWith(`/r/${orgId}/drive`);
    if (isOnDrive) {
      // 다음 틱으로 미뤄 실행. WorkspaceProvider의 초기 effect(쿠키/첫 페이지 복원)가
      // 자식 effect보다 나중에 실행되어 덮어쓰므로, 그 이후에 clear가 적용되도록 함.
      const id = setTimeout(() => {
        setSelectedPageId(null);
        setSelectedWorkspaceId(null);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [pathname, orgId, setSelectedPageId, setSelectedWorkspaceId]);

  return null;
}
