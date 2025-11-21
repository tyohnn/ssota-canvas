import React, { Suspense } from 'react';
import { PageSyncClient } from './page-sync-client';
import { WorkspacePageHeader } from '@/domains/workspace-management/frontend/components/page-viewer/workspace-page-header';

interface PageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * Canvas Loading Skeleton (Inline)
 *
 * 랜덤 블록 위치로 실제 캔버스처럼 보이는 로딩 화면
 */
function CanvasLoadingSkeleton() {
  // 서버에서 실행되므로 매번 새로운 랜덤 블록 생성
  const skeletonBlocks = generateRandomBlocks();

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* React Flow 스타일 배경 (Dot Pattern) */}
      <div className="absolute inset-0 bg-background">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern
              id="dot-pattern-layout"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1"
                cy="1"
                r="1"
                className="fill-muted-foreground/20 dark:fill-muted-foreground/10"
              />
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#dot-pattern-layout)"
          />
        </svg>
      </div>

      {/* 스켈레톤 블록들 */}
      <div className="absolute inset-0">
        {skeletonBlocks.map((block, index) => (
          <div
            key={index}
            className="absolute rounded-lg border border-border bg-card shadow-sm animate-pulse"
            style={{
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${block.height}px`,
              animationDelay: `${block.delay}ms`,
              animationDuration: '2s',
            }}
          >
            {/* 블록 내부 콘텐츠 스켈레톤 */}
            <div className="p-4 space-y-3 h-full">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted/60 rounded w-full"></div>
              <div className="h-3 bg-muted/60 rounded w-5/6"></div>
              {block.height > 120 && (
                <>
                  <div className="h-3 bg-muted/40 rounded w-4/6"></div>
                  <div className="h-3 bg-muted/40 rounded w-full"></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 중앙 로딩 인디케이터 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-foreground">
              캔버스를 로딩하고 있습니다...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateRandomBlocks() {
  const blocks = [];
  const blockCount = 6;

  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: 50 + Math.random() * 800,
      y: 50 + Math.random() * 400,
      width: 200 + Math.random() * 150,
      height: 100 + Math.random() * 100,
      delay: i * 50,
    });
  }

  return blocks;
}

/**
 * 페이지 레이아웃
 *
 * - PageSyncClient: 사이드바 선택 상태 동기화 + 최근 방문 페이지 쿠키 저장
 * - WorkspacePageHeader: Breadcrumb 헤더
 * - Suspense: 페이지 콘텐츠 로딩 관리 (3-4단계 통합)
 */
export default async function PageLayout({
  children,
  params,
}: PageLayoutProps) {
  const { orgId, workspaceId, pageId } = await params;

  return (
    <>
      {/* 사이드바 하이라이트 동기화 + 최근 방문 페이지 쿠키 저장 */}
      <PageSyncClient orgId={orgId} workspaceId={workspaceId} pageId={pageId} />

      <div className="flex flex-col h-full">
        {/* Workspace 헤더 (Breadcrumb) */}
        <WorkspacePageHeader workspaceId={workspaceId} pageId={pageId} />

        {/* 페이지 콘텐츠 with Suspense */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<CanvasLoadingSkeleton />}>{children}</Suspense>
        </div>
      </div>
    </>
  );
}
