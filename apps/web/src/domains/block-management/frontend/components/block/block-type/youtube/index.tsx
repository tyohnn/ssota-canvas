'use client';

import React, { memo, useCallback, useMemo, useRef } from 'react';

import type { NodeProps } from '@xyflow/react';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';
import type { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import {
  useBlockInteraction,
} from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useReactFlow } from '@xyflow/react';
import { isFailure } from '@/lib';

import { YoutubeView, useYoutubeBlock, type UseYoutubeBlockDeps } from '@workspace/ssota-blocks/youtube';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { getYoutubeMetadataAction } from '@/domains/youtube-app-space/actions/video/get-youtube-metadata.action';

/**
 * YouTube Block Component (Container)
 *
 * Link 패턴: useYoutubeBlock + YoutubeView + DataBlock.
 * showPlayer는 Result Injection (호출부에서 canvasMode 기반 계산).
 * URL 처리(fetch metadata, updateProperties, updateBlockTitle)는 onUrlSubmit 콜백으로 주입.
 */
export const YoutubeBlock = memo(function YoutubeBlock({
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as YoutubeBlockNodeData;
  const url = String(nodeData.properties?.url ?? '');
  const properties = nodeData.properties ?? {};
  const width = typeof nodeW === 'number' ? nodeW : 410;
  const height = typeof nodeH === 'number' ? nodeH : 288;

  const { getNode, updateNode } = useReactFlow();
  const { updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) => {
        updateNode(nodeId, options as { data: YoutubeBlockNodeData });
      },
    },
  });
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) => {
        updateNode(nodeId, options as { data: YoutubeBlockNodeData });
      },
    },
  });
  const { workspaceId } = useCanvasMetadata();
  const canvasMode = useCanvasModeContext();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const blockInteraction = useBlockInteraction();
  const blockInteractionRef = useRef(blockInteraction);
  blockInteractionRef.current = blockInteraction;
  const blockMountIdRef = useRef(nodeData.blockMountId);
  blockMountIdRef.current = nodeData.blockMountId;

  const isDragging = useMemo(() => {
    if (!canvasMode.isDraggingMode()) return false;
    const mode = canvasMode.getCurrentMode();
    if (mode.type === 'dragging' && mode.blockMountIds) {
      return mode.blockMountIds.includes(nodeData.blockMountId);
    }
    return false;
  }, [canvasMode, nodeData.blockMountId]);

  const isMultiSelection = canvasMode.isMultiSelectionMode();
  const showPlayer = selected && !!url && !isDragging && !isMultiSelection;

  const updateSourceId = useCallback(
    (sourceId: string) => {
      const node = getNode(nodeData.blockMountId);
      if (node?.data) {
        updateNode(nodeData.blockMountId, {
          data: { ...(node.data as object), sourceId },
        } as { data: YoutubeBlockNodeData });
      }
    },
    [getNode, updateNode, nodeData.blockMountId]
  );

  const onUrlSubmit = useCallback(
    async (urlString: string) => {
      const blockId = nodeData.blockId;
      if (!urlString || !blockId || !workspaceId) {
        throw new Error('Missing required context');
      }

      const vo = YoutubeBlockPropertiesVO.fromJSON({ url: urlString });
      const videoId = vo.getVideoId();
      if (!videoId) {
        throw new Error('Invalid video ID');
      }

      await updateProperties(
        blockId,
        { url: urlString },
        nodeData as YoutubeBlockNodeData
      );

      const result = await getYoutubeMetadataAction({
        workspaceId,
        blockId,
        slug: videoId,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      const dto = result.data;
      const video = dto.video;

      const metadata = {
        youtubeTitle: video.title,
        youtubeDescription: video.description,
        youtubeThumbnail:
          video.thumbnailUrl || video.thumbnailHighUrl || undefined,
        channelName: dto.channelName,
        channelThumbnail: dto.channelThumbnail,
        youtubeChannelId: dto.youtubeChannelId,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        publishedAt: video.publishedAt,
      };

      await updateProperties(
        blockId,
        {
          url: urlString,
          youtubeId: video.id,
          ...metadata,
        },
        nodeData as YoutubeBlockNodeData
      );

      if (video.title && updateBlockTitle) {
        await updateBlockTitle({
          nodeId: nodeData.blockMountId,
          title: video.title,
          blockData: nodeData,
        });
      }

      if (dto.sourceId) {
        updateSourceId(dto.sourceId);
      }

      if (dto.blockUuid) {
        setAutoSummaryBlockId(dto.blockUuid);
      } else {
        setAutoSummaryBlockId(blockId);
      }
    },
    [
      nodeData,
      workspaceId,
      updateProperties,
      updateBlockTitle,
      updateSourceId,
      setAutoSummaryBlockId,
    ]
  );

  const getThumbnailUrl = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getThumbnailUrl();
    },
    []
  );
  const getVideoId = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getVideoId();
    },
    []
  );
  const getEmbedUrl = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getEmbedUrl();
    },
    []
  );

  const deps: UseYoutubeBlockDeps = useMemo(
    () => ({
      onUrlSubmit,
      getThumbnailUrl,
      getVideoId,
      getEmbedUrl,
      onProvideCallbacks: (provide) => {
        provide().then(callbacks =>
          blockInteractionRef.current.registerBlockInteractions(
            blockMountIdRef.current,
            callbacks
          )
        );
      },
      onUnmount: () =>
        blockInteractionRef.current.unregisterBlockInteractions(
          blockMountIdRef.current
        ),
    }),
    [onUrlSubmit, getThumbnailUrl, getVideoId, getEmbedUrl]
  );

  const hookResult = useYoutubeBlock(
    {
      url,
      properties,
      showPlayer,
      isActive: selected,
      instanceId: nodeData.blockMountId,
    },
    deps
  );

  const renderOriginalView = () => (
    <YoutubeView
      url={hookResult.url}
      isLoading={hookResult.isLoading}
      hasError={hookResult.hasError}
      draftUrl={hookResult.draftUrl}
      showPlayer={hookResult.showPlayer}
      isIframeLoading={hookResult.isIframeLoading}
      isActive={selected}
      properties={nodeData.properties}
      thumbnailUrl={hookResult.getThumbnailUrl()}
      videoId={hookResult.getVideoId(hookResult.url)}
      inputRef={hookResult.inputRef}
      onUrlChange={hookResult.handleUrlChange}
      onUrlSubmit={hookResult.handleUrlSubmit}
      onUrlKeyDown={hookResult.handleUrlKeyDown}
      onPlayerReady={hookResult.handlePlayerReady}
      onImageLoad={hookResult.handleImageLoad}
      onImageError={hookResult.handleImageError}
    />
  );

  const renderCardView = () => (
    <CardView data={nodeData} selected={selected} />
  );

  return (
    <DataBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
      width={width}
      height={height}
      renderOriginalView={renderOriginalView}
      renderCardView={renderCardView}
    />
  );
});
