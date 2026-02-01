/**
 * Script Transcript Item View
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 */

'use client';

import { useState } from 'react';

import { Loader2, Quote } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

import { Box } from '@/components/ui/box';

import { formatTime } from '../core/utils';

export interface ScriptTranscriptSegment {
  start: number;
  text: string;
}

export interface ScriptTranscriptItemViewProps {
  segment: ScriptTranscriptSegment;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string) => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export function ScriptTranscriptItemView({
  segment,
  onTimeClick,
  onAddQuote,
  isLoading = false,
  readonly = false,
}: ScriptTranscriptItemViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      className="text-sm group relative py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-segment-time={segment.start}
    >
      <p className="pr-10">
        <button
          type="button"
          onClick={() => onTimeClick(segment.start)}
          className="text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
        >
          [{formatTime(segment.start)}]
        </button>{' '}
        <span className="transition-colors duration-200">{segment.text}</span>
      </p>
      {isHovered && !readonly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-6 w-6"
              onClick={() => onAddQuote(segment.text)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Quote className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent hasArrow={false} sideOffset={5}>
            <p>Add to note</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Box>
  );
}
