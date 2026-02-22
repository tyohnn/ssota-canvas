/**
 * Timeline Content
 *
 * 타임라인 스크립트 콘텐츠를 표시하는 컴포넌트 (트랜스크립트, 목차)
 */

'use client';

import { Box } from '@/components/ui/box';
import type { TimelineScript } from '@/domains/source-management/shared/types/timeline-script.types';

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

interface TimelineContentProps {
  script: TimelineScript;
  sourceTitle: string | undefined;
  extractedAt?: Date | string | null;
  onRefresh: () => Promise<void>;
}

export function TimelineContent({
  script,
  sourceTitle,
  extractedAt,
}: TimelineContentProps) {
  return (
    <Box className="space-y-4 relative">
      <TimelineTranscript
        transcript={script?.transcript}
        sourceTitle={sourceTitle}
      />
      <TimelineTableOfContents
        transcript={script?.transcript}
        showTOC={true}
      />
      {extractedAt && (
        <Box className="text-xs text-muted-foreground pt-2">
          Extracted {formatTimeAgo(extractedAt)}
        </Box>
      )}
    </Box>
  );
}
