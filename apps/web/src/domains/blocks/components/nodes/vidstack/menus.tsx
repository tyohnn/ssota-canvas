"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
} from "@workspace/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/ui/tooltip";
import { useCaptionOptions, useMediaPlayer } from "@vidstack/react";
import {
  CheckCircle,
  Circle as CircleIcon,
  Subtitles as SubtitlesIcon,
} from "lucide-react";

import { buttonClass, tooltipClass } from "./buttons";

export interface MenuProps {
  side?: React.ComponentProps<typeof DropdownMenuContent>["side"];
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"];
  offset?: React.ComponentProps<typeof DropdownMenuContent>["sideOffset"];
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
  tooltipAlign?: React.ComponentProps<typeof TooltipContent>["align"];
  tooltipOffset?: number;
}

const menuClass =
  "z-[9999] flex max-h-[400px] min-w-[240px] flex-col rounded-md border border-white/10 bg-black/90 p-2 font-sans text-[14px] font-medium";

export function Captions({
  side = "top",
  align = "end",
  offset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipOffset = 0,
}: MenuProps) {
  const player = useMediaPlayer(),
    options = useCaptionOptions(),
    hint = options.selectedTrack?.label ?? "Off";
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label="Settings"
            className={buttonClass}
            disabled={options.disabled}
          >
            <SubtitlesIcon className="w-7 h-7" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          className={tooltipClass}
          side={tooltipSide}
          align={tooltipAlign}
          sideOffset={tooltipOffset}
        >
          Captions
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className={menuClass}
        side={side}
        align={align}
        sideOffset={offset}
      >
        <DropdownMenuLabel className="flex items-center w-full px-1.5 mb-2 font-medium text-[15px]">
          <SubtitlesIcon className="w-5 h-5 mr-1.5 translate-y-px" />
          Captions
          <span className="ml-auto text-sm text-white/50">{hint}</span>
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-label="Captions"
          className="w-full flex flex-col"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => {
            return (
              <button
                key={value}
                className="ring-media-focus group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 outline-none hocus:bg-white/10 data-[focus]:ring-[3px] text-sm text-left"
                onClick={(e) => {
                  e.preventDefault();
                  select();
                }}
              >
                <CircleIcon className="h-4 w-4 text-white group-data-[state=checked]:hidden" />
                <CheckCircle className="text-media-brand hidden h-4 w-4 group-data-[state=checked]:block" />
                <span className="ml-2">{label}</span>
              </button>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
