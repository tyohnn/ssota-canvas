'use client';

import React, { useMemo } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { TreeItemLabel } from '@workspace/ui/components/ui/tree';
import { useExplorerTreeContext } from '../explorer-tree-context';

interface TreeItemContentProps {
  item: any; // Headless Tree item type
  renderFileIcon?: (
    type: string | undefined,
    className: string,
    item?: any
  ) => React.ReactNode;
}

export function TreeItemContent({
  item,
  renderFileIcon,
}: TreeItemContentProps) {
  const { getName, idToItem } = useExplorerTreeContext();
  const hasChildren = (item.getItemData()?.children?.length ?? 0) > 0;

  // 최신 SSOT에서 이름을 직접 읽어오기
  const currentName = useMemo(() => {
    const itemId = item.getId();
    const sourceItem = idToItem.get(itemId);
    if (sourceItem) {
      return getName(sourceItem);
    }
    // fallback: 캐시된 이름 사용
    return item.getItemName();
  }, [item, getName, idToItem]);

  return (
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
        {hasChildren ? (
          <span className="ml-1 text-muted-foreground/80">
            {item.isExpanded() ? (
              <FolderOpen className="size-3.5" />
            ) : (
              <Folder className="size-3.5" />
            )}
          </span>
        ) : renderFileIcon ? (
          renderFileIcon(
            item.getItemData()?.itemType,
            'text-muted-foreground pointer-events-none size-3.5'
          )
        ) : null}
        <span className="truncate text-xs">{currentName}</span>
      </TreeItemLabel>
    </Button>
  );
}
