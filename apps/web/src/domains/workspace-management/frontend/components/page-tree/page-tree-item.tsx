// apps/web/src/domains/workspace-management/frontend/components/page-tree/page-tree-item.tsx
'use client';

import React from 'react';
import type { ItemInstance } from '@headless-tree/core';
import { TreeItem, TreeItemLabel } from '@workspace/ui/components/ui/tree';
import { Button } from '@workspace/ui/components/ui/button';
import { FileText } from 'lucide-react';
import type { PageTreeItem } from './types';
import { PageTreeControls } from './page-tree-controls';

interface PageTreeItemProps {
  item: ItemInstance<PageTreeItem>;
  onToggle?: (pageId: string) => void;
}

/**
 * Page Tree Item
 *
 * 개별 페이지 아이템 렌더링
 * (ExplorerTree의 TreeItemRenderer + TreeItemContent 레거시 디자인 적용)
 */
export function PageTreeItemRenderer({ item, onToggle }: PageTreeItemProps) {
  const page = item.getItemData();
  const hasChildren = (page?.children?.length ?? 0) > 0;

  if (!page) return null;

  return (
    <TreeItem item={item} asChild className="pb-0!">
      <div className="flex items-center rounded-none py-0.5 w-full gap-0">
        {/* Chevron Controls */}
        <PageTreeControls
          item={item}
          hasChildren={hasChildren}
          onToggle={onToggle}
        />

        {/* Content */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="min-h-6 flex flex-1 min-w-0 items-center justify-start gap-1.5 overflow-hidden rounded-sm px-0.5 py-1 text-left cursor-pointer has-[>svg]:px-2 bg-transparent"
          onDoubleClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <TreeItemLabel
            showChevron={false}
            className="flex min-w-0 w-full grow items-center justify-start gap-1.5 text-left not-in-data-[folder=true]:ps-5"
          >
            {/* 페이지 아이콘 */}
            {page.icon ? (
              <span className="ml-1 text-muted-foreground/80 text-base leading-none">
                {page.icon}
              </span>
            ) : (
              <FileText className="size-3.5 text-muted-foreground pointer-events-none" />
            )}

            {/* 페이지 제목 */}
            <span className="truncate text-xs">{page.title}</span>
          </TreeItemLabel>
        </Button>
      </div>
    </TreeItem>
  );
}
