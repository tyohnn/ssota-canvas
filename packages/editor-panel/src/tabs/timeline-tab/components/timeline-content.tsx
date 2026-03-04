'use client';

import { Box } from '@workspace/ui/components/ui/box';
import type { TimelineScriptLike } from '../types';
import { TimelineTableOfContents } from './timeline-table-of-contents';
import { TimelineTranscript } from './timeline-transcript';

function formatTimeAgo(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface TimelineContentProps {
  script: TimelineScriptLike;
  sourceTitle: string | undefined;
  extractedAt?: Date | string | null;
  onRefresh?: () => Promise<void>;
  switchToTab?: (tabId: string) => void;
  onTimeClick?: (seconds: number) => void;
  onAddQuote?: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex?: number | null;
  readonly?: boolean;
}

export function TimelineContent({
  script,
  sourceTitle,
  extractedAt,
  switchToTab,
  onTimeClick = () => { },
  onAddQuote = async () => { },
  loadingSegmentIndex = null,
  readonly = false,
}: TimelineContentProps) {
  const transcript = script?.transcript;

  return (
    <Box className="space-y-4 relative">
      {extractedAt && (
        <Box className="text-xs text-muted-foreground mb-2">
          Extracted {formatTimeAgo(extractedAt)}
        </Box>
      )}
      <TimelineTranscript
        transcript={transcript}
        sourceTitle={sourceTitle}
        onTimeClick={onTimeClick}
        onAddQuote={onAddQuote}
        loadingSegmentIndex={loadingSegmentIndex}
        readonly={readonly}
      />
      <TimelineTableOfContents transcript={transcript} showTOC={true} />
    </Box>
  );
}
