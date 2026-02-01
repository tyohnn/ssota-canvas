/**
 * More Menu View Component
 *
 * Presentational component: Renders the more menu dropdown
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */

'use client';

import { Copy, Edit, EllipsisVertical, Trash2, Ungroup } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/ui/dropdown-menu';

import { PageMovePopover } from '../../../block-original-toolbar/components/page-move-popover';
import type { MoreMenuBusinessLogic } from '../core/types';

export interface MoreMenuViewProps {
  blockMountId: string;
  business: MoreMenuBusinessLogic;
  parentBlockMountId?: string;
  /** PageMovePopover 표시 여부 (기본: true). Mock 환경에서는 false로 설정 */
  showPageMove?: boolean;
}

export function MoreMenuView({
  blockMountId,
  business,
  parentBlockMountId,
  showPageMove = true,
}: MoreMenuViewProps): React.JSX.Element {
  const showUngroup = Boolean(parentBlockMountId && business.handleUngroup);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarIconButton
          icon={<EllipsisVertical />}
          tooltip="More"
          tooltipSide="top"
          tooltipOffset={5}
          className="h-6 w-6 p-0 rounded-sm"
          iconClassName="size-3.5"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="right" className="w-48">
        <DropdownMenuItem onClick={business.handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem onClick={business.handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>

        {/* 페이지 옮기기 */}
        {showPageMove && <PageMovePopover blockMountId={blockMountId} />}

        {/* <DropdownMenuItem onClick={business.handleCreateComponent}>
          <Edit className="h-4 w-4 mr-2" />
          Create Component
        </DropdownMenuItem> */}

        {showUngroup && (
          <DropdownMenuItem onClick={business.handleUngroup}>
            <Ungroup className="h-4 w-4 mr-2" />
            Ungroup
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={business.handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
