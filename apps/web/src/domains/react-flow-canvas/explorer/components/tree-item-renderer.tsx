'use client';

import React from 'react';
import { TreeItem } from '@workspace/ui/components/ui/tree';
import { useExplorerTreeContext } from '../explorer-tree-context';
import { TreeControls } from './tree-controls';
import { TreeItemContent } from './tree-item-content';

interface TreeItemRendererProps {
  item: any; // Headless Tree item type
}

export function TreeItemRenderer({ item }: TreeItemRendererProps) {
  const { renderFileIcon } = useExplorerTreeContext();
  const hasChildren = (item.getItemData()?.children?.length ?? 0) > 0;

  return (
    <TreeItem item={item} asChild className="pb-0!">
      <div className="flex items-center rounded-none py-0.5 w-full gap-0">
        <TreeControls item={item} hasChildren={hasChildren} />
        <TreeItemContent item={item} renderFileIcon={renderFileIcon} />
      </div>
    </TreeItem>
  );
}
