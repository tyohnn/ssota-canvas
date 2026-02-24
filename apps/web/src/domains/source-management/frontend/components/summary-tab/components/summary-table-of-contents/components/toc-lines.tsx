'use client';

import { Box } from '@/components/ui/box';

import type { SummaryTOCItem } from '../core/utils';

interface SummaryTOCLinesProps {
  headings: SummaryTOCItem[];
  isHovered: boolean;
  getActiveHeading: (item: SummaryTOCItem) => boolean;
  onItemClick: (item: SummaryTOCItem) => void;
}

export function SummaryTOCLines({
  headings,
  isHovered,
  getActiveHeading,
  onItemClick,
}: SummaryTOCLinesProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <Box
      className={`relative flex flex-col items-end rounded-md transition-all w-[25px] gap-0.5 p-1 ${isHovered ? 'bg-background/95' : 'bg-transparent'}`}
    >
      {headings.map(item => {
        const isActive = getActiveHeading(item);
        const widthClass =
          item.level === 1
            ? 'w-4 group-hover:w-5'
            : item.level === 2
              ? 'w-3 group-hover:w-4'
              : 'w-2 group-hover:w-3';

        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="group relative flex items-center justify-end cursor-pointer py-0.5 w-full"
            aria-label={`Go to ${item.text}`}
          >
            <Box
              className={`h-px transition-all ${widthClass} ${isActive ? 'bg-primary' : 'bg-border/60 group-hover:bg-foreground/60'}`}
            />
          </button>
        );
      })}
    </Box>
  );
}
