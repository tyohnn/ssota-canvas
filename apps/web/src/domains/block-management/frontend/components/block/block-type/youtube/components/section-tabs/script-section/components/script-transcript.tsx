/**
 * Script Transcript
 *
 * 스크립트 트랜스크립트를 표시하는 컴포넌트
 * [시간] 스크립트 형식으로 표시
 */

'use client';

import { Box } from '@/components/ui/box';

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
  if (!transcript || transcript.length === 0) {
    return null;
  }

  // [시간] 스크립트 형식으로 표시
  return (
    <Box className="space-y-2">
      {transcript.map((segment, index) => (
        <Box key={index} className="text-sm" data-segment-time={segment.start}>
          <p>
            <span className="text-muted-foreground">
              [{formatTime(segment.start)}]
            </span>{' '}
            {segment.text}
          </p>
        </Box>
      ))}
    </Box>
  );
}
