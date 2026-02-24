'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Box } from '@workspace/ui/components/ui/box';
import { YoutubeBlockInteractions } from '@/domains/block-management/frontend/components/block/block-type/youtube/config/youtube-block-interactions';
import { YoutubeView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/youtube.view';
import type { YouTubePlayer } from '@/domains/block-management/frontend/components/block/block-type/youtube/core/types';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { BaseBlockView } from '@/domains/block-management/frontend/components/block/base-block/components/base-block-view';
import { DataBlockView } from '@/domains/block-management/frontend/components/block/data-block/components/data-block-view';
import { Content } from '@/domains/block-management/frontend/components/block/base-block/components/content';
import { ResizeControlView } from '@/domains/block-management/frontend/components/block/base-block/components/resize-control.view';
import { HandlesView } from '@/domains/block-management/frontend/components/block/base-block/components/handles.view';
import {
  TUTORIAL_YOUTUBE_PROPERTIES,
  TUTORIAL_MOCK_BLOCK_DATA,
  TUTORIAL_YOUTUBE_VIDEO_ID,
} from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';
import { useTutorialDialogContext } from '../../tutorial-dialog/core/context';
import { InteractionGuard } from '../../common/interaction-guard';
import { MockYoutubeToolbar } from './mock-youtube-toolbar';
import { MockYoutubeActionBar } from './mock-youtube-action-bar';

const NODE_WIDTH = 410;
const NODE_HEIGHT = 288;

/**
 * Tutorial YouTube block node for MockCanvas. Uses tutorial state for URL/showPlayer,
 * shows MockYoutubeToolbar and MockYoutubeActionBar when selected, and marks the
 * URL input with data-tutorial="youtube-url-input" for step 4.
 */
export function TutorialYoutubeBlockNode(props: NodeProps) {
  const { id, data, selected } = props;
  const blockId = (data?.blockId as string) ?? id;
  const blockMountId = (data?.blockMountId as string) ?? id;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const { registerBlockInteractions, unregisterBlockInteractions } =
    useBlockInteraction();

  const {
    tutorialState,
    updateTutorialState,
    completeCurrentStep,
    currentStep,
    lastPlacedNodeIdRef,
  } = useTutorialDialogContext();

  const youtubeUrl = (tutorialState.youtubeUrl as string) ?? TUTORIAL_YOUTUBE_PROPERTIES.url;
  const showPlayer = Boolean(tutorialState.showPlayer);
  const selectedTemplateId = tutorialState.selectedTemplateId as string | null | undefined;
  const lastPlacedNodeId = (tutorialState.lastPlacedNodeId as string) ?? lastPlacedNodeIdRef.current ?? null;
  const isLastPlacedBlock = lastPlacedNodeId !== null && lastPlacedNodeId === blockMountId;

  useEffect(() => {
    const el = containerRef.current?.querySelector('input[type="url"]');
    if (el) {
      el.setAttribute('data-tutorial', 'youtube-url-input');
    }
  }, [showPlayer]);

  const onUrlChange = useCallback(
    (value: string) => {
      updateTutorialState({ youtubeUrl: value || youtubeUrl });
    },
    [updateTutorialState, youtubeUrl]
  );

  const onUrlSubmit = useCallback(() => {
    updateTutorialState({ showPlayer: true });
    const isUrlStep =
      currentStep?.targetSelector === 'youtube-url-input' ||
      currentStep?.interactableSelectors?.includes('youtube-url-input');
    if (isUrlStep) {
      setTimeout(() => completeCurrentStep(), 200);
    }
  }, [updateTutorialState, currentStep, completeCurrentStep]);

  // Register seekTo when block is selected or is the last-placed block so timeline tab can seek.
  // (Panel open/close or focus can leave selected false; lastPlacedNodeId is the source of truth for which block the panel targets.)
  useEffect(() => {
    const shouldRegister = selected || isLastPlacedBlock;
    if (shouldRegister) {
      registerBlockInteractions(blockMountId, {
        seekTo: (seconds: number) => {
          if (typeof (window as any).__TUTORIAL_DEBUG__ !== 'undefined') {
            (window as any).__TUTORIAL_DEBUG__.seekToCalled = {
              blockMountId,
              seconds,
              hasPlayer: !!playerRef.current,
            };
          }
          YoutubeBlockInteractions.seekTo(playerRef, seconds);
        },
      });
    }
    return () => unregisterBlockInteractions(blockMountId);
  }, [
    selected,
    isLastPlacedBlock,
    blockMountId,
    registerBlockInteractions,
    unregisterBlockInteractions,
  ]);

  const handlePlayerReady = useCallback(
    (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target;
    },
    []
  );

  const renderOriginalView = () => (
    <YoutubeView
      url={showPlayer ? youtubeUrl : ''}
      isLoading={false}
      hasError={false}
      draftUrl={youtubeUrl}
      showPlayer={showPlayer}
      isIframeLoading={false}
      selected={selected}
      properties={{
        ...TUTORIAL_YOUTUBE_PROPERTIES,
        url: showPlayer ? youtubeUrl : '',
      }}
      thumbnailUrl={TUTORIAL_YOUTUBE_PROPERTIES.youtubeThumbnail}
      videoId={TUTORIAL_YOUTUBE_VIDEO_ID}
      inputRef={inputRef}
      onUrlChange={(e) => onUrlChange(e.target.value)}
      onUrlSubmit={async (e) => {
        e?.preventDefault();
        onUrlSubmit();
      }}
      onUrlKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onUrlSubmit();
        }
      }}
      onPlayerReady={handlePlayerReady}
      onImageLoad={() => { }}
      onImageError={() => { }}
    />
  );

  const blockData = {
    ...TUTORIAL_MOCK_BLOCK_DATA,
    blockId,
    blockMountId,
    properties: {
      ...TUTORIAL_YOUTUBE_PROPERTIES,
      url: youtubeUrl,
    },
  };

  return (
    <InteractionGuard selector="block-node">
      <Box ref={containerRef} className="relative" data-tutorial="youtube-block">
        {selected && (
          <>
            <MockYoutubeToolbar
              width={NODE_WIDTH}
              blockId={blockId}
              blockMountId={blockMountId}
            />
            <MockYoutubeActionBar />
          </>
        )}
        <BaseBlockView
          data={blockData as any}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          draggable={false}
          onMouseEnter={() => { }}
          onMouseMove={() => { }}
          onMouseLeave={() => { }}
          showAddButtonZones={false}
          setHoverDirection={() => { }}
        >
          <ResizeControlView
            nodeId={blockMountId}
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
              data={blockData as any}
              renderOriginalView={renderOriginalView}
              selected={selected}
            />
          </Content>
        </BaseBlockView>
      </Box>
    </InteractionGuard>
  );
}
