"use client";

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { Wand2, Type } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface RichStyleToolbarItemProps {
  node: Node;
  isRichStyle: boolean;
  disabled?: boolean;
}

export function RichStyleToolbarItem({ 
  node,
  isRichStyle, 
  disabled = false 
}: RichStyleToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleRichStyleSelect = useCallback(async (richStyle: boolean) => {
    const result = await styleCommands.updateStyles(node, { richStyle });
    if (!result.ok) {
      console.error("Rich style 업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  const CurrentIcon = isRichStyle ? Wand2 : Type;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={(e) => e.stopPropagation()}
          title="Style Mode"
          disabled={disabled}
        >
          <CurrentIcon className="h-4 w-4" />
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRichStyleSelect(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`h-8 w-8 rounded flex items-center justify-center ring-1 ring-black/10 transition hover:scale-110 ${
              isRichStyle ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
            title="Rich Style"
          >
            <Wand2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRichStyleSelect(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`h-8 w-8 rounded flex items-center justify-center ring-1 ring-black/10 transition hover:scale-110 ${
              !isRichStyle ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
            title="Plain Text"
          >
            <Type className="h-4 w-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
