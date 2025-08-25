"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";

type WebviewNodeData = {
  url?: string;
  width?: number;
  height?: number;
  label?: string;
};

export function WebviewNode({ id, data, width, height, selected }: NodeProps) {
  const d = (data || {}) as WebviewNodeData;
  const w = (width as number) ?? d.width ?? 320;
  const h = (height as number) ?? d.height ?? 180;
  const url = d.url || "";

  return (
    <NodeChrome id={id} selected={!!selected} width={w} height={h}>
      <div
        className="relative rounded border bg-white"
        style={{ width: w, height: h }}
      >
        {url ? (
          <iframe src={url} className="h-full w-full rounded" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            No URL
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
