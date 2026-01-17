/**
 * Default Shadow Preview
 *
 * 기본 Shadow Block 미리보기 (블록별 Preview가 없을 때 사용)
 */
import React from 'react';

import { FileText } from 'lucide-react';

import { Box } from '@/components/ui/box';

import type { ShadowPreviewProps } from '../core/types';

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
    <Box
      className="border-2 border-blue-500 border-dashed bg-blue-100/30 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      <Box className="text-center">
        <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <Box className="text-xs font-medium text-blue-600">
          {getDisplayName(blockType)}
        </Box>
      </Box>
    </Box>
  );
}
