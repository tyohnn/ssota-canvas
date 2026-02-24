'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import type { LinkBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useReactFlow } from '@xyflow/react';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { LinkView } from './components/block-ui/link.view';
import { useLinkBlock } from './core/use-link-block';

/**
 * Link Block Component (Container)
 *
 * URL preview block: Open Graph card. Hook + presentational view; no inline UI.
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
      updateNode: (nodeId: string, options: { data: any }) =>
        updateNode(nodeId, options),
    },
  });

  const width = typeof nodeW === 'number' ? nodeW : 310;
  const height = typeof nodeH === 'number' ? nodeH : 280;

  const hookResult = useLinkBlock({
    nodeData,
    selected,
    nodeId: id,
    updateBlockTitle,
  });

  const renderOriginalView = () => (
    <LinkView {...hookResult} selected={selected} />
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
