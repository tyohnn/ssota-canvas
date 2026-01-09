/**
 * Original View Component
 *
 * 블록의 고유 UI를 렌더링하는 View (children을 그대로 표시)
 */

'use client';

import { Box } from '@/components/ui/box';

export interface OriginalViewProps {
  children: React.ReactNode;
}

export function OriginalView({ children }: OriginalViewProps) {
  return <Box className="w-full h-full">{children}</Box>;
}
