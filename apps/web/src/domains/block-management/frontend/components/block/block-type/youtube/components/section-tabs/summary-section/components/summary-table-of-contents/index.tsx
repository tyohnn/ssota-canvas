/**
 * Summary Table of Contents
 *
 * 요약의 헤더 기반 목차 컴포넌트 (h1, h2, h3 3단계)
 * - 기본: 수평선 형태의 목차 요약
 * - 호버: 전체 영역에 흰색 배경 카드 표시
 * - 클릭: 해당 헤더로 스크롤
 */

'use client';

import { Box } from '@/components/ui/box';

import { SummaryTOCCard } from './components/toc-card';
import { SummaryTOCLines } from './components/toc-lines';
import type { SummaryTableOfContentsProps } from './core/types';
import { useSummaryTableOfContents } from './core/use-summary-table-of-contents';

/**
 * Summary Table of Contents Component
 */
export function SummaryTableOfContents({
  tiptapContent,
  showTOC,
}: SummaryTableOfContentsProps) {
  const {
    headings,
    isHovered,
    getActiveHeading,
    handleHeadingClick,
    handleMouseEnter,
    handleMouseLeave,
  } = useSummaryTableOfContents({ tiptapContent, showTOC });

  // 헤더가 없거나 TOC를 표시하지 않으면 null
  if (headings.length === 0 || !showTOC) {
    return null;
  }

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-300"
      style={{
        opacity: showTOC ? 1 : 0,
        pointerEvents: showTOC ? 'auto' : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box className="relative">
        <SummaryTOCLines
          headings={headings}
          isHovered={isHovered}
          getActiveHeading={getActiveHeading}
          onItemClick={handleHeadingClick}
        />

        {isHovered ? (
          <SummaryTOCCard
            headings={headings}
            getActiveHeading={getActiveHeading}
            onItemClick={handleHeadingClick}
          />
        ) : null}
      </Box>
    </Box>
  );
}
