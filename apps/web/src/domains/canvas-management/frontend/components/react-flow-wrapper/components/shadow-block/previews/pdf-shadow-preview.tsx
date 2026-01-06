'use client';

import React from 'react';

import { FileText } from 'lucide-react';

import { Box } from '@/components/ui/box';

import type { ShadowPreviewProps } from '../core/types';

/**
 * PDF Block Shadow Preview Component
 *
 * PDF 블록 생성 시 마우스를 따라다니는 Shadow 미리보기
 */
export function PdfShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <Box
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 dark:bg-blue-950/30 rounded-lg flex flex-col items-center justify-center overflow-hidden"
      style={{ width, height }}
    >
      {/* PDF 아이콘 */}
      <Box className="flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-blue-500 dark:text-blue-400 mb-2" />
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          PDF Block
        </span>
      </Box>

      {/* 가상 페이지 표시 */}
      <Box className="absolute bottom-2 left-2 right-2 flex items-center justify-center">
        <Box className="text-[10px] text-blue-500/60 dark:text-blue-400/60">
          Add PDF
        </Box>
      </Box>
    </Box>
  );
}
