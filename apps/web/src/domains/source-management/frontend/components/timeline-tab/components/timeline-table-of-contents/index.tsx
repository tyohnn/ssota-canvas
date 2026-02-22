'use client';

import { Box } from '@/components/ui/box';

import { generateMinuteTOC } from '../../core/utils';
import { TOCCard } from './components/toc-card';
import { TOCLines } from './components/toc-lines';
import { useTableOfContents } from './core/use-table-of-contents';

interface TimelineTableOfContentsProps {
  transcript: Array<{ start: number; text: string }> | undefined;
  showTOC: boolean;
}

export function TimelineTableOfContents({
  transcript,
  showTOC,
}: TimelineTableOfContentsProps) {
  const {
    tocItems,
    isHovered,
    getActiveTOCItem,
    handleTOCClick,
    handleMouseEnter,
    handleMouseLeave,
    allTocItems: allItems,
  } = useTableOfContents(transcript, showTOC);

  const allTocItems = generateMinuteTOC(transcript);

  if (allTocItems.length <= 1 || !showTOC) {
    return null;
  }

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-70 transition-opacity duration-300"
      style={{
        opacity: showTOC ? 1 : 0,
        pointerEvents: showTOC ? 'auto' : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box className="relative">
        <TOCLines
          tocItems={tocItems}
          isHovered={isHovered}
          getActiveTOCItem={getActiveTOCItem}
          onItemClick={handleTOCClick}
        />
        {isHovered ? (
          <TOCCard
            allTocItems={allItems}
            getActiveTOCItem={getActiveTOCItem}
            onItemClick={handleTOCClick}
          />
        ) : null}
      </Box>
    </Box>
  );
}
