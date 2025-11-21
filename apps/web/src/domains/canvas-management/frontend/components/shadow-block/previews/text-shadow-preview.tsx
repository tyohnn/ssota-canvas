/**
 * Text Shadow Preview
 *
 * 텍스트 블록의 Shadow Block 미리보기
 */

import React from 'react';
import type { ShadowPreviewProps } from '../shadow-block-preview-registry';
import { FileText } from 'lucide-react';

export function TextShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <div
      className="border-2 border-gray-400 border-dashed bg-gray-50/50 rounded-lg p-3 flex flex-col gap-2"
      style={{ width, height }}
    >
      {/* 아이콘 */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Text Block</span>
      </div>

      {/* 텍스트 라인 미리보기 */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-2 bg-gray-300/50 rounded w-3/4" />
        <div className="h-2 bg-gray-300/50 rounded w-5/6" />
        <div className="h-2 bg-gray-300/50 rounded w-2/3" />
      </div>
    </div>
  );
}

