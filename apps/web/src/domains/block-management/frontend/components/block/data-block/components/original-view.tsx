/**
 * Original View Component
 *
 * 블록의 고유 UI를 렌더링하는 View.
 * 모든 블록에 공통 적용되는 컨테이너 스타일(테두리, 그림자, 선택 링)을 적용한다.
 */

'use client';

import { Box } from '@/components/ui/box';

import { getOriginalViewContainerClasses } from '../utils/original-view-container-classes';

export interface OriginalViewProps {
  children: React.ReactNode;
  selected?: boolean;
}

export function OriginalView({ children, selected = false }: OriginalViewProps) {
  return (
    <Box
      className={getOriginalViewContainerClasses(
        selected,
        'flex flex-col overflow-hidden'
      )}
    >
      {children}
    </Box>
  );
}
