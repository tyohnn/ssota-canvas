'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

import { AudioScrubber } from '@workspace/ui/components/eleven-labs/waveform';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { Slider } from '@workspace/ui/components/ui/slider';
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

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;

function speedToLabel(rate: number): string {
  return rate === 1 ? '1x' : `${Number(rate.toFixed(2))}x`;
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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedPopoverOpen, setSpeedPopoverOpen] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [audioRef, playbackRate]);

  const progressPercent =
    duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  const handleProgressChange = useCallback(
    (value: number[]) => {
      const v = value[0];
      if (v !== undefined && duration > 0 && isFinite(duration)) {
        const time = (v / 100) * duration;
        onSeek(time);
      }
    },
    [duration, onSeek]
  );

  const handleSelectSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    setSpeedPopoverOpen(false);
  }, []);

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
        <Box className="nodrag px-4 pt-4 pb-2 shrink-0">
          <Box className="mb-4">
            <h3 className="text-base font-semibold sm:text-lg">
              {filename || 'No track selected'}
            </h3>
          </Box>
          <Box className="flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="h-12 w-12 shrink-0 sm:h-10 sm:w-10"
              disabled={!audioUrl || hasError || isLoading}
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <div className="flex flex-1 items-center gap-2 sm:gap-3">
              <span className="text-muted-foreground text-xs tabular-nums min-w-10">
                {formatTime(currentTime)}
              </span>
              <Slider
                className="flex-1 cursor-pointer"
                value={[progressPercent]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                disabled={!audioUrl || hasError || isLoading}
                aria-label="Seek"
              />
              <span className="text-muted-foreground text-xs tabular-nums min-w-10">
                {formatTime(duration)}
              </span>
              <Popover open={speedPopoverOpen} onOpenChange={setSpeedPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    disabled={!audioUrl || hasError || isLoading}
                    aria-label={`Playback speed: ${speedToLabel(playbackRate)}`}
                  >
                    {speedToLabel(playbackRate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1" align="end">
                  <div className="flex flex-col">
                    {SPEED_OPTIONS.map(rate => (
                      <Button
                        key={rate}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'justify-center font-normal',
                          playbackRate === rate && 'bg-accent'
                        )}
                        onClick={() => handleSelectSpeed(rate)}
                      >
                        {speedToLabel(rate)}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </Box>
        </Box>

        <Box className="nodrag px-4 pb-4 flex-1 flex items-stretch min-h-0 min-w-0">
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
          <span className="text-sm font-medium">Failed to load audio</span>
        </Box>
      )}
    </>
  );
}
