'use client';

import { useState } from 'react';
import { Loader2, Quote } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Box } from '@workspace/ui/components/ui/box';
import { formatTime } from '../../../core/utils';

export interface TimelineTranscriptSegmentLike {
  text: string;
  start: number;
  duration?: number;
  speakerId?: string;
}

export interface TimelineTranscriptItemViewProps {
  segment: TimelineTranscriptSegmentLike;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string) => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export function TimelineTranscriptItemView({
  segment,
  onTimeClick,
  onAddQuote,
  isLoading = false,
  readonly = false,
}: TimelineTranscriptItemViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      className="text-sm group relative py-1 pr-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-segment-time={segment.start}
    >
      <button
        type="button"
        onClick={() => onTimeClick(segment.start)}
        className="w-full text-left text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 py-0.5 -my-0.5"
      >
        <span className="font-medium tabular-nums">[{formatTime(segment.start)}]</span>
        {segment.speakerId != null && (
          <>
            {' '}
            <span className="text-muted-foreground/80 font-normal" title="Speaker">
              {segment.speakerId}:
            </span>
          </>
        )}
        {' '}
        <span className="transition-colors duration-200">{segment.text}</span>
      </button>
      {isHovered && !readonly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onAddQuote(segment.text);
              }}
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
