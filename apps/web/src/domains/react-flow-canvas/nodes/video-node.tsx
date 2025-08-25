"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";
import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import { VideoLayout } from "@/domains/canvas/components/vidstack/layouts/video-layout";
import "@vidstack/react/player/styles/base.css";

type VideoNodeData = {
  src?: string;
  width?: number;
  height?: number;
  label?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};

export function VideoNode({ id, data, width, height, selected }: NodeProps) {
  const d = (data || {}) as VideoNodeData;
  const w = (width as number) ?? d.width ?? 320;
  const h = (height as number) ?? d.height ?? 180;
  const src = d.src || "";

  return (
    <NodeChrome id={id} selected={!!selected} width={w} height={h}>
      <div
        className="relative rounded border bg-foreground/75"
        style={{ width: w, height: h }}
      >
        {src ? (
          <MediaPlayer
            title={d.label || "Video"}
            src={src}
            autoPlay={!!d.autoplay}
            loop={!!d.loop}
            muted={!!d.muted}
            playsInline
            className="h-full w-full rounded"
            style={{ height: "100%", width: "100%" }}
          >
            <MediaProvider>
              <Poster className="absolute inset-0 block h-full w-full rounded-md opacity-0 transition-opacity data-[visible]:opacity-100 object-cover" />
            </MediaProvider>
            <VideoLayout width={w} />
          </MediaPlayer>
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            No video
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
