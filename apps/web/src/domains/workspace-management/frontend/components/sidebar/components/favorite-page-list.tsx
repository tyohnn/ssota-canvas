'use client';

import React from 'react';
import { Star } from 'lucide-react';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import { cn } from '@/lib/utils';

interface FavoritePageListProps {
  pages: PageTreeNodeDTO[];
}

/**
 * Favorite Page List
 *
 * 즐겨찾기한 페이지 목록 (사이드바 최상단)
 */
export function FavoritePageList({ pages }: FavoritePageListProps) {
  const { selectedPageId, selectPage, workspaces } = useWorkspace();

  const handlePageClick = (page: PageTreeNodeDTO) => {
    // 페이지가 속한 Workspace 찾기
    for (const workspace of workspaces) {
      const findPageInTree = (pages: PageTreeNodeDTO[]): boolean => {
        for (const p of pages) {
          if (p.id === page.id) return true;
          if (p.children && findPageInTree(p.children)) return true;
        }
        return false;
      };

      if (findPageInTree(workspace.pageTree)) {
        selectPage(page.id, workspace.workspaceId);
        return;
      }
    }
  };

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => handlePageClick(page)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            selectedPageId === page.id && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
        >
          {page.icon ? (
            <span className="text-base">{page.icon}</span>
          ) : (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
          <span className="truncate">{page.title}</span>
        </button>
      ))}
    </div>
  );
}
