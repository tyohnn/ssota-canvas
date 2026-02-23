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
  /** 컨테이너 테두리/배경 생략 (도형 등 자체 시각 경계가 있는 블록) */
  noContainerBoundary?: boolean;
}

export function OriginalView({
  children,
  selected = false,
  noContainerBoundary = false,
}: OriginalViewProps) {
  return (
    <Box
      className={getOriginalViewContainerClasses(
        selected,
        noContainerBoundary
          ? 'flex flex-col overflow-visible'
          : 'flex flex-col overflow-hidden',
        noContainerBoundary
      )}
    >
      {children}
    </Box>
  );
}
