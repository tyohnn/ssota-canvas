'use client';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { useExtractSummary } from './use-extract-summary';

interface ExtractSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractSummaryAction({
  blockId,
  blockData,
}: ExtractSummaryActionProps) {
  const { extractSummary, isLoading, isSuccess } = useExtractSummary({
    blockId,
    blockData,
  });

  const handleExtractSummary = () => {
    extractSummary();
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="text-green-600" />;
    }
    return <Sparkles />;
  };

  return (
    <ToolbarIconButton
      icon={getIcon()}
      tooltip={isSuccess ? 'Summary Extracted!' : 'Extract Summary'}
      tooltipSide="top"
      tooltipOffset={5}
      onClick={handleExtractSummary}
      disabled={isLoading}
      onMouseDown={e => e.stopPropagation()}
      className="h-7 w-7 p-0"
      iconClassName="size-3.5"
    />
  );
}
