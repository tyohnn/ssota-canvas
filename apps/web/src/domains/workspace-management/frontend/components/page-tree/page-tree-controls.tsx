// apps/web/src/domains/workspace-management/frontend/components/page-tree/page-tree-controls.tsx
'use client';

import React from 'react';
import type { ItemInstance } from '@headless-tree/core';
import { ChevronDown } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import type { PageTreeItem } from './types';

interface PageTreeControlsProps {
  item: ItemInstance<PageTreeItem>;
  hasChildren: boolean;
  onToggle?: (pageId: string) => void;
}

/**
 * Page Tree Controls
 *
 * Chevron 아이콘 및 펼치기/접기 제어
 * (ExplorerTree의 TreeControls 레거시 디자인 적용)
 */
export function PageTreeControls({
  item,
  hasChildren,
  onToggle,
}: PageTreeControlsProps) {
  if (!hasChildren) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="size-4 p-0 has-[>svg]:p-0 h-4 w-4 rounded-sm text-muted-foreground hover:bg-transparent active:bg-transparent cursor-pointer"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        if (item.isExpanded()) {
          item.collapse();
        } else {
          item.expand();
        }
        // Context 업데이트 (로컬스토리지 저장)
        onToggle?.(item.getId());
      }}
      aria-label={item.isExpanded() ? 'Collapse' : 'Expand'}
    >
      <ChevronDown
        className="size-4 transition-transform"
        style={{
          transform: item.isExpanded() ? undefined : 'rotate(-90deg)',
        }}
      />
    </Button>
  );
}
