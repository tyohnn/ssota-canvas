'use client';

import { useRef } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { YoutubeView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/youtube.view';
import { BaseBlockView } from '@/domains/block-management/frontend/components/block/base-block/components/base-block-view';
import { DataBlockView } from '@/domains/block-management/frontend/components/block/data-block/components/data-block-view';
import { Content } from '@/domains/block-management/frontend/components/block/base-block/components/content';
import { ResizeControlView } from '@/domains/block-management/frontend/components/block/base-block/components/resize-control.view';
import { HandlesView } from '@/domains/block-management/frontend/components/block/base-block/components/handles.view';
import {
  TUTORIAL_YOUTUBE_PROPERTIES,
  TUTORIAL_MOCK_BLOCK_DATA,
  TUTORIAL_YOUTUBE_VIDEO_ID,
} from '../../config/tutorial-mock-data';
import { useMockYoutubeBlock } from './core/use-mock-youtube-block';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';
import { InteractionGuard } from '../common/interaction-guard';
import { TutorialStartOverlay } from '../common/tutorial-start-overlay';
import { TutorialStepOverlay } from '../common/tutorial-step-overlay';

/**
 * Mock YouTube Block (Container)
 *
 * Tutorial-specific mock component using real YoutubeView and BaseBlockView
 * Pattern based on landing page SummarizeYoutubeBlock
 */
export function MockYoutubeBlock() {
  const { url, showPlayer, onUrlChange, onUrlSubmit } = useMockYoutubeBlock();
  const { currentTutorial, currentStepIndex, startTutorial } =
    useTutorialDialogContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const nodeWidth = 410;
  const nodeHeight = 288;

  const showStartOverlay = currentStepIndex === -1;
  const showStepOverlay = currentStepIndex >= 0;

  // Use tutorial state for URL if available, otherwise use mock data
  const displayUrl = url || TUTORIAL_YOUTUBE_PROPERTIES.url;
  const displayShowPlayer = showPlayer || false;

  // Render original view using real YoutubeView
  const renderOriginalView = () => (
    <YoutubeView
      url={displayUrl}
      isLoading={false}
      hasError={false}
      draftUrl={url}
      showPlayer={displayShowPlayer}
      isIframeLoading={false}
      selected={false}
      properties={{
        ...TUTORIAL_YOUTUBE_PROPERTIES,
        url: displayUrl,
      }}
      thumbnailUrl={TUTORIAL_YOUTUBE_PROPERTIES.youtubeThumbnail}
      videoId={TUTORIAL_YOUTUBE_VIDEO_ID}
      inputRef={inputRef}
      onUrlChange={(e) => onUrlChange(e.target.value)}
      onUrlSubmit={async (e) => {
        e?.preventDefault?.();
        onUrlSubmit();
      }}
      onUrlKeyDown={(e) => {
        if (e?.key === 'Enter') {
          e?.preventDefault?.();
          onUrlSubmit();
        }
      }}
      onPlayerReady={() => { }}
      onImageLoad={() => { }}
      onImageError={() => { }}
    />
  );

  return (
    <InteractionGuard selector="youtube-block">
      <Box className="relative">
        {/* Tutorial Start Overlay */}
        {showStartOverlay && currentTutorial && (
          <TutorialStartOverlay
            title={currentTutorial.name}
            description={currentTutorial.description}
            onStart={startTutorial}
          />
        )}

        {/* Tutorial Step Overlay */}
        {showStepOverlay && <TutorialStepOverlay />}

        <BaseBlockView
          data={TUTORIAL_MOCK_BLOCK_DATA as any}
          width={nodeWidth}
          height={nodeHeight}
          draggable={false}
          onMouseEnter={() => { }}
          onMouseMove={() => { }}
          onMouseLeave={() => { }}
          showAddButtonZones={false}
          setHoverDirection={() => { }}
        >
          <ResizeControlView
            nodeId={TUTORIAL_MOCK_BLOCK_DATA.blockMountId}
            show={false}
            keepAspectRatio={true}
            onResizeStart={() => { }}
            onResizeEnd={async () => { }}
          />

          <HandlesView
            isConnectable={false}
            showLeft={false}
            showRight={false}
            showTop={false}
            showBottom={false}
          />

          <Content textColorClass="">
            <DataBlockView
              viewMode="original"
              data={TUTORIAL_MOCK_BLOCK_DATA as any}
              renderOriginalView={renderOriginalView}
              selected={false}
            />
          </Content>
        </BaseBlockView>
      </Box>
    </InteractionGuard>
  );
}
