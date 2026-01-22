/**
 * Script Content
 *
 * 스크립트 콘텐츠를 표시하는 컴포넌트 (헤더, 트랜스크립트, 목차)
 */

'use client';

import { Box } from '@/components/ui/box';
import type { ProcessVideoScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

import { ScriptTableOfContents } from './script-table-of-contents';
import { ScriptTranscript } from './script-transcript';

/**
 * Script Content Props
 */
interface ScriptContentProps {
  script: ProcessVideoScriptDTO['youtube']['script'];
  youtubeTitle: string | undefined;
  onRefresh: () => Promise<void>;
}

/**
 * Script Content Component
 */
export function ScriptContent({ script, youtubeTitle }: ScriptContentProps) {
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
    </Box>
  );
}
