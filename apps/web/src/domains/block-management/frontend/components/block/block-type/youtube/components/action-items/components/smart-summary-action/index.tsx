'use client';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { useSmartSummary } from './use-smart-summary';

interface SmartSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function SmartSummaryAction({
  blockId,
  blockData,
}: SmartSummaryActionProps) {
  const { smartSummary, isLoading, isSuccess } = useSmartSummary({
    blockId,
    blockData,
  });

  const handleSmartSummary = () => {
    smartSummary();
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
      tooltip={isSuccess ? 'Summary Generated!' : 'AI Summary'}
      tooltipSide="top"
      tooltipOffset={5}
      onClick={handleSmartSummary}
      disabled={isLoading}
      onMouseDown={e => e.stopPropagation()}
      className="h-7 w-7 p-0"
      iconClassName="size-3.5"
    />
  );
}
