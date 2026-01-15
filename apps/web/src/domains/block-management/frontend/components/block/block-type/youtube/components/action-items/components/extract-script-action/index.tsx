'use client';

import { Check, FileText, Loader2 } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { useExtractScript } from './use-extract-script';

interface ExtractScriptActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractScriptAction({
  blockId,
  blockData,
}: ExtractScriptActionProps) {
  const { extractScript, isLoading, isSuccess } = useExtractScript({
    blockId,
    blockData,
  });

  const handleExtractScript = () => {
    extractScript();
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="text-green-600" />;
    }
    return <FileText />;
  };

  return (
    <ToolbarIconButton
      icon={getIcon()}
      tooltip={isSuccess ? 'Script Extracted!' : 'Extract Script'}
      tooltipSide="top"
      tooltipOffset={5}
      onClick={handleExtractScript}
      disabled={isLoading}
      onMouseDown={e => e.stopPropagation()}
      className="h-7 w-7 p-0"
      iconClassName="size-3.5"
    />
  );
}
