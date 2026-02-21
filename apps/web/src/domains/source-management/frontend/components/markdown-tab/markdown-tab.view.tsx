/**
 * Markdown Tab View
 *
 * Summary tab과 동일한 UI (TipTap + TOC)로 source raw_content(markdown) 표시
 */

'use client';

import { Box } from '@/components/ui/box';

import { SummaryContent, SummarySectionContainer } from '@/domains/source-management/frontend/components/summary-tab';

/** Format extracted timestamp as relative time (e.g. "2 days ago"), matching event-log pattern */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface MarkdownTabViewProps {
  content: string | null | undefined;
  extractedAt?: Date | null;
  isLoading: boolean;
  error: string | null;
  hasSourceId: boolean;
  emptyMessage?: string;
}

export function MarkdownTabView({
  content,
  extractedAt,
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
      {extractedAt && (
        <Box className="text-xs text-muted-foreground mb-2">
          Extracted {formatTimeAgo(extractedAt instanceof Date ? extractedAt : new Date(extractedAt))}
        </Box>
      )}
      <SummaryContent summary={content} keywords={[]} />
    </SummarySectionContainer>
  );
}
