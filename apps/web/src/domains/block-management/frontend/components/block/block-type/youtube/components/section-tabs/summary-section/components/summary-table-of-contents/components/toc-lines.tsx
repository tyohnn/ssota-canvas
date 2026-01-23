/**
 * Summary TOC Lines Component
 *
 * 목차 수평선 영역을 표시하는 컴포넌트 (h1, h2, h3 3단계 길이)
 */

'use client';

import { Box } from '@/components/ui/box';

import type { SummaryTOCItem } from '../core/utils';

/**
 * Summary TOC Lines Props
 */
interface SummaryTOCLinesProps {
  headings: SummaryTOCItem[];
  isHovered: boolean;
  getActiveHeading: (item: SummaryTOCItem) => boolean;
  onItemClick: (item: SummaryTOCItem) => void;
}

/**
 * Summary TOC Lines Component
 */
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
      className={`relative flex flex-col items-end rounded-md transition-all w-[25px] gap-0.5 p-1 ${isHovered ? 'bg-background/95' : 'bg-transparent'
        }`}
    >
      {headings.map((item) => {
        const isActive = getActiveHeading(item);
        // 레벨에 따른 길이: h1=긴 선, h2=중간 선, h3=짧은 선
        const widthClass =
          item.level === 1
            ? 'w-4 group-hover:w-5' // h1: 가장 긴 선
            : item.level === 2
              ? 'w-3 group-hover:w-4' // h2: 중간 선
              : 'w-2 group-hover:w-3'; // h3: 짧은 선

        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="group relative flex items-center justify-end cursor-pointer py-0.5 w-full"
            aria-label={`Go to ${item.text}`}
          >
            {/* 가로 대시 - 레벨에 따라 다른 길이 */}
            <Box
              className={`h-px transition-all ${widthClass} ${isActive
                ? 'bg-primary'
                : 'bg-border/60 group-hover:bg-foreground/60'
                }`}
            />
          </button>
        );
      })}
    </Box>
  );
}
