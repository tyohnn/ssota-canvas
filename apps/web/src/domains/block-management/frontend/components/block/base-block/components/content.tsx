/**
 * Content Component
 *
 * 실제 블록 컨텐츠를 렌더링하는 래퍼
 */

'use client';

import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

export interface ContentProps {
  children?: React.ReactNode;
  className?: string;
  textColorClass: string;
}

export function Content({ children, className, textColorClass }: ContentProps) {
  return (
    <Box className={cn('w-full h-full', textColorClass, className)}>
      {children}
    </Box>
  );
}
