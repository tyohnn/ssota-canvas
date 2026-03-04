'use client';

import {
  TableOfContentsCard,
  TableOfContentsLines,
} from '@workspace/ui/components/ssota-ui/table-of-contents';
import { Box } from '@workspace/ui/components/ui/box';
import type { SummaryTableOfContentsProps } from './core/types';
import { useSummaryTableOfContents } from './core/use-summary-table-of-contents';

export function SummaryTableOfContents({ tiptapContent, showTOC }: SummaryTableOfContentsProps) {
  const {
    allItems,
    compactItems,
    isHovered,
    getIsActive,
    onItemClick,
    onMouseEnter,
    onMouseLeave,
  } = useSummaryTableOfContents({ tiptapContent, showTOC });

  if (allItems.length === 0 || !showTOC) return null;

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-100 transition-opacity duration-300"
      style={{ opacity: showTOC ? 1 : 0, pointerEvents: showTOC ? 'auto' : 'none' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Box className="relative">
        <TableOfContentsLines
          items={compactItems}
          isHovered={isHovered}
          getIsActive={getIsActive}
          onItemClick={onItemClick}
        />
        {isHovered ? (
          <TableOfContentsCard
            items={allItems}
            getIsActive={getIsActive}
            onItemClick={onItemClick}
          />
        ) : null}
      </Box>
    </Box>
  );
}
