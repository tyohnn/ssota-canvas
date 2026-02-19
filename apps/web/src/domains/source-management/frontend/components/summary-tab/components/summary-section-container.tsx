/**
 * Summary Section Container
 *
 * 요약 섹션의 공통 컨테이너 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';

interface SummarySectionContainerProps {
  children: React.ReactNode;
}

export function SummarySectionContainer({
  children,
}: SummarySectionContainerProps) {
  return <Box className="pl-6 pr-12 py-3 min-h-[200px]">{children}</Box>;
}
