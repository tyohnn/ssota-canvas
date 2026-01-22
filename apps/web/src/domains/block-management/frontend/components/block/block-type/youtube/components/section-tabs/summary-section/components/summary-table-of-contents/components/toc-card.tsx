/**
 * Summary TOC Card Component
 *
 * 호버 시 나타나는 목차 카드 컴포넌트 (h1, h2, h3 3단계)
 */

'use client';

import { Box } from '@/components/ui/box';

import type { SummaryTOCItem } from '../core/utils';

/**
 * Summary TOC Card Props
 */
interface SummaryTOCCardProps {
  headings: SummaryTOCItem[];
  getActiveHeading: (item: SummaryTOCItem) => boolean;
  onItemClick: (item: SummaryTOCItem) => void;
}

/**
 * Summary TOC Card Component
 */
export function SummaryTOCCard({
  headings,
  getActiveHeading,
  onItemClick,
}: SummaryTOCCardProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <Box className="absolute right-0 top-1/2 -translate-y-1/2 bg-background border border-border rounded-md shadow-lg p-3 overflow-y-auto max-h-[400px] min-w-[200px] max-w-[300px]">
      <Box className="space-y-1">
        {headings.map((item) => {
          const isActive = getActiveHeading(item);
          const indentClass =
            item.level === 1
              ? 'pl-0'
              : item.level === 2
                ? 'pl-4'
                : 'pl-8'; // h3는 더 많이 들여쓰기

          return (
            <button
              key={item.id}
              className={`w-full text-left cursor-pointer hover:bg-muted/50 py-1.5 rounded transition-colors text-xs ${isActive
                ? 'text-primary font-medium bg-muted/30'
                : 'text-muted-foreground hover:text-foreground'
                } ${indentClass}`}
              onClick={() => onItemClick(item)}
            >
              {item.text}
            </button>
          );
        })}
      </Box>
    </Box>
  );
}
