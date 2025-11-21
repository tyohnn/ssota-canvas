'use client';

import React from 'react';
import type { ShadowPreviewProps } from '../shadow-block-preview-registry';
import { Link as LinkIcon } from 'lucide-react';

/**
 * Link Block Shadow Preview Component
 *
 * 드래그 중에 표시되는 URL 프리뷰 블록의 그림자 프리뷰
 */
export function LinkShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <div
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      <div className="text-center">
        <LinkIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <span className="text-xs font-medium text-blue-600">Link Preview</span>
      </div>
    </div>
  );
}
