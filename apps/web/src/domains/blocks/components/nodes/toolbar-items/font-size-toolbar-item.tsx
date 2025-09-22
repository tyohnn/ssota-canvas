"use client";

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { ALargeSmall } from "lucide-react";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface FontSizeToolbarItemProps {
  node: Node;
  currentFontSize: string;
  disabled?: boolean;
}

export function FontSizeToolbarItem({ 
  node,
  currentFontSize, 
  disabled = false 
}: FontSizeToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleFontSizeSelect = useCallback(async (fontSize: string) => {
    const result = await styleCommands.updateFontSize(node, fontSize as "24px" | "32px" | "48px");
    if (!result.ok) {
      console.error("폰트 크기 업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  const fontSizeOptions = [
    { key: "24px", label: "sm" },
    { key: "32px", label: "md" },
    { key: "48px", label: "lg" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={(e) => e.stopPropagation()}
          title="Font Size"
          disabled={disabled}
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
          {fontSizeOptions.map((f) => (
            <button
              key={f.key}
              onClick={(e) => {
                e.stopPropagation();
                handleFontSizeSelect(f.key);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`px-3 py-1 font-medium rounded text-sm transition-colors ${
                currentFontSize === f.key
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100"
              }`}
              title={f.label}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
