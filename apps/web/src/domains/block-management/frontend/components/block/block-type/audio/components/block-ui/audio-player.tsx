'use client';

import { AudioLines, Pause, Play } from 'lucide-react';

import { AudioScrubber } from '@workspace/ui/components/eleven-labs/waveform';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

export interface AudioPlayerProps {
  audioUrl: string;
  filename: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: number[];
  isLoading: boolean;
  hasError: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}

export function AudioPlayer({
  audioUrl,
  filename,
  isPlaying,
  currentTime,
  duration,
  waveformData,
  isLoading,
  hasError,
  audioRef,
  onTogglePlay,
  onSeek,
  formatTime,
}: AudioPlayerProps) {
  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {isLoading && !hasError && (
        <Box className="absolute inset-0 bg-muted animate-pulse" />
      )}

      <Box
        className={cn(
          'absolute inset-0 flex flex-col',
          (isLoading || hasError) && 'opacity-0',
          'transition-opacity duration-300'
        )}
      >
        <Box className="px-4 pt-4 pb-2">
          <Box className="flex items-start gap-3">
            <button
              type="button"
              onClick={onTogglePlay}
              disabled={!audioUrl || hasError || isLoading}
              className={cn(
                'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'transition-colors duration-200',
                'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            <Box className="flex-1 min-w-0">
              {filename ? (
                <Box className="text-sm font-medium text-foreground truncate">
                  {filename}
                </Box>
              ) : (
                <Box className="text-sm font-medium text-muted-foreground truncate">
                  Untitled Audio
                </Box>
              )}
            </Box>

            <Box className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Box>
          </Box>
        </Box>

        <Box className="px-4 pb-4 flex-1 flex items-stretch min-h-0 min-w-0">
          <AudioScrubber
            data={waveformData}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            showHandle={true}
            barWidth={2}
            barGap={1}
            barRadius={1}
            height="100%"
            className="w-full"
          />
        </Box>
      </Box>

      {hasError && (
        <Box className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 backdrop-blur-sm">
          <AudioLines className="h-12 w-12 mb-2" />
          <span className="text-sm font-medium">Failed to load audio</span>
        </Box>
      )}
    </>
  );
}
