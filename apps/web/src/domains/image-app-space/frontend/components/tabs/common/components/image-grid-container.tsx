/**
 * Image Grid Container
 *
 * 공통 이미지 그리드 레이아웃 컨테이너
 */

'use client';

import { ReactNode } from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface ImageGridContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Image Grid Container
 *
 * CSS columns 레이아웃을 사용한 이미지 그리드 컨테이너
 */
export function ImageGridContainer({
  children,
  className = '',
}: ImageGridContainerProps) {
  return (
    <Box
      className={`columns-2 md:columns-3 lg:columns-4 ${className}`}
      style={{ columnGap: 0 }}
    >
      {children}
    </Box>
  );
}
