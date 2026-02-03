'use client';

import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Box } from '@workspace/ui/components/ui/box';
import { BlockToolbarView } from '@/domains/block-management/frontend/components/block/data-block/components/block-toolbar.view';
import { BlockHeaderView } from '@/domains/block-management/frontend/components/block/data-block/components/block-header/components/block-header-view';
import { YoutubeToolbarItemsView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/toolbar-items/youtube-toolbar-items.view';
import { ViewModeToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';
import { InteractionGuard } from '../../common/interaction-guard';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';

interface MockYoutubeToolbarProps {
  width?: number;
  blockId: string;
  blockMountId: string;
  onOpenEditorPanel?: () => void;
}

/**
 * Tutorial mock toolbar for YouTube block. Details button is wrapped in
 * InteractionGuard(editor-panel-button) and opens the editor panel on click.
 */
export function MockYoutubeToolbar({
  width = 410,
  blockId,
  blockMountId,
  onOpenEditorPanel,
}: MockYoutubeToolbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { updateTutorialState } = useTutorialDialogContext();

  const handleDetailsClick = () => {
    updateTutorialState({ editorPanelOpen: true });
    onOpenEditorPanel?.();
  };

  const headerContent = (
    <BlockHeaderView
      title={TUTORIAL_YOUTUBE_PROPERTIES.youtubeTitle ?? 'YouTube Video'}
      blockType="youtube"
      width={width}
      onTitleChange={() => { }}
      onKeyDown={() => { }}
      onBlur={() => { }}
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
        url={TUTORIAL_YOUTUBE_PROPERTIES.url}
        disabled={false}
      />
      <Separator orientation="vertical" className="h-4!" />
      <ViewModeToolbarItem
        blockType="youtube"
        currentViewMode="original"
        onViewModeChange={() => { }}
        zoom={1}
      />
      <InteractionGuard selector="editor-panel-button">
        <Box onMouseDown={(e) => e.stopPropagation()}>
          <ToolbarIconButton
            icon={<ChevronRight />}
            tooltip="Details"
            tooltipSide="top"
            tooltipOffset={5}
            onClick={handleDetailsClick}
            className="h-6 w-6 p-0 rounded-sm"
            iconClassName="size-3.5"
          />
        </Box>
      </InteractionGuard>
    </>
  );

  return (
    <BlockToolbarView
      headerContent={headerContent}
      toolbarItems={toolbarItems}
    />
  );
}
