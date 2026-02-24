/**
 * Block Context Menu Component
 *
 * Wraps block content with a right-click context menu (Edit, Duplicate, Move to Page, Ungroup, Delete).
 * Works on all blocks regardless of selection state.
 */

'use client';

import { useEffect, useState } from 'react';
import { Copy, Edit, Trash2, Ungroup } from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@workspace/ui/components/ui/context-menu';

import { PageMovePopover } from '../../block-original-toolbar/components/page-move-popover';
import { useMoreMenu } from '../../common-toolbar-items/more-menu-toolbar-item/core/use-more-menu';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface BlockContextMenuProps {
  data: BlockNodeData;
  readonly: boolean;
  width?: number;
  height?: number;
  children: React.ReactNode;
}

export function BlockContextMenu({
  data,
  readonly,
  width,
  height,
  children,
}: BlockContextMenuProps): React.JSX.Element {
  const { business } = useMoreMenu({
    blockId: data.blockId,
    blockMountId: data.blockMountId,
    width,
    height,
    parentBlockMountId: data.parentBlockMountId,
  });

  const showUngroup = Boolean(data.parentBlockMountId && business.handleUngroup);

  const [duplicateShortcut, setDuplicateShortcut] = useState<string>('Ctrl+D');
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const isMac =
      ('userAgentData' in navigator &&
        (navigator.userAgentData as { platform?: string }).platform
          ?.toLowerCase()
          .includes('mac')) ??
      navigator.userAgent.toLowerCase().includes('mac');
    setDuplicateShortcut(isMac ? '⌘D' : 'Ctrl+D');
  }, []);

  if (readonly) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={business.handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </ContextMenuItem>

        <ContextMenuItem onClick={business.handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
          <ContextMenuShortcut>{duplicateShortcut}</ContextMenuShortcut>
        </ContextMenuItem>

        <PageMovePopover blockMountId={data.blockMountId} />

        {showUngroup && (
          <ContextMenuItem onClick={business.handleUngroup}>
            <Ungroup className="h-4 w-4 mr-2" />
            Ungroup
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={business.handleDelete}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
