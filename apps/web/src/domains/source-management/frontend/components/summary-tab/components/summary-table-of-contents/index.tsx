'use client';

import { Box } from '@/components/ui/box';

import { SummaryTOCCard } from './components/toc-card';
import { SummaryTOCLines } from './components/toc-lines';
import type { SummaryTableOfContentsProps } from './core/types';
import { useSummaryTableOfContents } from './core/use-summary-table-of-contents';

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

  if (headings.length === 0 || !showTOC) {
    return null;
  }

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-100 transition-opacity duration-300"
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
