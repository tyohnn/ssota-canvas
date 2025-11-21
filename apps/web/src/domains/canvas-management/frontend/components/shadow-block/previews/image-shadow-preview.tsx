'use client';

import React from 'react';
import type { ShadowPreviewProps } from '../shadow-block-preview-registry';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Image Block Shadow Preview
 *
 * 드래그 중에 표시되는 이미지 블록 미리보기
 */
export function ImageShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <div
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      {/* 이미지 블록 아이콘 */}
      <div className="text-center">
        <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <span className="text-xs font-medium text-blue-600">이미지</span>
      </div>
    </div>
  );
}
