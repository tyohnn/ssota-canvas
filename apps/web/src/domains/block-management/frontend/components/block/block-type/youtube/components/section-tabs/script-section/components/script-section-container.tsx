/**
 * Script Section Container
 *
 * 스크립트 섹션의 공통 컨테이너 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';

/**
 * Script Section Container Props
 */
interface ScriptSectionContainerProps {
  children: React.ReactNode;
}

/**
 * Script Section Container Component
 */
export function ScriptSectionContainer({
  children,
}: ScriptSectionContainerProps) {
  return <Box className="pl-6 pr-12 py-3 min-h-[200px]">{children}</Box>;
}
