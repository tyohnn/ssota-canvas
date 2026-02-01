/**
 * Mock Youtube Block Toolbar
 *
 * 공통 툴바 - summarize와 structure 탭 모두에서 사용
 * BlockToolbarView + BlockHeaderView + YoutubeToolbarItemsView + ViewMode + Details + MoreMenu
 */

'use client';

import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Separator } from '@/components/ui/separator';
import { BlockToolbarView } from '@/domains/block-management/frontend/components/block/data-block/components/block-toolbar.view';
import { BlockHeaderView } from '@/domains/block-management/frontend/components/block/data-block/components/block-header/components/block-header-view';
import { YoutubeToolbarItemsView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/toolbar-items/youtube-toolbar-items.view';
import { ViewModeToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items';
import { MoreMenuView } from '@/domains/block-management/frontend/components/block/common-toolbar-items/more-menu-toolbar-item/components/more-menu-view';

const MOCK_TITLE = 'Product Strategy.mp4';
const MOCK_URL = 'https://www.youtube.com/watch?v=0kARDVL2nZg';

interface MockYoutubeBlockToolbarProps {
  title?: string;
  width?: number;
  url?: string;
  blockId?: string;
  blockMountId?: string;
  viewMode?: 'original' | 'note' | 'card';
  onViewModeChange?: (mode: 'original' | 'note' | 'card') => void;
}

export function MockYoutubeBlockToolbar({
  title = MOCK_TITLE,
  width = 400,
  url = MOCK_URL,
  blockId = 'mock-block-id',
  blockMountId,
  viewMode = 'original',
  onViewModeChange,
}: MockYoutubeBlockToolbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const headerContent = (
    <BlockHeaderView
      title={title}
      blockType="youtube"
      width={width}
      onTitleChange={() => {}}
      onKeyDown={() => {}}
      onBlur={() => {}}
      inputRef={inputRef}
      isUpdating={false}
      readonly={true}
      showBadge={width > 400}
    />
  );

  const toolbarItems = (
    <>
      <YoutubeToolbarItemsView
        blockId={blockId}
        url={url}
        disabled={false}
      />
      <Separator orientation="vertical" className="h-4!" />
      <ViewModeToolbarItem
        blockType="youtube"
        currentViewMode={viewMode}
        onViewModeChange={onViewModeChange ?? (() => {})}
        zoom={1}
      />
      <ToolbarIconButton
        icon={<ChevronRight />}
        tooltip="Details"
        tooltipSide="top"
        tooltipOffset={5}
        onClick={() => {}}
        onMouseDown={e => e.stopPropagation()}
        className="h-6 w-6 p-0 rounded-sm"
        iconClassName="size-3.5"
      />
      {blockMountId != null && (
        <>
          <Separator orientation="vertical" className="h-4!" />
          <MoreMenuView
            blockMountId={blockMountId}
            business={{
              handleEdit: () => {},
              handleDuplicate: async () => {},
              handleCreateComponent: () => {},
              handleDelete: async () => {},
            }}
            showPageMove={false}
          />
        </>
      )}
    </>
  );

  return (
    <BlockToolbarView
      headerContent={headerContent}
      toolbarItems={toolbarItems}
    />
  );
}
