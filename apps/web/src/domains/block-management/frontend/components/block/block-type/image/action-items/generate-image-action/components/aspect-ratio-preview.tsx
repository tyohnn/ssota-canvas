/**
 * Aspect Ratio Preview Component
 *
 * 선택된 비율에 따라 스켈레톤 이미지 표시
 */

'use client';

import React from 'react';
import { AspectRatio } from '@workspace/ui/components/ui/aspect-ratio';
import { useGenerateImageActionContext } from '../generate-image-action.context';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@/components/ui/box';

/**
 * Aspect Ratio Preview Props
 */
export interface AspectRatioPreviewProps {
  className?: string;
}

/**
 * Aspect Ratio Preview Component
 */
export function AspectRatioPreview({
  className,
}: AspectRatioPreviewProps): React.ReactElement | null {
  const { aspectRatio, results, isGenerating } =
    useGenerateImageActionContext();

  // 결과가 있거나 생성 중이면 표시하지 않음
  if (results.length > 0 || isGenerating) {
    return null;
  }

  // 비율을 숫자로 변환 (예: "16:9" → 16/9)
  const getRatio = (ratioStr: string | undefined): number => {
    if (!ratioStr) return 1;
    const [width, height] = ratioStr.split(':').map(Number);
    return width && height ? width / height : 1;
  };

  const ratio = getRatio(aspectRatio);

  return (
    <Box
      className={cn('p-4 flex justify-center items-center border-b', className)}
    >
      <Box className="w-full max-w-[300px]">
        <AspectRatio ratio={ratio}>
          <Box className="w-full h-full bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground">
              {aspectRatio || '1:1'} Ratio
            </p>
          </Box>
        </AspectRatio>
      </Box>
    </Box>
  );
}
