'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
import { WorkspaceIcon, IconPicker } from '../shared/icon-picker';
import { SidebarTrigger } from '@workspace/ui/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useUpdatePageIcon } from '../../hooks/use-update-page-icon';
import { useUpdatePageTitle } from '../../hooks/use-update-page-title';
import { PublishFlow } from '@/domains/share/frontend/components/publish-flow';

interface WorkspacePageHeaderProps {
  pageId?: string;
  workspaceId?: string;
  isPublishable?: boolean;
}

/**
 * EditablePageTitle 컴포넌트
 *
 * 페이지 제목 인라인 편집 (TanStack Query Optimistic Update)
 * - 클릭하면 인풋으로 전환
 * - Enter/Blur 시 저장
 * - ESC 시 취소
 */
interface EditablePageTitleProps {
  title: string;
  pageId: string;
}

function EditablePageTitle({ title, pageId }: EditablePageTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // TanStack Query mutation (context의 optimistic update 사용)
  const updateTitleMutation = useUpdatePageTitle();

  // title이 변경되면 editValue 리셋
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  // 편집 모드 진입 시 포커스 및 텍스트 선택
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();

    // 빈 값이거나 변경 없으면 취소
    if (!trimmedValue || trimmedValue === title) {
      setIsEditing(false);
      setEditValue(title);
      return;
    }

    // Trigger mutation (WorkspaceContext가 optimistic update 처리)
    updateTitleMutation.mutate(
      { pageId, newTitle: trimmedValue },
      {
        onSuccess: () => {
          // 성공 시 편집 모드 종료
          setIsEditing(false);
        },
        onError: () => {
          // 에러 시 값 복원 및 편집 모드 유지
          setEditValue(title);
          setIsEditing(true);
        },
      }
    );

    // 즉시 편집 모드 종료 (optimistic)
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={updateTitleMutation.isPending}
        className="h-6 px-2 py-0 text-sm border-0 focus-visible:ring-1 focus-visible:ring-ring bg-transparent max-w-[200px]"
        maxLength={100}
      />
    );
  }

  return (
    <BreadcrumbPage
      className={cn(
        'truncate max-w-[200px] cursor-text',
        'hover:bg-accent hover:text-accent-foreground rounded-sm px-1 -mx-1 transition-colors'
      )}
      onClick={() => setIsEditing(true)}
      title="클릭하여 페이지명 수정"
    >
      {title}
    </BreadcrumbPage>
  );
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
  isPublishable = true,
}: WorkspacePageHeaderProps) {
  const context = useWorkspace();

  // TanStack Query mutation for icon update (context의 optimistic update 사용)
  const updateIconMutation = useUpdatePageIcon();

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
  }, [actualPageId, context.findPageById, context.workspaces]);

  const workspaceName = workspace?.name || 'Workspace';
  const workspaceIcon = workspace?.icon || null;

  // Breadcrumb이 너무 길면 축약 (depth > 2)
  const shouldTruncate = ancestorPath.length > 2;

  // 표시할 ancestors 계산 (마지막 1-2개만)
  const displayedAncestors = shouldTruncate
    ? ancestorPath.slice(-1) // 길면 마지막 1개만
    : ancestorPath; // 짧으면 전체 표시

  // 워크스페이스 링크 URL 계산 (첫 번째 페이지로)
  const workspaceUrl = useMemo(() => {
    if (!workspace || !actualWorkspaceId) {
      return `/r/${context.organizationId}/workspace/${actualWorkspaceId}`;
    }

    // 워크스페이스의 첫 번째 페이지로 이동
    const firstPage = workspace.pageTree[0];
    if (firstPage) {
      return `/r/${context.organizationId}/workspace/${actualWorkspaceId}/page/${firstPage.id}`;
    }

    // 페이지가 없으면 워크스페이스 루트로
    return `/r/${context.organizationId}/workspace/${actualWorkspaceId}`;
  }, [workspace, actualWorkspaceId, context.organizationId]);

  // 페이지 아이콘 변경 핸들러 (WorkspaceContext가 optimistic update 처리)
  const handleIconChange = (newIcon: string) => {
    if (!actualPageId) return;

    // Trigger mutation (WorkspaceContext가 optimistic update 처리)
    updateIconMutation.mutate({
      pageId: actualPageId,
      newIcon,
    });
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3 overflow-hidden">
        {/* Sidebar toggle button */}
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 shrink-0"
        />

        {/* Breadcrumb */}
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList>
            {/* Workspace */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={workspaceUrl} className="flex items-center gap-1.5">
                  <WorkspaceIcon icon={workspaceIcon} size={16} />
                  <span className="truncate max-w-[150px]">
                    {workspaceName}
                  </span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Page Path (depth 축약 처리) */}
            {page && (
              <>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>

                {/* Ancestor path가 길면 ellipsis 표시 (생략된 페이지 표시) */}
                {shouldTruncate && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  </>
                )}

                {/* 표시할 ancestors 렌더링 */}
                {displayedAncestors.map(ancestor => (
                  <React.Fragment key={ancestor.id}>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          href={`/r/${context.organizationId}/workspace/${actualWorkspaceId}/page/${ancestor.id}`}
                          className="truncate max-w-[100px]"
                        >
                          {ancestor.title}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  </React.Fragment>
                ))}

                {/* 현재 Page - 아이콘 + 제목 */}
                <BreadcrumbItem>
                  <div className="flex items-center gap-1.5">
                    <IconPicker
                      value={page.icon || undefined}
                      onChange={handleIconChange}
                      storageKey="page-icon-picker-recent"
                      trigger={
                        <button
                          type="button"
                          className={cn(
                            'inline-flex items-center justify-center rounded-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            'h-5 w-5 -ml-0.5 text-foreground'
                          )}
                          title="페이지 아이콘 변경"
                        >
                          <WorkspaceIcon
                            icon={page.icon}
                            size={16}
                            className="text-current"
                          />
                        </button>
                      }
                    />
                    <EditablePageTitle title={page.title} pageId={page.id} />
                  </div>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {actualPageId && (
        <div className="flex items-center gap-2 pr-3">
          <PublishFlow pageId={actualPageId} isPublishable={isPublishable} />
        </div>
      )}
    </header>
  );
}
