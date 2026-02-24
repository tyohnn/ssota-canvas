/**
 * Timeline Tab Container
 *
 * 타임라인 탭의 공통 컨테이너 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';

interface TimelineTabContainerProps {
  children: React.ReactNode;
}

export function TimelineTabContainer({ children }: TimelineTabContainerProps) {
  return <Box className="pl-6 pr-12 py-3 min-h-[200px]">{children}</Box>;
}
