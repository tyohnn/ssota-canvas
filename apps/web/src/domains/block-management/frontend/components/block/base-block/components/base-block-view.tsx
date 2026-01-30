/**
 * Base Block View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { forwardRef } from 'react';

import { cn } from '@workspace/ui/lib/utils';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import type { HoverDirection } from '../core/types';
import { AddButtonZonesContainer } from './add-button-zones';

export interface BaseBlockViewProps {
  children?: React.ReactNode;
  data: BlockNodeData;
  width?: number;
  height?: number;
  draggable?: boolean;
  onMouseEnter: () => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  showAddButtonZones: boolean;
  setHoverDirection: (direction: HoverDirection | null) => void;
}

/**
 * Base Block View
 *
 * 실제 DOM 컨테이너 (Presentational)
 */
export const BaseBlockView = forwardRef<HTMLDivElement, BaseBlockViewProps>(
  (
    {
      children,
      data,
      width,
      height,
      draggable,
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      showAddButtonZones,
      setHoverDirection,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full h-full min-w-[100px] min-h-[70px] overflow-visible',
          draggable === false && 'cursor-not-allowed'
        )}
        style={{
          width: width || 'auto',
          height: height || 'auto',
        }}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {children}
        <AddButtonZonesContainer
          show={showAddButtonZones}
          data={data}
          width={width}
          height={height}
          setHoverDirection={setHoverDirection}
        />
      </div>
    );
  }
);

BaseBlockView.displayName = 'BaseBlockView';
