"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";

type FileNodeData = {
  name?: string;
  url?: string;
  width?: number;
  height?: number;
};

export function FileNode({ id, data, width, height, selected }: NodeProps) {
  const d = (data || {}) as FileNodeData;
  const w = (width as number) ?? d.width ?? 240;
  const h = (height as number) ?? d.height ?? 100;
  const name = d.name || "Untitled";
  const url = d.url || "";

  return (
    <NodeChrome id={id} selected={!!selected} width={w} height={h}>
      <div
        className="relative rounded border bg-white"
        style={{ width: w, height: h }}
      >
        <div className="p-2 text-xs text-muted-foreground">File</div>
        <div className="px-2 text-sm truncate" title={name}>
          {name}
        </div>
        {url && (
          <div
            className="px-2 text-[11px] text-muted-foreground truncate"
            title={url}
          >
            {url}
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
