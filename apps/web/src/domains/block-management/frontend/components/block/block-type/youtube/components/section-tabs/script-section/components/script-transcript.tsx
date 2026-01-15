/**
 * Script Transcript
 *
 * 스크립트 트랜스크립트를 표시하는 컴포넌트
 * [시간] 스크립트 형식으로 표시
 */

'use client';

import { Box } from '@/components/ui/box';
import { useEditorPanelContext } from '@/domains/block-management/frontend/components/editor-panel/core/context';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';

import { formatTime } from '../core/utils';

/**
 * Script Transcript Segment
 */
interface ScriptTranscriptSegment {
  start: number;
  text: string;
}

/**
 * Script Transcript Props
 */
interface ScriptTranscriptProps {
  transcript: ScriptTranscriptSegment[] | undefined;
}

/**
 * Script Transcript Component
 */
export function ScriptTranscript({ transcript }: ScriptTranscriptProps) {
  const { blockMountId } = useEditorPanelContext();
  const { getBlockInteractions } = useBlockInteraction();

  if (!transcript || transcript.length === 0) {
    return null;
  }

  const handleTimeClick = (seconds: number) => {
    const interactions = getBlockInteractions(blockMountId);
    if (interactions?.seekTo) {
      interactions.seekTo(seconds);
    }
  };

  // [시간] 스크립트 형식으로 표시
  return (
    <Box className="space-y-2">
      {transcript.map((segment, index) => (
        <Box key={index} className="text-sm" data-segment-time={segment.start}>
          <p>
            <button
              type="button"
              onClick={() => handleTimeClick(segment.start)}
              className="text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
            >
              [{formatTime(segment.start)}]
            </button>{' '}
            {segment.text}
          </p>
        </Box>
      ))}
    </Box>
  );
}
