'use client';

import { Box } from '@/components/ui/box';

import { type TOCItem, formatTime } from '../../../core/utils';

interface TOCLinesProps {
  tocItems: TOCItem[];
  isHovered: boolean;
  getActiveTOCItem: (item: TOCItem) => boolean;
  onItemClick: (item: TOCItem) => void;
}

export function TOCLines({
  tocItems,
  isHovered,
  getActiveTOCItem,
  onItemClick,
}: TOCLinesProps) {
  return (
    <Box
      className={`relative flex flex-col items-end rounded-md transition-all w-[25px] gap-0.5 p-1 ${
        isHovered ? 'bg-background/95' : 'bg-transparent'
      }`}
    >
      {tocItems.map((item) => {
        const isActive = getActiveTOCItem(item);
        return (
          <button
            key={`${item.intervalType}-${item.minute}`}
            onClick={() => onItemClick(item)}
            className="group relative flex items-center justify-end cursor-pointer py-0.5 w-full"
            aria-label={`Go to ${formatTime(item.startTime)}`}
          >
            <Box
              className={`h-px transition-all ${
                isActive
                  ? 'bg-primary'
                  : 'bg-border/60 group-hover:bg-foreground/60'
              } ${
                item.intervalType === '5min'
                  ? 'w-2 group-hover:w-3'
                  : 'w-4 group-hover:w-5'
              }`}
            />
          </button>
        );
      })}
    </Box>
  );
}
