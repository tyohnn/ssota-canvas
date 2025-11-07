'use client';

import { useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { ShapeType } from '@/domains/block-management/shared/value-objects/block-properties';
import { cn } from '@/lib/utils';

interface ShapeTypeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentShapeType: ShapeType;
  disabled?: boolean;
  onShapeTypeChange?: (shapeType: ShapeType) => Promise<void>;
}

const SHAPE_OPTIONS = [
  {
    value: ShapeType.RECTANGLE,
    label: '사각형',
  },
  {
    value: ShapeType.ELLIPSE,
    label: '타원',
  },
  {
    value: ShapeType.TRIANGLE,
    label: '삼각형',
  },
  {
    value: ShapeType.DIAMOND,
    label: '다이아몬드',
  },
  {
    value: ShapeType.HEXAGON,
    label: '육각형',
  },
  {
    value: ShapeType.PARALLELOGRAM,
    label: '평행사변형',
  },
  {
    value: ShapeType.CYLINDER,
    label: '원기둥',
  },
];

// SVG 미리보기 렌더링 함수
function renderShapePreview(shapeType: ShapeType, size: number = 24) {
  const commonProps = {
    fill: '#e5e7eb',
    stroke: '#6b7280',
    strokeWidth: 1.5,
  };

  switch (shapeType) {
    case ShapeType.RECTANGLE:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x={2} y={4} width={20} height={16} rx={2} {...commonProps} />
        </svg>
      );

    case ShapeType.ELLIPSE:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <ellipse cx={12} cy={12} rx={10} ry={6} {...commonProps} />
        </svg>
      );

    case ShapeType.TRIANGLE:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="12,4 22,20 2,20" {...commonProps} />
        </svg>
      );

    case ShapeType.DIAMOND:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="12,2 22,12 12,22 2,12" {...commonProps} />
        </svg>
      );

    case ShapeType.HEXAGON:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="6,2 18,2 24,12 18,22 6,22 0,12" {...commonProps} />
        </svg>
      );

    case ShapeType.PARALLELOGRAM:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="6,4 22,4 18,20 2,20" {...commonProps} />
        </svg>
      );

    case ShapeType.CYLINDER:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <g>
            <ellipse cx={12} cy={18} rx={10} ry={3} {...commonProps} />
            <rect
              x={2}
              y={6}
              width={20}
              height={12}
              fill={commonProps.fill}
              stroke="none"
            />
            <line
              x1={2}
              y1={6}
              x2={2}
              y2={18}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
            />
            <line
              x1={22}
              y1={6}
              x2={22}
              y2={18}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
            />
            <ellipse cx={12} cy={6} rx={10} ry={3} {...commonProps} />
          </g>
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x={2} y={4} width={20} height={16} rx={2} {...commonProps} />
        </svg>
      );
  }
}

export function ShapeTypeToolbarItem({
  blockId,
  blockMountId,
  currentShapeType,
  disabled = false,
  onShapeTypeChange,
}: ShapeTypeToolbarItemProps) {
  const handleShapeSelect = useCallback(
    async (shapeType: ShapeType) => {
      if (onShapeTypeChange) {
        await onShapeTypeChange(shapeType);
      }
    },
    [onShapeTypeChange]
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseDown={e => e.stopPropagation()}
              disabled={disabled}
            >
              {renderShapePreview(currentShapeType, 16)}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>도형 타입</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="p-2 w-fit"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="flex gap-1.5">
          {SHAPE_OPTIONS.map(shapeOption => {
            return (
              <Tooltip key={shapeOption.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleShapeSelect(shapeOption.value);
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    className={cn(
                      'h-7 w-7 rounded transition hover:scale-110 flex items-center justify-center',
                      {
                        'ring-1 ring-black/10':
                          currentShapeType !== shapeOption.value,
                        'ring-2 ring-blue-400':
                          currentShapeType === shapeOption.value,
                      }
                    )}
                    aria-label={shapeOption.label}
                  >
                    {renderShapePreview(shapeOption.value, 16)}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                  <p>{shapeOption.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
