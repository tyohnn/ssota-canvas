/**
 * Summary Keywords
 *
 * 요약에서 추출된 키워드를 배지 형태로 표시하는 컴포넌트 (수평 스크롤)
 */

'use client';

import { Badge } from '@workspace/ui/components/ui/badge';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/ui/scroll-area';

import { Box } from '@/components/ui/box';

/**
 * Summary Keywords Props
 */
interface SummaryKeywordsProps {
  keywords: string[];
}

/**
 * Summary Keywords Component
 *
 * 키워드를 배지 형태로 수평 스크롤 가능하게 표시
 */
export function SummaryKeywords({ keywords }: SummaryKeywordsProps) {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <Box className="mb-4">
      <ScrollArea className="w-full">
        <Box className="flex gap-2 pb-2">
          {keywords.map((keyword, index) => (
            <Badge
              key={`${keyword}-${index}`}
              variant="secondary"
              className="shrink-0 cursor-default"
            >
              {keyword}
            </Badge>
          ))}
        </Box>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Box>
  );
}
