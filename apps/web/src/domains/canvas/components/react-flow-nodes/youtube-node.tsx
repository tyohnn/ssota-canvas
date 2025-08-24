"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import { VideoLayout } from "@/domains/canvas/components/vidstack/layouts/video-layout";
import "@vidstack/react/player/styles/base.css";

type YoutubeNodeData = {
  url?: string; // https://www.youtube.com/watch?v=VIDEO_ID
  width?: number;
  height?: number;
};

function toEmbedUrl(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return "";
  }
}

export function YoutubeNode({ id, data, width, height, selected }: NodeProps) {
  const d = (data || {}) as YoutubeNodeData;
  const w = (width as number) ?? d.width ?? 320;
  const h = (height as number) ?? d.height ?? 180;
  const embed = toEmbedUrl(d.url);

  return (
    <NodeChrome id={id} selected={!!selected} width={w} height={h}>
      <div
        className="relative rounded border bg-foreground/75"
        style={{ width: w, height: h }}
      >
        {d.url ? (
          <MediaPlayer
            title="YouTube"
            src={d.url}
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
            No YouTube URL
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
