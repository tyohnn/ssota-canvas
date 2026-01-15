/**
 * Script Content
 *
 * 스크립트 콘텐츠를 표시하는 컴포넌트 (헤더, 트랜스크립트, 목차)
 */

'use client';

import { useRef } from 'react';

import { Sparkles } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';

import { Box } from '@/components/ui/box';
import type { GetScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

import { ScriptHeader } from './script-header';
import { ScriptTableOfContents } from './script-table-of-contents';
import { useScrollSpy } from './script-table-of-contents/core/use-scroll-spy';
import { ScriptTranscript } from './script-transcript';

/**
 * Script Content Props
 */
interface ScriptContentProps {
  script: GetScriptDTO['youtube']['script'];
  youtubeTitle: string | undefined;
  onRefresh: () => Promise<void>;
}

/**
 * Script Content Component
 */
export function ScriptContent({ script, youtubeTitle }: ScriptContentProps) {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const { showTOC } = useScrollSpy(headerRef);

  return (
    <Box className="space-y-4 relative">
      <Box className="flex items-center justify-between">
        <ScriptHeader ref={headerRef} youtubeTitle={youtubeTitle} />
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Smart Summary
        </Button>
      </Box>
      <ScriptTranscript
        transcript={script?.transcript}
        youtubeTitle={youtubeTitle}
      />
      <ScriptTableOfContents
        transcript={script?.transcript}
        showTOC={showTOC}
      />
    </Box>
  );
}
