/**
 * Shape Shadow Preview
 *
 * 도형 블록의 Shadow Block 미리보기
 */
import React from 'react';

import { Square } from 'lucide-react';

import { Box } from '@/components/ui/box';

import type { ShadowPreviewProps } from '../core/types';

export function ShapeShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <Box
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      {/* 기본 사각형 도형 미리보기 */}
      <svg
        width={width - 20}
        height={height - 20}
        viewBox={`0 0 ${width - 20} ${height - 20}`}
        className="opacity-60"
      >
        <rect
          x={2}
          y={2}
          width={width - 24}
          height={height - 24}
          rx={8}
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="8,4"
        />
      </svg>

      {/* 아이콘 표시 */}
      <Box className="absolute top-2 left-2">
        <Square className="h-3 w-3 text-blue-400" />
      </Box>
    </Box>
  );
}
