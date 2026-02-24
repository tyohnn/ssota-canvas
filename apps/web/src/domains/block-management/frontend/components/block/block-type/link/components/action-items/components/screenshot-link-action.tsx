'use client';

import { useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useBlockActionExecutor } from '@/domains/block-management/frontend/hooks/use-block-action-executor';

interface ScreenshotLinkActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ScreenshotLinkAction({
  blockId,
  blockData,
}: ScreenshotLinkActionProps) {
  const properties = blockData.properties as LinkBlockProperties;
  const url = properties?.url;
  const blockMountId = blockData.blockMountId ?? blockId;
  const { workspaceId } = useCanvasMetadata();
  const { executeAction } = useBlockActionExecutor();
  const [isLoading, setIsLoading] = useState(false);

  const handleScreenshot = async () => {
    if (!url) return;
    if (!workspaceId) {
      toast.error('캔버스 컨텍스트가 필요합니다.');
      return;
    }
    setIsLoading(true);
    try {
      await executeAction({
        blockId: blockMountId,
        action: 'screenshot',
        blockType: 'link',
        params: { fullPage: false, workspaceId },
      });
      toast.success('스크린샷이 완료되었습니다.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : '스크린샷 실행에 실패했습니다.'
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
          onClick={handleScreenshot}
          disabled={!url || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>스크린샷</p>
      </TooltipContent>
    </Tooltip>
  );
}
