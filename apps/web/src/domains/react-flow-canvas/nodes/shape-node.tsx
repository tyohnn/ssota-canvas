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
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useNodeSelection, useSelectionCommands } from "../contexts/SelectionContext";
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
import { useShapeNodeUpdater } from "../utils/node-updater";

export type ShapeNodeData = {
  label?: string;
  block?: any; // Block data containing metadata
  // Legacy properties for backward compatibility (will be removed)
  color?: ColorKey;
  shape?: ShapeKey;
  weight?: "normal" | "bold" | "bolder";
  fontSize?: "12px" | "14px" | "16px" | "18px" | "20px";
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
  const commands = useCanvasCommandsContext();
  const selectionCommands = useSelectionCommands();
  const { updateColor, updateShape, updateFontSize, updateSize } = useShapeNodeUpdater();
  
  // Local state for text editing mode
  const [isEditing, setIsEditing] = useState(false);

  // Get metadata from block data
  const block = data?.block as any;
  const metadata = (block?.metadata || {}) as any;
  const nodeUi = (metadata?.node_ui || {}) as any;

  // Extract values from metadata with fallbacks
  const label = d.label ?? data?.name ?? id;
  const shape = nodeUi?.shape ?? ShapePolicy.getDefaultShape();

  // Color handling with validation and HEX mapping
  const rawColor = nodeUi?.color ?? ShapePolicy.getDefaultColor();
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
  const fontSize = nodeUi?.fontSize ?? "32px";
  
  // React Flow props가 최우선, 그 다음 metadata, 마지막 기본값
  const width = Math.max(80, (nodeW as number) || nodeUi?.size?.width || 160);
  const height = Math.max(40, (nodeH as number) || nodeUi?.size?.height || 64);
  

  
  // Shape 노드 패딩
  const padding = 16;

  useEffect(() => {
    setDraftLabel(label);
  }, [label]);

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
      rf.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: nextLabel,
                  block: {
                    ...(n.data.block as any),
                    name: nextLabel,
                  },
                },
              }
            : n
        )
      );
      
      // Update block name via commands
      const result = await commands.updateBlock(id, {
        name: nextLabel,
      });

      if (!result.ok) {
        console.error("Failed to update block label:", result.error);
      }
    },
    [id, block, commands, rf]
  );

  const setShape = useCallback(
    async (nextShape: ShapeKey) => {
      if (!block) {
        console.error("Block not found for node:", id);
        return;
      }
      
      // Optimistic UI update using utility
      updateShape(id, nextShape);
      
      // Update block metadata via commands
      const metadata = (block?.metadata || {}) as any;
      const nodeUi = (metadata?.node_ui || {}) as any;
      const updatedMetadata = {
        ...metadata,
        node_ui: {
          ...nodeUi,
          shape: nextShape,
        },
      };

      const result = await commands.updateBlock(id, {
        metadata: updatedMetadata as any,
      });

      if (!result.ok) {
        console.error("Failed to update block shape:", result.error);
      }
    },
    [id, block, commands, updateShape]
  );



  const setFontSize = useCallback(
    async (nextFontSize: "24px" | "32px" | "48px") => {
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

      // Optimistic UI update for resize using utility
      updateSize(id, {
        width: resizeData.width,
        height: resizeData.height,
      });
      
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
    [id, block, commands, rf]
  );

  const commitEdit = useCallback(() => {
    const next = (draftLabel as string).trim();
    if (next.length > 0 && next !== label) setLabel(next);
    setIsEditing(false);
  }, [draftLabel, setLabel, label]);

  const handleTextAreaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) {
      setIsEditing(true);
    }
  }, [selected]);

  const handleTextAreaFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextAreaBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleEscape = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (isEditing) {
      // 1단계: 편집 모드 해제
      setIsEditing(false);
      setDraftLabel(label);
      (e.target as HTMLTextAreaElement).blur();
    } else if (selected) {
      // 2단계: 선택 해제
      selectionCommands.selectNodes([]);
    }
  }, [isEditing, label, selected, selectionCommands]);



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
          onPointerDown={(e) => e.stopPropagation()}
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
          onPointerDown={(e) => e.stopPropagation()}
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
          onPointerDown={(e) => e.stopPropagation()}
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
      draggable={!isEditing}
    >
      <Shape
        shape={shape}
        color={color}
        width={width}
        height={height}
        label={label as string}
        selected={selected}
      />

      {/* Inline label - text when not selected, textarea when selected */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {selected ? (
          <textarea
            value={draftLabel as string}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitEdit}
            onClick={handleTextAreaClick}
            onFocus={handleTextAreaFocus}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitEdit();
              if (e.key === "Escape") handleEscape(e);
            }}
            className="w-[calc(100%-24px)] resize-none text-center border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-foreground/40 p-3 leading-[1.4] min-h-[1.4em] box-border m-0 outline-none"
            style={{
              fontSize: String(fontSize),
              fontWeight: String(weight),
              color: ShapePolicy.getTextColor(color),
              height: `${height - padding}px`,
            }}
            placeholder="Label"
          />
        ) : (
          <div
            className="w-[calc(100%-24px)] text-center select-none whitespace-pre-wrap break-words flex items-center justify-center p-3 leading-[1.4] min-h-[1.4em] box-border m-0"
            style={{
              fontSize: String(fontSize),
              fontWeight: String(weight),
              color: ShapePolicy.getTextColor(color),
              height: `${height - padding}px`,
            }}
          >
            {draftLabel as string || "Label"}
          </div>
        )}
      </div>
    </NodeChrome>
  );
}
