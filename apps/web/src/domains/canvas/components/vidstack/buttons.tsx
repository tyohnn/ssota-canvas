"use client";

import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/ui/tooltip";
import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  useMediaState,
} from "@vidstack/react";
import {
  Minimize as FullscreenExitIcon,
  Maximize as FullscreenIcon,
  VolumeX as MuteIcon,
  PauseIcon,
  PictureInPictureIcon as PictureInPictureExitIcon,
  PictureInPicture2 as PictureInPictureIcon,
  PlayIcon,
  SubtitlesIcon,
  Volume2 as VolumeHighIcon,
  Volume1 as VolumeLowIcon,
} from "lucide-react";

type TooltipSide = React.ComponentProps<typeof TooltipContent>["side"];
type TooltipAlign = React.ComponentProps<typeof TooltipContent>["align"];

export interface MediaButtonProps {
  tooltipSide?: TooltipSide;
  tooltipAlign?: TooltipAlign;
  tooltipOffset?: number;
}

export const buttonClass =
  "group relative inline-flex h-[var(--vs-btn,32px)] w-[var(--vs-btn,32px)] cursor-pointer items-center justify-center rounded-md outline-none hover:bg-white/15 focus-visible:ring-2 ring-white/40 text-white";

export const tooltipClass =
  "z-50 rounded-sm bg-black/90 px-2 py-0.5 text-xs font-medium text-white";

export function Play({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isPaused = useMediaState("paused");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PlayButton className={buttonClass}>
          {isPaused ? (
            <PlayIcon className="w-7 h-7 translate-x-px" />
          ) : (
            <PauseIcon className="w-7 h-7" />
          )}
        </PlayButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isPaused ? "Play" : "Pause"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Mute({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const volume = useMediaState("volume"),
    isMuted = useMediaState("muted");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <MuteButton className={buttonClass}>
          {isMuted || volume == 0 ? (
            <MuteIcon className="w-7 h-7" />
          ) : volume < 0.5 ? (
            <VolumeLowIcon className="w-7 h-7" />
          ) : (
            <VolumeHighIcon className="w-7 h-7" />
          )}
        </MuteButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isMuted ? "Unmute" : "Mute"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Caption({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const track = useMediaState("textTrack"),
    isOn = track && isTrackCaptionKind(track);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CaptionButton className={buttonClass}>
          <SubtitlesIcon
            className={`w-7 h-7 ${!isOn ? "text-white/60" : ""}`}
          />
        </CaptionButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isOn ? "Closed-Captions Off" : "Closed-Captions On"}
      </TooltipContent>
    </Tooltip>
  );
}

export function PIP({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("pictureInPicture");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PIPButton className={buttonClass}>
          {isActive ? (
            <PictureInPictureExitIcon className="w-7 h-7" />
          ) : (
            <PictureInPictureIcon className="w-7 h-7" />
          )}
        </PIPButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Exit PIP" : "Enter PIP"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Fullscreen({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("fullscreen");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <FullscreenButton className={buttonClass}>
          {isActive ? (
            <FullscreenExitIcon className="w-7 h-7" />
          ) : (
            <FullscreenIcon className="w-7 h-7" />
          )}
        </FullscreenButton>
      </TooltipTrigger>
      <TooltipContent
        className={tooltipClass}
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Exit Fullscreen" : "Enter Fullscreen"}
      </TooltipContent>
    </Tooltip>
  );
}
