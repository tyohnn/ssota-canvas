/**
 * Content Component
 *
 * 실제 블록 컨텐츠를 렌더링하는 래퍼
 */

'use client';

import { cn } from '@workspace/ui/lib/utils';
import { useBaseBlockContext } from '../core/use-base-block.context';

export interface ContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function Content({ children, className }: ContentProps) {
  const { textColorClass } = useBaseBlockContext();

  return (
    <div className={cn('w-full h-full', textColorClass, className)}>
      {children}
    </div>
  );
}
