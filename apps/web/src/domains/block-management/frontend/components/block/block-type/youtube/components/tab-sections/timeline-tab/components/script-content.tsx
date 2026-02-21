/**
 * Script Content
 *
 * 스크립트 콘텐츠를 표시하는 컴포넌트 (헤더, 트랜스크립트, 목차)
 */

'use client';

import { Box } from '@/components/ui/box';
import type { YoutubeScript } from '@/domains/youtube-app-space/shared/types/transcript.types';

import { ScriptTableOfContents } from './script-table-of-contents';
import { ScriptTranscript } from './script-transcript';

/** Format extracted timestamp as relative time (e.g. "2 days ago"), matching event-log pattern */
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

interface ScriptContentProps {
  script: YoutubeScript;
  youtubeTitle: string | undefined;
  extractedAt?: Date | string | null;
  onRefresh: () => Promise<void>;
}

export function ScriptContent({
  script,
  youtubeTitle,
  extractedAt,
}: ScriptContentProps) {
  return (
    <Box className="space-y-4 relative">
      <ScriptTranscript
        transcript={script?.transcript}
        youtubeTitle={youtubeTitle}
      />
      <ScriptTableOfContents
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
