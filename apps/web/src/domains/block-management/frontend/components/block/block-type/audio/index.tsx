'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';

import type { AudioBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';

import { AudioView } from '@workspace/ssota-blocks/audio';
import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { useAudioBlock } from './core/use-audio-block';

/**
 * Audio Block Component (Container)
 *
 * DataBlock + useAudioBlock + AudioView pattern (Link/PDF)
 */
export const AudioBlock = memo(function AudioBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as AudioBlockNodeData;
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: Record<string, unknown> }) =>
        updateNode(nodeId, options),
    },
  });

  const width = typeof nodeW === 'number' ? nodeW : 350;
  const height = typeof nodeH === 'number' ? nodeH : 160;

  const hookResult = useAudioBlock({
    nodeData,
    nodeId: id,
    selected,
    updateBlockTitle,
  });

  const renderOriginalView = () => (
    <AudioView {...hookResult} selected={selected} width={width} height={height} />
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
