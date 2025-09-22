"use client";

import { useEffect, useState } from "react";
import { Slider } from "@workspace/ui/components/ui/slider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/ui/popover";
import {
  VolumeX as MuteIcon,
  Volume1 as VolumeLowIcon,
  Volume2 as VolumeHighIcon,
} from "lucide-react";
import {
  formatTime,
  Thumbnail,
  useMediaRemote,
  useMediaState,
  useSliderPreview,
} from "@vidstack/react";

export function Volume() {
  const volume = useMediaState("volume"),
    canSetVolume = useMediaState("canSetVolume"),
    remote = useMediaRemote();

  if (!canSetVolume) return null;

  return (
    <Slider
      className="group relative inline-flex h-10 w-full max-w-[80px] cursor-pointer touch-none select-none items-center outline-none"
      value={[volume * 100]}
      min={0}
      max={100}
      onValueChange={(values) => {
        const next = Array.isArray(values) ? values[0] : (values as number);
        remote.changeVolume((next as number) / 100);
      }}
    />
  );
}

export function VolumePopover() {
  const volume = useMediaState("volume"),
    canSetVolume = useMediaState("canSetVolume"),
    isMuted = useMediaState("muted"),
    remote = useMediaRemote();

  if (!canSetVolume) return null;

  const icon =
    isMuted || volume === 0 ? (
      <MuteIcon className="w-5 h-5" />
    ) : volume < 0.5 ? (
      <VolumeLowIcon className="w-5 h-5" />
    ) : (
      <VolumeHighIcon className="w-5 h-5" />
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-[var(--vs-btn,32px)] w-[var(--vs-btn,32px)] items-center justify-center rounded-md hover:bg-white/15 text-white"
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="p-2 bg-black/90 border border-white/10 w-auto"
      >
        <div className="flex h-[calc(var(--vs-btn,32px)*4.5)] justify-center">
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            orientation="vertical"
            aria-label="Volume"
            className="data-[orientation=vertical]:w-6"
            onValueChange={(values) => {
              const next = Array.isArray(values)
                ? values[0]
                : (values as number);
              remote.changeVolume((next as number) / 100);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface TimeSliderProps {
  thumbnails?: string;
}

export function Time({ thumbnails }: TimeSliderProps) {
  const time = useMediaState("currentTime"),
    canSeek = useMediaState("canSeek"),
    duration = useMediaState("duration"),
    seeking = useMediaState("seeking"),
    remote = useMediaRemote(),
    step = (1 / duration) * 100,
    [value, setValue] = useState(0),
    { previewRootRef, previewRef, previewValue } = useSliderPreview({
      clamp: true,
      offset: 6,
      orientation: "horizontal",
    }),
    previewTime = (previewValue / 100) * duration;

  useEffect(() => {
    if (seeking) return;
    setValue((time / duration) * 100);
  }, [time, duration]);

  return (
    <div ref={previewRootRef} className="w-full">
      <Slider
        className="group relative inline-flex h-9 w-full cursor-pointer touch-none select-none items-center outline-none"
        value={[value]}
        min={0}
        max={100}
        disabled={!canSeek}
        step={Number.isFinite(step) ? step : 1}
        onValueChange={(values) => {
          const next = Array.isArray(values)
            ? (values[0] as number)
            : (values as number);
          setValue(next);
          remote.seeking((next / 100) * duration);
        }}
        onValueCommit={(values) => {
          const next = Array.isArray(values)
            ? (values[0] as number)
            : (values as number);
          remote.seek((next / 100) * duration);
        }}
      />
      <div
        className="flex flex-col items-center absolute opacity-0 data-[visible]:opacity-100 transition-opacity duration-200 will-change-[left] pointer-events-none"
        ref={previewRef}
      >
        {thumbnails ? (
          <Thumbnail.Root
            src={thumbnails}
            time={previewTime}
            className="block mb-2 h-[var(--thumbnail-height)] max-h-[160px] min-h-[80px] w-[var(--thumbnail-width)] min-w-[120px] max-w-[180px] overflow-hidden border border-white bg-black"
          >
            <Thumbnail.Img />
          </Thumbnail.Root>
        ) : null}
        <span className="text-[13px]">{formatTime(previewTime)}</span>
      </div>
    </div>
  );
}
