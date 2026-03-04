'use client';

import { Badge } from '@workspace/ui/components/ui/badge';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/ui/scroll-area';
import { Box } from '@workspace/ui/components/ui/box';

export interface SummaryKeywordsProps {
  keywords: string[];
}

export function SummaryKeywords({ keywords }: SummaryKeywordsProps) {
  if (!keywords || keywords.length === 0) return null;

  return (
    <Box className="mb-4">
      <ScrollArea className="w-full">
        <Box className="flex gap-2 pb-2">
          {keywords.map((keyword, index) => (
            <Badge key={`${keyword}-${index}`} variant="secondary" className="shrink-0 cursor-default">
              {keyword}
            </Badge>
          ))}
        </Box>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Box>
  );
}
