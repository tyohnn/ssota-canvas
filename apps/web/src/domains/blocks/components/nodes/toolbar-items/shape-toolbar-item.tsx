'use client';

import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  ShapePolicy,
  type ShapeKey,
} from '@/domains/blocks/policy/shape-policy';
import { useReactFlowCommandsContext } from '@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext';

interface ShapeToolbarItemProps {
  node: Node;
  currentShape: ShapeKey;
  disabled?: boolean;
}

export function ShapeToolbarItem({
  node,
  currentShape,
  disabled = false,
}: ShapeToolbarItemProps) {
  const { styleCommands } = useReactFlowCommandsContext();

  const handleShapeSelect = useCallback(
    async (shapeValue: ShapeKey) => {
      const result = await styleCommands.updateShape(node, shapeValue);
      if (!result.ok) {
        console.error('도형 업데이트 실패:', result.error);
      }
    },
    [node, styleCommands]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          title="Shape"
          disabled={disabled}
        >
          {ShapePolicy.getShapeDefinition(currentShape).icon}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1">
          {ShapePolicy.getShapeOptions().map(shapeOption => (
            <button
              key={shapeOption.value}
              onClick={e => {
                e.stopPropagation();
                handleShapeSelect(shapeOption.value as ShapeKey);
              }}
              onMouseDown={e => e.stopPropagation()}
              className={`p-2 rounded transition-colors ${
                currentShape === shapeOption.value
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
              title={shapeOption.label}
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
  );
}
