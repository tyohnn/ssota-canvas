'use client';

import React from 'react';
import type { ShadowPreviewProps } from '../shadow-block-preview-registry';
import { FileText } from 'lucide-react';

/**
 * Markdown Block Shadow Preview
 *
 * 마크다운 블록 드래그 시 표시되는 Shadow Preview
 */
export function MarkdownShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <div
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      {/* 마크다운 아이콘과 텍스트 */}
      <div className="text-center">
        <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <span className="text-xs font-medium text-blue-600">Markdown</span>
      </div>
    </div>
  );
}
