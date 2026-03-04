'use client';

import { Box } from '@workspace/ui/components/ui/box';
import { SummaryContent } from '../summary-tab/components/summary-content';
import { SummarySectionContainer } from '../summary-tab/components/summary-section-container';
import type { MarkdownTabViewProps } from './types';
import type { SummaryContentDeps } from '../summary-tab/types';

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

export interface MarkdownTabViewPropsWithDeps extends MarkdownTabViewProps {
  summaryContentDeps: SummaryContentDeps;
}

export function MarkdownTabView({
  content,
  extractedAt,
  isLoading,
  error,
  hasSourceId,
  emptyMessage = 'No content yet. Extraction runs automatically when you add a URL.',
  summaryContentDeps,
}: MarkdownTabViewPropsWithDeps) {
  if (!hasSourceId) {
    return (
      <SummarySectionContainer>
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">Enter a URL and load metadata first.</p>
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
          Extracted{' '}
          {formatTimeAgo(extractedAt instanceof Date ? extractedAt : new Date(extractedAt))}
        </Box>
      )}
      <SummaryContent summary={content} keywords={[]} deps={summaryContentDeps} />
    </SummarySectionContainer>
  );
}
