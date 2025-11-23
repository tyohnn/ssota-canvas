// apps/web/src/domains/workspace-management/frontend/components/page-tree/page-tree-item.tsx
'use client';

import React, { useState } from 'react';
import type { ItemInstance } from '@headless-tree/core';
import { TreeItem } from '@workspace/ui/components/ui/tree';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageTreeItem } from './types';
import { WorkspaceIcon } from '../shared/icon-picker';
import { useWorkspace } from '../../index';
import { PageContextMenu } from './page-context-menu';

interface PageTreeItemProps {
  item: ItemInstance<PageTreeItem>;
  onToggle?: (pageId: string) => void;
  selectedPageId?: string | null;
}

/**
 * Page Tree Item
 *
 * 개별 페이지 아이템 렌더링
 * Workspace Item과 동일한 디자인 패턴:
 * - 호버 시 아이콘 → 쉐브론 전환
 * - 쉐브론 클릭 시 펼치기/접기 (호버 시 액센트 표시)
 * - + 버튼으로 하위 페이지 생성
 * - 아이템 클릭 시 페이지로 이동
 * - 활성(선택된) 페이지는 배경색과 텍스트 색상으로 구분
 */
export function PageTreeItemRenderer({
  item,
  onToggle,
  selectedPageId,
}: PageTreeItemProps) {
  const page = item.getItemData();
  const hasChildren = (page?.children?.length ?? 0) > 0;
  const isExpanded = item.isExpanded();
  const {
    createPage,
    selectPage,
    selectedPageId: contextSelectedPageId,
  } = useWorkspace();
  const [isHovered, setIsHovered] = useState(false);
  const [isChevronHovered, setIsChevronHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // selectedPageId prop이 없으면 context에서 가져옴
  const actualSelectedPageId = selectedPageId ?? contextSelectedPageId;
  const isActive = actualSelectedPageId === page?.pageId;

  if (!page) return null;

  // 쉐브론 클릭: 펼치기/접기 (자식이 없어도 항상 동작)
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isExpanded) {
      item.collapse();
    } else {
      item.expand();
    }

    // Context 업데이트 (로컬스토리지 저장)
    onToggle?.(item.getId());
  };

  // + 버튼 클릭: 하위 페이지 생성
  const handleCreateSubPage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!page.workspaceId) return;

    await createPage(page.workspaceId, page.pageId);
  };

  // 페이지 클릭: 페이지로 이동
  const handlePageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!page.workspaceId || !page.pageId) return;

    selectPage(page.pageId, page.workspaceId);
  };

  return (
    <>
      <TreeItem item={item} className="pb-0!">
        <div
          className={cn(
            'flex items-center rounded-sm py-0.5 w-full gap-0',
            'border border-transparent transition-all',
            item.isDragTarget()
              ? 'bg-primary/10 border-primary border-dashed'
              : isActive
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/70'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 아이콘/Chevron 영역 */}
          <div className="flex items-center gap-1.5 px-2 py-1 flex-1 min-w-0">
            {/* 아이콘/Chevron 컨테이너 (고정 너비) */}
            <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
              {/* 페이지 아이콘 (기본 표시, 아이템 호버 시 숨김) */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity',
                  isHovered ? 'opacity-0' : 'opacity-100'
                )}
              >
                <WorkspaceIcon
                  icon={page.icon || 'File'}
                  size={16}
                  className={cn(
                    isActive
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                />
              </div>

              {/* Chevron (기본 숨김, 아이템 호버 시 표시) - div로 변경하여 button 중첩 방지 */}
              <div
                onClick={handleToggle}
                onMouseEnter={() => setIsChevronHovered(true)}
                onMouseLeave={() => setIsChevronHovered(false)}
                className={cn(
                  'absolute inset-0 w-full h-full flex items-center justify-center transition-all rounded-[2px] cursor-pointer',
                  isChevronHovered && 'bg-accent'
                )}
                style={{ opacity: isHovered ? 1 : 0 }}
                role="button"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                tabIndex={-1}
              >
                <ChevronDown
                  className={cn(
                    'w-full h-full transition-all',
                    isActive
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground',
                    !isExpanded && '-rotate-90'
                  )}
                />
              </div>
            </div>

            {/* 페이지 제목 - 클릭 시 페이지 이동 */}
            <div
              className={cn(
                'truncate text-sm font-medium tracking-wide cursor-pointer flex-1 text-left',
                isActive ? 'text-accent-foreground' : 'text-muted-foreground'
              )}
              onClick={handlePageClick}
            >
              {page.title}
            </div>
          </div>

          {/* 오른쪽 액션 버튼들 (아이템 호버 시 표시) */}
          <div className="shrink-0 pr-2 flex items-center gap-0.5">
            {/* 삼점 설정 버튼 (컨텍스트 메뉴) */}
            <PageContextMenu
              page={{
                id: page.pageId,
                title: page.title,
                icon: page.icon ?? null,
                children: [],
                depth: page.depth,
                isFavorite: page.isFavorite,
                lastModified: page.lastModified,
                parentId: page.parentId,
                order: page.order,
              }}
              onOpenChange={setIsMenuOpen}
              isParentHovered={isHovered}
            />

            {/* + 버튼 */}
            <div
              className={cn(
                'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent cursor-pointer',
                isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'
              )}
              onClick={handleCreateSubPage}
              role="button"
              aria-label="Add subpage"
              tabIndex={-1}
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </TreeItem>

      {/* Show empty message when expanded with no children */}
      {isExpanded && !hasChildren && (
        <div
          className="text-xs text-muted-foreground/60 py-1"
          style={{
            paddingLeft: `calc(${item.getItemMeta().level * 8}px + 8px + 8px + 16px - 2px)`,
          }}
        >
          No subpages.
        </div>
      )}
    </>
  );
}
