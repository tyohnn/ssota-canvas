'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { FileText } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useYoutubeExtractScript } from '../use-youtube-actions';

interface ExtractScriptActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractScriptAction({
  blockId,
  blockData,
}: ExtractScriptActionProps) {
  const properties = blockData.properties as YoutubeBlockProperties;
  const url = properties.url;

  // 훅에서 로직을 가져옴
  const handleExtractScript = useYoutubeExtractScript(blockId, blockData);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExtractScript}
          disabled={!url}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>스크립트 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
