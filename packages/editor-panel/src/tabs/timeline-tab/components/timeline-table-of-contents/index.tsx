'use client';

import {
  TableOfContentsCard,
  TableOfContentsLines,
} from '@workspace/ui/components/ssota-ui/table-of-contents';
import { Box } from '@workspace/ui/components/ui/box';
import { useTableOfContents } from './core/use-table-of-contents';

export interface TimelineTableOfContentsProps {
  transcript: Array<{ start: number; text: string }> | undefined;
  showTOC: boolean;
}

export function TimelineTableOfContents({ transcript, showTOC }: TimelineTableOfContentsProps) {
  const {
    allItems,
    compactItems,
    isHovered,
    getIsActive,
    onItemClick,
    onMouseEnter,
    onMouseLeave,
  } = useTableOfContents(transcript, showTOC);

  if (allItems.length <= 1 || !showTOC) return null;

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-70 transition-opacity duration-300"
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
            className="max-h-[300px] h-fit max-w-[75px] w-fit p-2"
          />
        ) : null}
      </Box>
    </Box>
  );
}
