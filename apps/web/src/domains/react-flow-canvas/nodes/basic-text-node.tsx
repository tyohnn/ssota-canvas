"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeChrome } from "./node-chrome";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { Toggle } from "@workspace/ui/components/ui/toggle";
import { ALargeSmall } from "lucide-react";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/canvas/policy/shape-policy";
import { useBasicTextNodeUpdater } from "../utils/node-updater";
import { useSelectionCommands } from "../contexts/SelectionContext";

export type BasicTextNodeData = {
  label?: string;
  block?: any; // Block data containing metadata
  // Legacy properties for backward compatibility (will be removed)
  color?: ColorKey;
  weight?: "normal" | "bold" | "bolder";
  fontSize?: "12px" | "14px" | "16px" | "18px" | "20px";
  width?: number;
  height?: number;
};

export function BasicTextNode({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const d = (data || {}) as BasicTextNodeData;
  const commands = useCanvasCommandsContext();
  const { updateColor, updateFontSize, updateLabel, updateSize } = useBasicTextNodeUpdater();
  const selectionCommands = useSelectionCommands();

  // Get metadata from block data (same as shape-node.tsx)
  const block = data?.block as any;
  const metadata = (block?.metadata || {}) as any;
  const nodeUi = (metadata?.node_ui || {}) as any;

  // Extract values from metadata with fallbacks (same as shape-node.tsx)
  const label = d.label ?? data?.name ?? id;

  // Color handling with validation and HEX mapping (same as shape-node.tsx)
  const rawColor = nodeUi?.color ?? ShapePolicy.getDefaultColor();
  const availableColors = ShapePolicy.getColorOptions().map((c) => c.value);

  // If rawColor is a HEX value, map it to closest ColorKey
  const color = rawColor.startsWith("#")
    ? ShapePolicy.getClosestColorKey(rawColor)
    : availableColors.includes(rawColor)
      ? (rawColor as ColorKey)
      : ShapePolicy.getDefaultColor();

  const weight = "bold"; // 항상 bold로 고정
  const fontSize = nodeUi?.fontSize ?? "32px";
  
  // React Flow props가 최우선, 그 다음 metadata, 마지막 기본값 (same as shape-node.tsx)
  const width = Math.max(80, (nodeW as number) || nodeUi?.size?.width || 160);
  const height = Math.max(40, (nodeH as number) || nodeUi?.size?.height || 64);
  


  // Capture initial (base) size for proportional font scaling
  const baseSizeRef = useRef<{ w: number; h: number } | null>(null);
  if (!baseSizeRef.current) {
    const baseW = nodeUi?.size?.width || 160;
    const baseH = nodeUi?.size?.height || 64;
    baseSizeRef.current = { w: Math.max(1, baseW), h: Math.max(1, baseH) };
  }

  const parsePx = (px: string | number | undefined): number => {
    if (typeof px === "number") return px;
    if (!px) return 32;
    const m = String(px).match(/\d+/);
    return m ? parseInt(m[0], 10) : 32;
  };

  const baseFontPx = parsePx(fontSize);
  const scaleW = width / (baseSizeRef.current?.w || width);
  const scaleH = height / (baseSizeRef.current?.h || height);
  const scale = Math.min(scaleW, scaleH);
  const scaledFontPx = Math.max(
    10,
    Math.round(baseFontPx * (Number.isFinite(scale) ? scale : 1))
  );

  // Inline label state (always-on input)
  const [draftLabel, setDraftLabel] = useState(label);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setDraftLabel(label);
  }, [label]);

  // Function to measure text dimensions and update node size
  const measureAndUpdateSize = useCallback(
    (text: string) => {
      if (!measureRef.current) return;

      // Get current font size from metadata to ensure we use the latest value
      const currentMetadata = (block?.metadata || {}) as any;
      const currentNodeUi = currentMetadata.node_ui || {};
      const currentFontSize = currentNodeUi.fontSize ?? fontSize;
      const currentWeight = currentNodeUi.weight ?? weight;

      const currentFontPx = parsePx(currentFontSize);

      // Create a temporary element to measure text
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.visibility = "hidden";
      tempDiv.style.whiteSpace = "pre-wrap";
      tempDiv.style.wordBreak = "break-word";
      tempDiv.style.fontSize = `${currentFontPx}px`;
      tempDiv.style.fontWeight = currentWeight;
      tempDiv.style.lineHeight = "1.4";
      tempDiv.style.padding = "8px"; // Account for padding
      tempDiv.style.maxWidth = "400px"; // Max width constraint
      tempDiv.textContent = text || "Text";

      document.body.appendChild(tempDiv);
      const rect = tempDiv.getBoundingClientRect();
      document.body.removeChild(tempDiv);

      // Calculate new dimensions with minimum constraints
      const newWidth = Math.max(80, Math.ceil(rect.width) + 16); // Add some margin
      const newHeight = Math.max(40, Math.ceil(rect.height) + 16); // Add some margin

      // Check if size actually changed to prevent infinite loops
      const lastSize = lastSizeRef.current;
      if (
        lastSize &&
        lastSize.width === newWidth &&
        lastSize.height === newHeight
      ) {
        return; // No change needed
      }

      // Update the last size reference
      lastSizeRef.current = { width: newWidth, height: newHeight };

      // Update node size in React Flow using utility
      updateSize(id, { width: newWidth, height: newHeight });

      // Update metadata
      if (block) {
        const metadata = (block.metadata || {}) as any;
        const nodeUi = metadata.node_ui || {};
        const updatedMetadata = {
          ...metadata,
          node_ui: {
            ...nodeUi,
            size: {
              width: newWidth,
              height: newHeight,
            },
          },
        };

        commands.updateBlock(id, {
          metadata: updatedMetadata as any,
        });
      }
    },
    [id, fontSize, weight, commands, parsePx, updateSize, block]
  );

  const setColor = useCallback(
    async (nextColor: ColorKey) => {
      if (!block) {
        console.error("Block not found for node:", id);
        return;
      }
      
      // Optimistic UI update using utility
      updateColor(id, nextColor);
      
      // Update block metadata via commands
      const metadata = (block?.metadata || {}) as any;
      const nodeUi = (metadata?.node_ui || {}) as any;
      const updatedMetadata = {
        ...metadata,
        node_ui: {
          ...nodeUi,
          color: nextColor,
        },
      };

      const result = await commands.updateBlock(id, {
        metadata: updatedMetadata as any,
      });

      if (!result.ok) {
        console.error("Failed to update block color:", result.error);
      }
    },
    [id, block, commands, updateColor]
  );

  const setLabel = useCallback(
    async (nextLabel: string) => {
      if (!block) {
        console.error("Block not found for node:", id);
        return;
      }
      
      // Optimistic UI update
      updateLabel(id, nextLabel);
      
      // Update block name via commands
      const result = await commands.updateBlock(id, {
        name: nextLabel,
      });

      if (!result.ok) {
        console.error("Failed to update block label:", result.error);
      }
    },
    [id, block, commands, updateLabel]
  );


  const setFontSize = useCallback(
    async (nextFontSize: NonNullable<BasicTextNodeData["fontSize"]>) => {
      if (!block) {
        console.error("Block not found for node:", id);
        return;
      }
      
      // Optimistic UI update using utility
      updateFontSize(id, nextFontSize);
      
      // Update block metadata via commands
      const metadata = (block?.metadata || {}) as any;
      const nodeUi = (metadata?.node_ui || {}) as any;
      const updatedMetadata = {
        ...metadata,
        node_ui: {
          ...nodeUi,
          fontSize: nextFontSize,
        },
      };

      const result = await commands.updateBlock(id, {
        metadata: updatedMetadata as any,
      });

      if (!result.ok) {
        console.error("Failed to update block fontSize:", result.error);
      }
    },
    [id, block, commands, updateFontSize]
  );

  // Handle node resize to update metadata with debouncing
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResize = useCallback(
    async (event: any, resizeData: { width: number; height: number }) => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Update lastSizeRef immediately to prevent infinite loops
      lastSizeRef.current = { width: resizeData.width, height: resizeData.height };

      // Debounce the DB update
      resizeTimeoutRef.current = setTimeout(async () => {
        if (!block) {
          console.error("Block not found for node:", id);
          return;
        }
        
        // Update block metadata with new size
        const metadata = (block?.metadata || {}) as any;
        const nodeUi = (metadata?.node_ui || {}) as any;
        const updatedMetadata = {
          ...metadata,
          node_ui: {
            ...nodeUi,
            size: {
              width: resizeData.width,
              height: resizeData.height,
            },
          },
        };

        const result = await commands.updateBlock(id, {
          metadata: updatedMetadata as any,
        });

        if (!result.ok) {
          console.error("Failed to update block size:", result.error);
        }
      }, 300); // 300ms debounce delay
    },
    [id, block, commands]
  );

  const commitEdit = useCallback(() => {
    const next = (draftLabel as string).trim();
          if (next.length > 0 && next !== label) {
        setLabel(next);
        // Auto-resize node to fit text
        measureAndUpdateSize(next as string);
      }
  }, [draftLabel, setLabel, label, measureAndUpdateSize]);

  // Smooth auto-resize for textarea and grow node height if needed
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextTextHeight = Math.max(18, Math.min(el.scrollHeight, 600));
    el.style.height = `${nextTextHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [draftLabel, width, autoResize]);

  // Auto-size node when first created
  useEffect(() => {
    if (label && label !== "Text") {
      measureAndUpdateSize(label as string);
    }
  }, [label]); // Removed fontSize, weight, measureAndUpdateSize from dependencies to prevent infinite loops

  // Handle font changes separately to avoid infinite loops
  const prevFontSizeRef = useRef(fontSize);
  const prevWeightRef = useRef(weight);

  useEffect(() => {
    const fontSizeChanged = prevFontSizeRef.current !== fontSize;
    const weightChanged = prevWeightRef.current !== weight;

    if ((fontSizeChanged || weightChanged) && label && label !== "Text") {
      // Small delay to ensure the optimistic update has been applied
      const timeoutId = setTimeout(() => {
        measureAndUpdateSize(label as string);
      }, 50);

      // Update refs
      prevFontSizeRef.current = fontSize;
      prevWeightRef.current = weight;

      return () => clearTimeout(timeoutId);
    }
  }, [fontSize, weight, label]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // BasicTextNode 전용 툴바 아이템들
  const toolbarItems = (
    <>


      {/* Font Size Button */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ALargeSmall className="h-6 w-6" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-2 w-fit"
          side="top"
          align="center"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1">
            {[
              { key: "24px", label: "sm" },
              { key: "32px", label: "md" },
              { key: "48px", label: "lg" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setFontSize(f.key as any);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`px-3 py-1 font-medium rounded text-sm transition-colors ${
                  fontSize === f.key
                    ? "bg-blue-100 text-blue-900"
                    : "hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Color Button */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="h-5 w-5 rounded ring-1 ring-black/10"
              style={{
                backgroundColor: ShapePolicy.getHexColor(color),
              }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-2 w-fit"
          side="top"
          align="center"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5">
            {ShapePolicy.getColorOptions().map((colorOption) => (
              <button
                key={colorOption.value || colorOption.label}
                onClick={(e) => {
                  e.stopPropagation();
                  setColor(colorOption.value as ColorKey);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: ShapePolicy.getHexColor(
                    colorOption.value as ColorKey
                  ),
                }}
                className={`h-6 w-6 rounded ring-1 ring-black/10 transition hover:scale-110 ${
                  color === colorOption.value ? "ring-2 ring-blue-500" : ""
                }`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );

  return (
    <NodeChrome
      id={id}
      selected={!!selected}
      width={width}
      height={height}
      keepAspectRatio
      toolbarItems={toolbarItems}
      resizerColor={ShapePolicy.getHexColor(color)}
      onResize={handleResize}
    >
      {/* Inline label - text when not selected, textarea when selected */}
      <div className="absolute inset-0 flex items-center justify-center">
        {selected ? (
          <textarea
            ref={inputRef}
            value={draftLabel as string}
            onChange={(e) => setDraftLabel(e.currentTarget.value)}
            onBlur={() => commitEdit()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitEdit();
              if (e.key === "Escape") {
                setDraftLabel(label);
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            onInput={autoResize}
            className="w-full resize-none overflow-hidden rounded bg-transparent text-center outline-none placeholder:text-foreground/40 focus:ring-0 whitespace-pre-wrap break-words p-3 leading-[1.4] min-h-[1.4em] box-border m-0"
            style={{
              fontSize: `${scaledFontPx}px`,
              fontWeight: weight,
              color: ShapePolicy.getTextColor(color),
              appearance: "none" as any,
              border: 0,
              height: `${height}px`,
            }}
            placeholder="Text"
            rows={1}
          />
        ) : (
          <div
            className="w-full text-center whitespace-pre-wrap break-words select-none flex items-center justify-center p-3 leading-[1.4] min-h-[1.4em] box-border m-0"
            style={{
              fontSize: `${scaledFontPx}px`,
              fontWeight: weight,
              color: ShapePolicy.getTextColor(color),
              height: `${height}px`,
            }}
          >
            {draftLabel as string || "Text"}
          </div>
        )}
      </div>

      {/* Hidden measuring element */}
      <div
        ref={measureRef}
        className="absolute -top-[9999px] left-0 pointer-events-none"
        style={{
          fontSize: `${baseFontPx}px`,
          fontWeight: weight,
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
    </NodeChrome>
  );
}
