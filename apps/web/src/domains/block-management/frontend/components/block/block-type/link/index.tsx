'use client';

import React, { memo, useCallback, useMemo } from 'react';

import type { NodeProps } from '@xyflow/react';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';
import type { LinkBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { fetchLinkMetadataAction } from '@/domains/link-app-space/actions/metadata/fetch-link-metadata.action';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useReactFlow } from '@xyflow/react';
import { isFailure } from '@/lib';

import {
  LinkView,
  useLinkBlock,
  type UseLinkBlockDeps,
} from '@workspace/ssota-blocks/link';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;

/**
 * Link Block Component (Container)
 *
 * URL preview block: Open Graph card.
 * Link 패턴: useLinkBlock + LinkView + DataBlock.
 * onUrlSubmit가 fetch, persistence 전부 담당 (Parameterization).
 */
export const LinkBlock = memo(function LinkBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as LinkBlockNodeData;
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) =>
        updateNode(nodeId, options as { data: LinkBlockNodeData }),
    },
  });
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: unknown }) =>
        updateNode(nodeId, options as { data: LinkBlockNodeData }),
    },
  });
  const { workspaceId, orgId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();

  const width = typeof nodeW === 'number' ? nodeW : 310;
  const height = typeof nodeH === 'number' ? nodeH : 280;

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const onUrlSubmit = useCallback(
    async (urlString: string) => {
      if (!hasValidBlockId || !nodeData.blockId || !workspaceId || !orgId) {
        return;
      }

      // 1. Persist url (user submit case) or skip if already in node
      const currentUrl = nodeData.properties?.url ?? '';
      if (currentUrl !== urlString) {
        await updateProperty(
          nodeData.blockId,
          'properties.url',
          urlString,
          nodeData
        );
      }

      // 2. Fetch metadata
      const result = await fetchLinkMetadataAction({
        workspaceId,
        blockId: nodeData.blockId,
        url: urlString,
      });

      if (isFailure(result)) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Failed to fetch metadata'
        );
      }

      const { metadata, sourceId, blockUuid } = result.data;

      // 3. Persist og properties
      await updateProperties(
        nodeData.blockId,
        {
          ogTitle: metadata.title,
          ogDescription: metadata.description,
          ogImage: metadata.imageUrl,
          siteName: metadata.siteName,
          domain: metadata.domain,
          faviconUrl: metadata.faviconUrl,
          author: metadata.author,
          publishedAt: metadata.publishedAt,
          pageType: metadata.type,
          ...(sourceId && { sourceId }),
        },
        nodeData
      );

      // 4. Report for auto-summary
      if (blockUuid) {
        setAutoSummaryBlockId(blockUuid);
      }

      // 5. Update block title in canvas
      if (sourceId && metadata.title?.trim() && updateBlockTitle) {
        await updateBlockTitle({
          nodeId: id,
          title: metadata.title.trim(),
          blockData: { ...nodeData, sourceId },
        });
      }
    },
    [
      hasValidBlockId,
      nodeData,
      workspaceId,
      orgId,
      updateProperty,
      updateProperties,
      setAutoSummaryBlockId,
      updateBlockTitle,
      id,
    ]
  );

  const deps: UseLinkBlockDeps = useMemo(
    () => ({
      onUrlSubmit,
    }),
    [onUrlSubmit]
  );

  const hookResult = useLinkBlock(
    {
      url: nodeData.properties?.url ?? '',
      properties: nodeData.properties,
      isActive: selected,
      instanceId: nodeData.blockMountId,
      canPersist: !id.startsWith('optimistic-') && !!hasValidBlockId,
    },
    deps
  );

  const renderOriginalView = () => (
    <LinkView {...hookResult} isActive={selected} />
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
