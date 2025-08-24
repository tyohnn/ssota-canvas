"use client";

import "@vidstack/react/player/styles/base.css";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Captions, Controls, Gesture } from "@vidstack/react";
import * as Buttons from "../buttons";
import * as Menus from "../menus";
import * as Sliders from "../sliders";
import { TimeGroup } from "../time-group";

const popupOffset = 30;

export interface VideoLayoutProps {
  thumbnails?: string;
  width?: number;
}

export function VideoLayout({ thumbnails, width }: VideoLayoutProps) {
  const base = 320;
  const scale = Math.max(0.7, Math.min(1.2, (width || base) / base));
  const cssVars = {
    "--vs-btn": `${Math.round(32 * scale)}px`,
    "--vs-icon": `${Math.round(18 * scale)}px`,
    "--vs-font": `${Math.round(12 * scale)}px`,
  } as any;
  return (
    <>
      <Gestures />
      <Captions className="absolute inset-0 bottom-2 z-10 select-none break-words opacity-100 transition-[opacity,bottom] duration-300 pointer-events-none" />
      <Controls.Root
        className="absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/10 to-transparent opacity-100"
        style={cssVars}
      >
        <Tooltip.Provider>
          <div className="flex-1" />
          <Controls.Group className="-mt-0.5 flex w-full items-center px-2 pb-2">
            <Buttons.Play tooltipAlign="start" tooltipOffset={popupOffset} />
            <Sliders.VolumePopover />
            <TimeGroup />
            <span className="inline-block flex-1" />
            <Sliders.Time thumbnails={thumbnails} />
            <Menus.Captions offset={popupOffset} tooltipOffset={popupOffset} />
            <Buttons.PIP tooltipOffset={popupOffset} />
            <Buttons.Fullscreen
              tooltipAlign="end"
              tooltipOffset={popupOffset}
            />
          </Controls.Group>
        </Tooltip.Provider>
      </Controls.Root>
    </>
  );
}

function Gestures() {
  return (
    <>
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="dblpointerup"
        action="toggle:fullscreen"
      />
      <Gesture
        className="absolute left-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:-10"
      />
      <Gesture
        className="absolute right-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:10"
      />
    </>
  );
}
