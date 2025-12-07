/**
 * Image Grid Empty
 *
 * 공통 이미지 그리드 빈 상태 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';

export interface ImageGridEmptyProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Image Grid Empty
 *
 * 이미지가 없을 때 표시할 빈 상태 UI
 */
export function ImageGridEmpty({
  title = 'No images found',
  description = 'Create or add images',
  className = '',
}: ImageGridEmptyProps) {
  return (
    <Box className={`flex items-center justify-center h-[400px] ${className}`}>
      <Box className="text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm">{description}</p>
      </Box>
    </Box>
  );
}
