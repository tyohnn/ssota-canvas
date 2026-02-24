/**
 * Timeline No Script State
 *
 * 타임라인 스크립트가 없을 때 표시하는 컴포넌트
 */

'use client';

import { Info } from 'lucide-react';

import { Box } from '@/components/ui/box';
import type { TimelineScript } from '@/domains/source-management/shared/types/timeline-script.types';

import { TimelineContent } from '../timeline-content';

interface TimelineNoScriptStateProps {
  onExtractScript: () => Promise<void>;
  isExtracting?: boolean;
}

function createExampleScript(): TimelineScript {
  return {
    transcript: [
      { text: 'Welcome to this tutorial on React development.', start: 0, duration: 3.5 },
      { text: 'Today we will learn about component architecture.', start: 3.5, duration: 4.2 },
      { text: 'First, let us understand the basics of React hooks.', start: 7.7, duration: 4.8 },
      { text: 'Hooks allow us to use state and lifecycle features.', start: 12.5, duration: 4.1 },
      { text: 'The useState hook is one of the most commonly used hooks.', start: 16.6, duration: 4.5 },
      { text: 'It helps us manage component state efficiently.', start: 21.1, duration: 3.9 },
      { text: 'Next, we will explore the useEffect hook.', start: 25.0, duration: 3.7 },
      { text: 'This hook is perfect for side effects and data fetching.', start: 28.7, duration: 4.3 },
    ],
    metadata: {
      extractedAt: new Date().toISOString(),
      totalDuration: 33.0,
      totalSegments: 8,
      language: 'en',
    },
  };
}

export function TimelineNoScriptState({
  onExtractScript,
  isExtracting = false,
}: TimelineNoScriptStateProps) {
  const exampleScript = createExampleScript();

  return (
    <>
      <Box className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
        <p className="text-center text-sm text-foreground">
          <Info
            aria-hidden="true"
            className="-mt-0.5 me-3 inline-flex opacity-60"
            size={16}
          />
          No script available. Extract script from YouTube video to view the
          transcript.
        </p>
      </Box>

      <Box className="mt-6 relative group overflow-hidden h-[400px] rounded-tl-lg">
        <Box className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-background/80 pointer-events-none z-20 rounded-tl-lg" />
        <Box className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-background/60 pointer-events-none z-20 rounded-tl-lg" />
        <Box className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/80 pointer-events-none z-20 rounded-tl-lg" />

        <Box className="origin-top-left scale-150 w-2/3 h-2/3 will-change-transform">
          <Box className="bg-background border-l border-t border-b border-border/50 shadow-lg min-h-[800px] rounded-tl-lg">
            <Box className="p-4">
              <TimelineContent
                script={exampleScript}
                sourceTitle="Example Tutorial Video"
                onRefresh={async () => {}}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
