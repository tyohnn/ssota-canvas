'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';

import { AudioScrubber } from '@workspace/ui/components/eleven-labs/waveform';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { Slider } from '@workspace/ui/components/ui/slider';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import type { AudioPlayerProps } from '../logic/types';

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;
const SKIP_SECONDS = 10;

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
  compact = false,
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

  const handleSkipBack = useCallback(() => {
    onSeek(Math.max(0, currentTime - SKIP_SECONDS));
  }, [currentTime, onSeek]);

  const handleSkipForward = useCallback(() => {
    const end = isFinite(duration) && duration > 0 ? duration : currentTime + SKIP_SECONDS;
    onSeek(Math.min(end, currentTime + SKIP_SECONDS));
  }, [currentTime, duration, onSeek]);

  const disabled = !audioUrl || hasError || isLoading;

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
        {/* Row 1: Title (optional, when !compact) */}
        {!compact && (
          <Box className="nodrag px-3 pt-3 pb-1 shrink-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {filename || 'No track selected'}
            </h3>
          </Box>
        )}
        {/* Row 2: Waveform */}
        <Box className="nodrag px-3 pt-3 flex-1 flex items-stretch min-h-0 min-w-0">
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

        {/* Row 3: Time slider — wrapper bg keeps track visible when card has hover:bg-muted */}
        <Box className="nodrag px-3 py-1.5 shrink-0 rounded-md bg-background/95">
          <Slider
            className="w-full cursor-pointer"
            value={[progressPercent]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            disabled={disabled}
            aria-label="Seek"
          />
        </Box>

        {/* Row 4: 컨트롤 버튼 그룹 가운데 배치 */}
        <Box className="nodrag px-3 pb-3 pt-0 flex justify-center shrink-0 w-full">
          <Box className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={disabled}
              onClick={handleSkipBack}
              aria-label="Back 10 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={disabled}
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={disabled}
              onClick={handleSkipForward}
              aria-label="Forward 10 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Popover open={speedPopoverOpen} onOpenChange={setSpeedPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 min-w-9 shrink-0 font-normal"
                  disabled={disabled}
                  aria-label={`Playback speed: ${speedToLabel(playbackRate)}`}
                >
                  {speedToLabel(playbackRate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" side="top" align="center">
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
          </Box>
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
