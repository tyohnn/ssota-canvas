/**
 * Script No Script State
 *
 * 스크립트가 없을 때 표시하는 컴포넌트
 */

'use client';

import { useRef } from 'react';

import { Info } from 'lucide-react';

import { Box } from '@/components/ui/box';
import type { GetScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

import { ExtractScriptButton } from './extract-script-button';
import { ScriptContent } from './script-content';
import { useScrollSpy } from './script-table-of-contents/core/use-scroll-spy';

/**
 * Script No Script State Props
 */
interface ScriptNoScriptStateProps {
  onExtractScript: () => Promise<void>;
  isExtracting?: boolean;
}

/**
 * 예시 스크립트 데이터 생성
 */
function createExampleScript(): GetScriptDTO['youtube']['script'] {
  return {
    transcript: [
      {
        text: 'Welcome to this tutorial on React development.',
        start: 0,
        duration: 3.5,
      },
      {
        text: 'Today we will learn about component architecture.',
        start: 3.5,
        duration: 4.2,
      },
      {
        text: 'First, let us understand the basics of React hooks.',
        start: 7.7,
        duration: 4.8,
      },
      {
        text: 'Hooks allow us to use state and lifecycle features.',
        start: 12.5,
        duration: 4.1,
      },
      {
        text: 'The useState hook is one of the most commonly used hooks.',
        start: 16.6,
        duration: 4.5,
      },
      {
        text: 'It helps us manage component state efficiently.',
        start: 21.1,
        duration: 3.9,
      },
      {
        text: 'Next, we will explore the useEffect hook.',
        start: 25.0,
        duration: 3.7,
      },
      {
        text: 'This hook is perfect for side effects and data fetching.',
        start: 28.7,
        duration: 4.3,
      },
    ],
    metadata: {
      extractedAt: new Date().toISOString(),
      totalDuration: 33.0,
      totalSegments: 8,
      language: 'en',
    },
  };
}

/**
 * Script No Script State Component
 */
export function ScriptNoScriptState({
  onExtractScript,
  isExtracting = false,
}: ScriptNoScriptStateProps) {
  const headerRef = useRef<HTMLHeadingElement>(null);
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
      <ExtractScriptButton
        onExtractScript={onExtractScript}
        isLoading={isExtracting}
      />

      {/* 브라우저 스타일 미리보기 카드 - 좌측 상단이 확대된 것처럼 보이도록 */}
      <Box className="mt-6 relative group overflow-hidden h-[400px] rounded-tl-lg">
        {/* 그라데이션 페이드 효과 (우측 하단) */}
        <Box className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-background/80 pointer-events-none z-20 rounded-tl-lg" />
        <Box className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-background/60 pointer-events-none z-20 rounded-tl-lg" />
        {/* 하단 페이드 효과 */}
        <Box className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/80 pointer-events-none z-20 rounded-tl-lg" />

        {/* 확대된 브라우저 콘텐츠 */}
        <Box className="origin-top-left scale-150 w-2/3 h-2/3 will-change-transform">
          {/* 브라우저 콘텐츠 영역 - 우측은 수평선으로 이어지도록 */}
          <Box className="bg-background border-l border-t border-b border-border/50 shadow-lg min-h-[800px] rounded-tl-lg">
            <Box className="p-4">
              <ScriptContent
                script={exampleScript}
                youtubeTitle="Example Tutorial Video"
                onRefresh={async () => {}}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
