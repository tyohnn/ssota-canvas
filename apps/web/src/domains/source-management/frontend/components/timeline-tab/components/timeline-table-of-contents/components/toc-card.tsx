'use client';

import { Box } from '@/components/ui/box';

import { type TOCItem, formatTime } from '../../../core/utils';

interface TOCCardProps {
  allTocItems: TOCItem[];
  getActiveTOCItem: (item: TOCItem) => boolean;
  onItemClick: (item: TOCItem) => void;
}

export function TOCCard({
  allTocItems,
  getActiveTOCItem,
  onItemClick,
}: TOCCardProps) {
  return (
    <Box className="absolute right-0 top-1/2 -translate-y-1/2 bg-background border border-border rounded-md shadow-lg p-2 overflow-y-auto max-h-[300px] h-fit max-w-[75px] w-fit">
      <Box className="space-y-0.5">
        {allTocItems.map((item) => {
          const isActive = getActiveTOCItem(item);
          return (
            <button
              key={`${item.intervalType}-${item.minute}`}
              className={`w-full text-left cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded transition-colors text-xs whitespace-nowrap ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onItemClick(item)}
            >
              {formatTime(item.startTime)}
            </button>
          );
        })}
      </Box>
    </Box>
  );
}
