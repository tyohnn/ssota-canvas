/**
 * Markdown Tab View
 *
 * Summary tab과 동일한 UI (TipTap + TOC)로 source raw_content(markdown) 표시
 */

'use client';

import { Box } from '@/components/ui/box';

import { SummaryContent, SummarySectionContainer } from '@/domains/source-management/frontend/components/summary-tab';

export interface MarkdownTabViewProps {
  content: string | null | undefined;
  isLoading: boolean;
  error: string | null;
  hasSourceId: boolean;
  emptyMessage?: string;
}

export function MarkdownTabView({
  content,
  isLoading,
  error,
  hasSourceId,
  emptyMessage = 'No content yet. Extraction runs automatically when you add a URL.',
}: MarkdownTabViewProps) {
  if (!hasSourceId) {
    return (
      <SummarySectionContainer>
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Enter a URL and load metadata first.
          </p>
        </Box>
      </SummarySectionContainer>
    );
  }

  if (error) {
    return (
      <SummarySectionContainer>
        <Box className="text-sm text-destructive py-4">{error}</Box>
      </SummarySectionContainer>
    );
  }

  if (isLoading) {
    return (
      <SummarySectionContainer>
        <Box className="text-sm text-muted-foreground py-4">Loading...</Box>
      </SummarySectionContainer>
    );
  }

  if (!content || !content.trim()) {
    return (
      <SummarySectionContainer>
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </Box>
      </SummarySectionContainer>
    );
  }

  return (
    <SummarySectionContainer>
      <SummaryContent summary={content} keywords={[]} />
    </SummarySectionContainer>
  );
}
