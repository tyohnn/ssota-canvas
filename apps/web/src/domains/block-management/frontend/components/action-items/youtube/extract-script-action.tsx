'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { FileText } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

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

  const handleExtractScript = useCallback(() => {
    console.log('[TODO] YouTube 스크립트 추출:', { blockId, url });
    // TODO: YouTube 스크립트 추출 로직 구현
    // 1. YouTube Data API 또는 youtube-transcript API 사용
    // 2. 자막/스크립트 추출
    // 3. 새로운 텍스트 블록 또는 마크다운 블록으로 생성
  }, [blockId, url]);

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
      <TooltipContent side="right" hasArrow={false} sideOffset={10}>
        <p>스크립트 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
