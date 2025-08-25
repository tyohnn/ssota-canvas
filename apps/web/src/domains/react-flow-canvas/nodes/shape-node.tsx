"use client";

import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { NodeProps } from "@xyflow/react";
import { Position, useReactFlow } from "@xyflow/react";
// import { NodeContextMenu } from "./node-context-menu";
import { NodeChrome } from "./node-chrome";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { Toggle } from "@workspace/ui/components/ui/toggle";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { ALargeSmall } from "lucide-react";
import {
  ShapePolicy,
  type ColorKey,
  type ShapeKey,
} from "@/domains/canvas/policy/shape-policy";

export type ShapeNodeData = {
  label?: string;
  color?: ColorKey; // fill color using policy color keys
  shape?: ShapeKey; // shape using policy shape keys
  weight?: "normal" | "bold" | "bolder"; // font weight
  fontSize?: "12px" | "14px" | "16px" | "18px" | "20px"; // font size
  width?: number;
  height?: number;
};

function Shape({
  shape,
  color,
  width,
  height,
  label,
  selected,
}: {
  shape: NonNullable<ShapeNodeData["shape"]>;
  color: ColorKey;
  width: number;
  height: number;
  label: string;
  selected?: boolean;
}) {
  const shapeProps = useMemo(
    () => ShapePolicy.getShapeComponentProps(shape, color, width, height),
    [shape, color, width, height]
  );

  const renderShape = () => {
    switch (shape) {
      case "rect":
        return <rect {...(shapeProps as React.SVGProps<SVGRectElement>)} />;
      case "circle":
        return (
          <ellipse {...(shapeProps as React.SVGProps<SVGEllipseElement>)} />
        );
      case "diamond":
      case "hexagon":
      case "parallelogram":
      case "triangle":
        return (
          <polygon {...(shapeProps as React.SVGProps<SVGPolygonElement>)} />
        );
      case "cylinder":
        return (
          <>
            {/* Top ellipse */}
            <ellipse
              cx={width / 2}
              cy={height / 8}
              rx={width / 2}
              ry={height / 8}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
            {/* Middle rectangle */}
            <rect
              x={0}
              y={height / 8}
              width={width}
              height={(height * 3) / 4}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
            {/* Bottom ellipse */}
            <ellipse
              cx={width / 2}
              cy={(height * 7) / 8}
              rx={width / 2}
              ry={height / 8}
              fill={shapeProps.fill}
              stroke={shapeProps.stroke}
              strokeWidth={shapeProps.strokeWidth}
            />
          </>
        );
      default:
        return <rect {...(shapeProps as React.SVGProps<SVGRectElement>)} />;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <g key={`shape-${shape}-${color}`}>{renderShape()}</g>
    </svg>
  );
}

export function ShapeNode({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const d = (data || {}) as ShapeNodeData;
  const rf = useReactFlow();
  const dataCtx = useCanvasData();
  const commands = useCanvasCommandsContext();

  const getBlockById = useCallback(
    (blockId: string) => dataCtx.blocksById[blockId],
    [dataCtx.blocksById]
  );

  // Get block data and extract metadata
  const block = getBlockById(id);
  const metadata = (block?.metadata || {}) as any;
  const nodeUi = metadata.node_ui || {};

  // Extract values from metadata with fallbacks
  const label = d.label ?? block?.name ?? id;
  const shape = d.shape ?? nodeUi.shape ?? ShapePolicy.getDefaultShape();

  // Color handling with validation and HEX mapping
  const rawColor = d.color ?? nodeUi.color ?? ShapePolicy.getDefaultColor();
  const availableColors = ShapePolicy.getColorOptions().map((c) => c.value);

  // If rawColor is a HEX value, map it to closest ColorKey
  const color = rawColor.startsWith("#")
    ? ShapePolicy.getClosestColorKey(rawColor)
    : availableColors.includes(rawColor)
      ? (rawColor as ColorKey)
      : ShapePolicy.getDefaultColor();

  // Inline label state
  const [draftLabel, setDraftLabel] = useState(label);

  const weight = "bold"; // 항상 bold로 고정
  const fontSize = d.fontSize ?? nodeUi.fontSize ?? "32px";
  const width = Math.max(80, (nodeW as number) ?? d.width ?? 160);
  const height = Math.max(40, (nodeH as number) ?? d.height ?? 64);
  
  // Shape 노드 패딩
  const padding = 16;

  useEffect(() => {
    setDraftLabel(label);
  }, [label]);

  const setColor = useCallback(
    async (nextColor: ColorKey) => {
      // Update UI immediately (optimistic)
      rf.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...(n.data || {}), color: nextColor } }
            : n
        )
      );

      // Update block metadata via commands
      const block = getBlockById(id);
      if (block) {
        const metadata = (block.metadata || {}) as any;
        const nodeUi = metadata.node_ui || {};
        const updatedMetadata = {
          ...metadata,
          node_ui: {
            ...nodeUi,
            color: nextColor,
          },
        };

        const result = await commands.updateBlock(block.id, {
          metadata: updatedMetadata as any,
        });

        if (!result.ok) {
          console.error("Failed to update block color:", result.error);
        } else {
          console.log("Successfully updated block color:", {
            blockId: block.id,
            color: nextColor,
          });
        }
      }
    },
    [id, getBlockById, commands]
  );

  const setLabel = useCallback(
    async (nextLabel: string) => {
      // Update block name via commands
      const block = getBlockById(id);
      if (block) {
        const result = await commands.updateBlock(block.id, {
          name: nextLabel,
        });

        if (!result.ok) {
          console.error("Failed to update block label:", result.error);
        }
      }
    },
    [id, getBlockById, commands]
  );

  const setShape = useCallback(
    async (nextShape: ShapeKey) => {
      // Update block metadata via commands
      const block = getBlockById(id);
      if (block) {
        const metadata = (block.metadata || {}) as any;
        const nodeUi = metadata.node_ui || {};
        const updatedMetadata = {
          ...metadata,
          node_ui: {
            ...nodeUi,
            shape: nextShape,
          },
        };

        const result = await commands.updateBlock(block.id, {
          metadata: updatedMetadata as any,
        });

        if (!result.ok) {
          console.error("Failed to update block shape:", result.error);
        }
      }
    },
    [id, getBlockById, commands]
  );



  const setFontSize = useCallback(
    async (nextFontSize: NonNullable<ShapeNodeData["fontSize"]>) => {
      // Update block metadata via commands
      const block = getBlockById(id);
      if (block) {
        const metadata = (block.metadata || {}) as any;
        const nodeUi = metadata.node_ui || {};
        const updatedMetadata = {
          ...metadata,
          node_ui: {
            ...nodeUi,
            fontSize: nextFontSize,
          },
        };

        const result = await commands.updateBlock(block.id, {
          metadata: updatedMetadata as any,
        });

        if (!result.ok) {
          console.error("Failed to update block fontSize:", result.error);
        }
      }
    },
    [id, getBlockById, commands]
  );

  // Handle node resize to update metadata with debouncing
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleResize = useCallback(
    async (event: any, data: { width: number; height: number }) => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Debounce the DB update
      resizeTimeoutRef.current = setTimeout(async () => {
        // Update block metadata with new size
        const block = getBlockById(id);
        if (block) {
          const metadata = (block.metadata || {}) as any;
          const nodeUi = metadata.node_ui || {};
          const updatedMetadata = {
            ...metadata,
            node_ui: {
              ...nodeUi,
              size: {
                width: data.width,
                height: data.height,
              },
            },
          };

          const result = await commands.updateBlock(block.id, {
            metadata: updatedMetadata as any,
          });

          if (!result.ok) {
            console.error("Failed to update block size:", result.error);
          }
        }
      }, 300); // 300ms debounce delay
    },
    [id, getBlockById, commands]
  );

  const commitEdit = useCallback(() => {
    const next = draftLabel.trim();
    if (next.length > 0 && next !== label) setLabel(next);
  }, [draftLabel, setLabel, label]);



  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // ShapeNode 전용 툴바 아이템들
  const toolbarItems = (
    <>
      {/* Shape Button */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {ShapePolicy.getShapeDefinition(shape).icon}
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
            {ShapePolicy.getShapeOptions().map((shapeOption) => (
              <button
                key={shapeOption.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setShape(shapeOption.value as ShapeKey);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`p-2 rounded transition-colors ${
                  shape === shapeOption.value
                    ? "bg-blue-100 text-blue-900"
                    : "hover:bg-gray-100"
                }`}
              >
                {
                  ShapePolicy.getShapeDefinition(shapeOption.value as ShapeKey)
                    .icon
                }
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

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
                backgroundColor: ShapePolicy.getShapeBackgroundColor(color),
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
                key={colorOption.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setColor(colorOption.value as ColorKey);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: ShapePolicy.getShapeBackgroundColor(
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
      toolbarItems={toolbarItems}
      resizerColor={ShapePolicy.getBorderColor(color)}
      onResize={handleResize}
    >
      <Shape
        shape={shape}
        color={color}
        width={width}
        height={height}
        label={label}
        selected={selected}
      />

      {/* Inline label input - always visible, centered */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Textarea
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitEdit();
            if (e.key === "Escape") {
              setDraftLabel(label);
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          className="pointer-events-auto w-[calc(100%-24px)] resize-none text-center border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-foreground/40"
          style={{
            fontSize: fontSize,
            fontWeight: weight,
            color: ShapePolicy.getTextColor(color),
            maxHeight: `${height - padding}px`,
          }}
          placeholder="Label"
        />
      </div>
    </NodeChrome>
  );
}
