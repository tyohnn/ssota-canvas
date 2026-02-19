'use client';

import { useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useBlockActionExecutor } from '@/domains/block-management/frontend/hooks/use-block-action-executor';

interface ExtractImagesLinkActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractImagesLinkAction({
  blockId,
  blockData,
}: ExtractImagesLinkActionProps) {
  const properties = blockData.properties as LinkBlockProperties;
  const url = properties?.url;
  const blockMountId = blockData.blockMountId ?? blockId;
  const { workspaceId } = useCanvasMetadata();
  const { executeAction } = useBlockActionExecutor();
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    if (!url) return;
    if (!workspaceId) {
      toast.error('캔버스 컨텍스트가 필요합니다.');
      return;
    }
    setIsLoading(true);
    try {
      await executeAction({
        blockId: blockMountId,
        action: 'extractImages',
        blockType: 'link',
        params: { workspaceId },
      });
      toast.success('이미지 추출이 완료되었습니다.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : '이미지 추출에 실패했습니다.'
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
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>이미지 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
