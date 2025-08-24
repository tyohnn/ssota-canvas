"use client";

import React from "react";
import Image from "next/image";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";

type ImageNodeData = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  label?: string;
};

export function ImageNode({ id, data, width, height, selected }: NodeProps) {
  const d = (data || {}) as ImageNodeData;
  const w = (width as number) ?? d.width ?? 200;
  const h = (height as number) ?? d.height ?? 120;
  const src = d.src || "";
  const alt = d.alt || id;

  return (
    <NodeChrome id={id} selected={!!selected} width={w} height={h}>
      <div className="relative" style={{ width: w, height: h }}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={w}
            height={h}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center rounded border bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
