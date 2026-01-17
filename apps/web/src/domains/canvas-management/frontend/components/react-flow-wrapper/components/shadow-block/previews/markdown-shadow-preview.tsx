'use client';

import React from 'react';

import { FileText } from 'lucide-react';

import { Box } from '@/components/ui/box';

import type { ShadowPreviewProps } from '../core/types';

/**
 * Markdown Block Shadow Preview
 *
 * 마크다운 블록 드래그 시 표시되는 Shadow Preview
 */
export function MarkdownShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <Box
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      {/* 마크다운 아이콘과 텍스트 */}
      <Box className="text-center">
        <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <span className="text-xs font-medium text-blue-600">Markdown</span>
      </Box>
    </Box>
  );
}
