'use client';

import React, { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { useWorkspace } from '../../hooks/use-workspace';
import { WorkspaceIcon } from '../shared/icon-picker';

interface WorkspacePageHeaderProps {
  pageId?: string;
  workspaceId?: string;
}

/**
 * WorkspacePageHeader 컴포넌트
 *
 * Workspace와 Page의 Breadcrumb 표시
 * - SSOTA 브랜딩
 * - Workspace 이름 + 아이콘 (Lucide 동적 렌더링)
 * - Page 제목 (선택사항)
 * - Depth가 길면 축약 표시 (ellipsis)
 *
 * 레거시 workspace-header.tsx 기반으로 확장
 */
export function WorkspacePageHeader({
  pageId: propPageId,
  workspaceId: propWorkspaceId,
}: WorkspacePageHeaderProps) {
  const context = useWorkspace();

  // Props 우선, 없으면 Context fallback
  const actualPageId = propPageId ?? context.selectedPageId;
  const actualWorkspaceId = propWorkspaceId ?? context.selectedWorkspaceId;

  // Workspace 찾기
  const workspace = context.workspaces.find(
    ws => ws.workspaceId === actualWorkspaceId
  );

  // Page 찾기 및 ancestor path 계산 (기존 로직)
  const { page, ancestorPath } = useMemo(() => {
    if (!actualPageId) return { page: null, ancestorPath: [] };

    const foundPage = context.findPageById(actualPageId);
    if (!foundPage) return { page: null, ancestorPath: [] };

    // Ancestor path 계산 (depth가 긴 경우)
    const path: Array<{ id: string; title: string }> = [];
    let currentPage = foundPage;

    // 부모 페이지들을 역으로 추적
    while (currentPage.parentId && path.length < 10) {
      // 최대 10단계
      const parent = context.findPageById(currentPage.parentId);
      if (!parent) break;
      path.unshift({ id: parent.id, title: parent.title });
      currentPage = parent;
    }

    return { page: foundPage, ancestorPath: path };
  }, [actualPageId, context.findPageById]);

  const workspaceName = workspace?.name || 'Workspace';
  const workspaceIcon = workspace?.icon || null;

  // Breadcrumb이 너무 길면 축약 (depth > 2)
  const shouldTruncate = ancestorPath.length > 2;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3 overflow-hidden">
        {/* SSOTA 브랜딩 */}
        <p className="font-semibold text-sm shrink-0">SSOTA</p>

        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 shrink-0"
        />

        {/* Breadcrumb */}
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList>
            {/* Workspace */}
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/r/${workspace?.workspaceId || actualWorkspaceId}`}
                className="flex items-center gap-1.5"
              >
                <WorkspaceIcon icon={workspaceIcon} size={16} />
                <span className="truncate max-w-[150px]">{workspaceName}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Page Path (depth 축약 처리) */}
            {page && (
              <>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>

                {/* Ancestor path가 길면 ellipsis 표시 */}
                {shouldTruncate && ancestorPath.length > 0 && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  </>
                )}

                {/* 마지막 1-2개 ancestor만 표시 */}
                {ancestorPath.slice(-1).map((ancestor, index) => (
                  <React.Fragment key={ancestor.id}>
                    {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/r/${actualWorkspaceId}/page/${ancestor.id}`}
                        className="truncate max-w-[100px]"
                      >
                        {ancestor.title}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  </React.Fragment>
                ))}

                {/* 현재 Page */}
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-[200px]">
                    {page.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
