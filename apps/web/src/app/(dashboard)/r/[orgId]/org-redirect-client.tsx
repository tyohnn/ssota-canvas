'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

interface OrgRedirectClientProps {
  redirectUrl: string;
}

/**
 * 조직 페이지용 클라이언트 사이드 리다이렉트 컴포넌트
 *
 * layout.tsx의 SidebarInset children으로 렌더링됨
 * 전체 사이드바 구조 없이 콘텐츠(헤더 + 캔버스)만 렌더링
 */
export function OrgRedirectClient({ redirectUrl }: OrgRedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectUrl);
  }, [redirectUrl, router]);

  // layout.tsx의 SidebarInset children으로 렌더링되므로
  // 헤더 + 캔버스 내용만 반환
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" /> {/* Sidebar Trigger */}
          <div className="mx-2 h-4 w-px bg-border/50" /> {/* Separator */}
          <Skeleton className="h-5 w-32 rounded-md" />{' '}
          {/* Page Title / Breadcrumb */}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Skeleton className="h-8 w-8 rounded-md" /> {/* Action Icon */}
            <Skeleton className="h-8 w-8 rounded-md" /> {/* Action Icon */}
          </div>
          <div className="h-4 w-px bg-border/50 mx-1" />
          <Skeleton className="h-8 w-16 rounded-md" /> {/* Share Button */}
          <Skeleton className="h-8 w-8 rounded-md" /> {/* More Menu */}
        </div>
      </header>

      {/* Canvas Skeleton */}
      <div className="flex-1 relative overflow-hidden">
        <CanvasLoadingSkeleton />
      </div>
    </div>
  );
}
