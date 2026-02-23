'use client';

import React from 'react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';
import type { ToolbarOption } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import { ShapeType } from '@/domains/block-management/shared/value-objects/block-properties';

interface ShapeTypeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentShapeType: ShapeType;
  disabled?: boolean;
  onShapeTypeChange?: (shapeType: ShapeType) => Promise<void>;
  zoom?: number;
}

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

const SHAPE_OPTIONS: ToolbarOption<ShapeType>[] = [
  {
    value: ShapeType.RECTANGLE,
    label: '사각형',
    icon: renderShapePreview(ShapeType.RECTANGLE, 24),
  },
  {
    value: ShapeType.ELLIPSE,
    label: '타원',
    icon: renderShapePreview(ShapeType.ELLIPSE, 24),
  },
  {
    value: ShapeType.TRIANGLE,
    label: '삼각형',
    icon: renderShapePreview(ShapeType.TRIANGLE, 24),
  },
  {
    value: ShapeType.DIAMOND,
    label: '다이아몬드',
    icon: renderShapePreview(ShapeType.DIAMOND, 24),
  },
  {
    value: ShapeType.HEXAGON,
    label: '육각형',
    icon: renderShapePreview(ShapeType.HEXAGON, 24),
  },
  {
    value: ShapeType.PARALLELOGRAM,
    label: '평행사변형',
    icon: renderShapePreview(ShapeType.PARALLELOGRAM, 24),
  },
  {
    value: ShapeType.CYLINDER,
    label: '원기둥',
    icon: renderShapePreview(ShapeType.CYLINDER, 24),
  },
];

export function ShapeTypeToolbarItem({
  blockId,
  blockMountId,
  currentShapeType,
  disabled = false,
  onShapeTypeChange,
  zoom = 1,
}: ShapeTypeToolbarItemProps) {
  const handleShapeTypeChange = async (shapeType: ShapeType) => {
    if (onShapeTypeChange) {
      await onShapeTypeChange(shapeType);
    }
  };

  return (
    <ToolbarOptionPopover<ShapeType>
      currentValue={currentShapeType}
      options={SHAPE_OPTIONS}
      onValueChange={handleShapeTypeChange}
      tooltip="Shape type"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
    />
  );
}
