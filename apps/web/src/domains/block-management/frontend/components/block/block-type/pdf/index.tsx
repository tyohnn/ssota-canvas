'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import type { PdfBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useReactFlow } from '@xyflow/react';
import { useUpdateBlockTitle } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { PdfView } from './components/block-ui/pdf.view';
import { usePdfBlock } from './core/use-pdf-block';

/**
 * PDF Block Component (Container)
 *
 * Link 패턴: DataBlock + usePdfBlock + PdfView
 * 순수 뷰어만 (페이지 네비, 확대축소, 메타데이터 표시 없음)
 */
export const PdfBlock = memo(function PdfBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as PdfBlockNodeData;
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockTitle } = useUpdateBlockTitle({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: Record<string, unknown> }) =>
        updateNode(nodeId, options),
    },
  });

  const width = typeof nodeW === 'number' ? nodeW : 300;
  const height = typeof nodeH === 'number' ? nodeH : 400;

  const hookResult = usePdfBlock({
    nodeData,
    selected,
    nodeId: id,
    updateBlockTitle,
  });

  const renderOriginalView = () => (
    <PdfView {...hookResult} selected={selected} width={width} height={height} />
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
