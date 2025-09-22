"use client";

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface ColorToolbarItemProps {
  node: Node;
  currentColor: ColorKey;
  disabled?: boolean;
}

export function ColorToolbarItem({ 
  node,
  currentColor, 
  disabled = false 
}: ColorToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleColorSelect = useCallback(async (colorValue: ColorKey) => {
    const result = await styleCommands.updateColor(node, colorValue);
    if (!result.ok) {
      console.error("색상 업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={(e) => e.stopPropagation()}
          title="Text Color"
          disabled={disabled}
        >
          <div
            className="h-5 w-5 rounded ring-1 ring-black/10"
            style={{ backgroundColor: ShapePolicy.getHexColor(currentColor) }}
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
                handleColorSelect(colorOption.value as ColorKey);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ backgroundColor: ShapePolicy.getHexColor(colorOption.value as ColorKey) }}
              className={`h-6 w-6 rounded ring-1 ring-black/10 transition hover:scale-110 ${
                currentColor === colorOption.value ? "ring-2 ring-blue-500" : ""
              }`}
              title={colorOption.label}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
