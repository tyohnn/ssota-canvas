'use client';

import { useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Braces, Loader2 } from 'lucide-react';
import { toast } from '@workspace/ui/components/ui/sonner';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useBlockActionExecutor } from '@/domains/block-management/frontend/hooks/use-block-action-executor';

interface ExtractJsonLinkActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractJsonLinkAction({
  blockId,
  blockData,
}: ExtractJsonLinkActionProps) {
  const properties = blockData.properties as LinkBlockProperties;
  const url = properties?.url;
  const blockMountId = blockData.blockMountId ?? blockId;
  const { executeAction } = useBlockActionExecutor();
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    if (!url) return;
    setIsLoading(true);
    try {
      await executeAction({
        blockId: blockMountId,
        action: 'extractJSON',
        blockType: 'link',
        params: {},
      });
      toast.success('JSON 추출이 완료되었습니다.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'JSON 추출에 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExtract}
          disabled={!url || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Braces className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>JSON 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
