"use client";

import React from "react";
import type { NodeProps } from "@xyflow/react";

type MathNodeData = {
  latex?: string;
  displayMode?: boolean;
  width?: number;
  height?: number;
};

export function MathFormulaNode({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps) {
  const d = (data || {}) as MathNodeData;
  const w = (width as number) ?? d.width ?? 240;
  const h = (height as number) ?? d.height ?? 100;
  const latex = d.latex || "\\sum_{i=1}^n i = n(n+1)/2";

  return (
      <div
        className="relative rounded border bg-white"
        style={{ width: w, height: h }}
      >
        <div className="p-2 text-xs text-muted-foreground">Math Formula</div>
        <div className="px-2 text-sm whitespace-pre-wrap break-words">
          {latex}
        </div>
      </div>
  );
}
