/**
 * Default Shadow Preview
 *
 * 기본 Shadow Block 미리보기 (블록별 Preview가 없을 때 사용)
 */

import React from 'react';
import type { ShadowPreviewProps } from '../shadow-block-preview-registry';
import { FileText } from 'lucide-react';

export function DefaultShadowPreview({
  blockType,
  width,
  height,
}: ShadowPreviewProps) {
  // 블록 타입별 표시 이름 매핑
  const getDisplayName = (type: string): string => {
    const displayNames: Record<string, string> = {
      text: 'Text Block',
      shape: 'Shape Block',
      markdown: 'Markdown Block',
      youtube: 'YouTube Block',
      image: 'Image Block',
      video: 'Video Block',
      python: 'Python Block',
      file: 'File Block',
      link: 'Link Block',
      page_mention: 'Page Mention',
      latex: 'LaTeX Block',
      github_pr: 'GitHub PR',
      react_component: 'React Component',
      pdf: 'PDF Block',
      audio: 'Audio Block',
    };
    return displayNames[type] || type;
  };

  return (
    <div
      className="border-2 border-blue-500 border-dashed bg-blue-100/30 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">📝</div>
        <div className="text-xs font-medium text-blue-600">
          {getDisplayName(blockType)}
        </div>
      </div>
    </div>
  );
}

