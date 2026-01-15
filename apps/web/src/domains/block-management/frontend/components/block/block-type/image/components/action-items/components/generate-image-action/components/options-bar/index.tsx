/**
 * Options Bar Component
 *
 * 모델, 비율, 개수, 생성 버튼을 한 행에 배치
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { ModelSelect } from './model-select';
import { AspectRatioSelect } from './aspect-ratio-select';
import { OutputCountSelect } from './output-count-select';
import { GenerateButton } from './generate-button';
import { Box } from '@/components/ui/box';

/**
 * Options Bar Props
 */
export interface OptionsBarProps {
  className?: string;
}

/**
 * Options Bar Component
 */
export function OptionsBar({ className }: OptionsBarProps): React.ReactElement {
  return (
    <Box
      className={cn(
        'p-4 pt-10 border-b flex items-center justify-between',
        className
      )}
    >
      {/* 모델 선택 */}
      <Box className="flex-1 flex items-center gap-2">
        <ModelSelect />

        {/* 비율 선택 (Google 모델만) */}
        <AspectRatioSelect />

        {/* 개수 선택 */}
        <OutputCountSelect />
      </Box>

      {/* 생성 버튼 */}
      <GenerateButton />
    </Box>
  );
}
