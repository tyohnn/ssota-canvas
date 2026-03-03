'use client';

import React, { memo, useCallback, useMemo } from 'react';

import type { NodeProps } from '@xyflow/react';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';
import type { XBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { getXMetadataAction } from '@/domains/x-app-space/actions/post/get-x-metadata.action';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useReactFlow } from '@xyflow/react';
import { isFailure } from '@/lib';

import {
  XView,
  useXBlock,
  contentTitleFromText,
  type UseXBlockDeps,
} from '@workspace/ssota-blocks/x';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;

function getPostIdFromUrl(url: string): string | null {
  const match = url.match(
    /(?:x\.com|twitter\.com)\/(?:\w+\/status\/|i\/status\/)(\d{10,25})/
  );
  return match?.[1] ?? null;
}

/**
 * X Block Component (Container)
 *
 * X post preview block. Link 패턴: useXBlock + XView + DataBlock.
 */
export const XBlock = memo(function XBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as XBlockNodeData;
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) =>
        updateNode(nodeId, options as { data: XBlockNodeData }),
    },
  });
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) =>
        updateNode(nodeId, options as { data: XBlockNodeData }),
    },
  });
  const { workspaceId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();

  const width = typeof nodeW === 'number' ? nodeW : 340;
  const height = typeof nodeH === 'number' ? nodeH : 280;

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const onUrlSubmit = useCallback(
    async (urlString: string) => {
      if (!hasValidBlockId || !nodeData.blockId || !workspaceId) {
        return;
      }

      const postId = getPostIdFromUrl(urlString);
      if (!postId) {
        throw new Error('Invalid X post URL');
      }

      const currentUrl = nodeData.properties?.url ?? '';
      if (currentUrl !== urlString) {
        await updateProperty(
          nodeData.blockId,
          'properties.url',
          urlString,
          nodeData
        );
      }

      const result = await getXMetadataAction({
        workspaceId,
        blockId: nodeData.blockId,
        postId,
      });

      if (isFailure(result)) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Failed to fetch metadata'
        );
      }

      const { post, sourceId, blockUuid } = result.data;

      await updateProperties(
        nodeData.blockId,
        {
          url: urlString,
          xPostId: post.postId,
          xText: post.text,
          xAuthorUsername: post.authorUsername,
          xAuthorName: post.authorName,
          xAuthorProfileImageUrl: post.authorProfileImageUrl,
          xPostedAt: post.postedAt,
          xLikeCount: post.likeCount,
          xRetweetCount: post.retweetCount,
          xReplyCount: post.replyCount,
          ...(post.entities && { xEntities: post.entities }),
          ...(sourceId && { sourceId }),
        },
        nodeData
      );

      if (blockUuid) {
        setAutoSummaryBlockId(blockUuid);
      }

      const title =
        contentTitleFromText(post.text) ||
        post.authorName ??
        post.authorUsername ??
        'X Post';
      if (updateBlockTitle) {
        await updateBlockTitle({
          nodeId: id,
          title: title.length > 100 ? title.slice(0, 100) : title,
          blockData: { ...nodeData, sourceId },
        });
      }
    },
    [
      hasValidBlockId,
      nodeData,
      workspaceId,
      updateProperty,
      updateProperties,
      setAutoSummaryBlockId,
      updateBlockTitle,
      id,
    ]
  );

  const deps: UseXBlockDeps = useMemo(
    () => ({
      onUrlSubmit,
    }),
    [onUrlSubmit]
  );

  const hookResult = useXBlock(
    {
      url: nodeData.properties?.url ?? '',
      properties: nodeData.properties ?? {},
      isActive: selected,
      instanceId: nodeData.blockMountId,
      canPersist: !id.startsWith('optimistic-') && !!hasValidBlockId,
    },
    deps
  );

  const renderOriginalView = () => (
    <XView {...hookResult} isActive={selected} />
  );

  const renderCardView = () => <CardView data={nodeData} selected={selected} />;

  return (
    <DataBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
      isConnectable={true}
      width={width}
      height={height}
      renderOriginalView={renderOriginalView}
      renderCardView={renderCardView}
    />
  );
});
