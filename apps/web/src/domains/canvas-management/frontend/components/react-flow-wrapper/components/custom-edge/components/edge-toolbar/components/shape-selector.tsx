import React from 'react';

import { Minus, TrendingUp, Workflow } from 'lucide-react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import type { EdgeShape, EdgeShapeOption } from '../core/types';

// Edge shape definitions (icon only) - Only main types are displayed
const EDGE_SHAPES: EdgeShapeOption[] = [
  {
    value: 'default',
    label: 'Curve',
    icon: <Workflow />,
  },
  { value: 'straight', label: 'Straight', icon: <Minus /> },
  {
    value: 'smoothstep',
    label: 'Step',
    icon: <TrendingUp />,
  },
];

export interface ShapeSelectorProps {
  currentShape: EdgeShape;
  onShapeChange: (shape: EdgeShape) => void;
  zoom: number;
}

/**
 * Shape Selector Component
 *
 * Presentational component: Edge shape selection UI
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function ShapeSelector({
  currentShape,
  onShapeChange,
  zoom,
}: ShapeSelectorProps): React.JSX.Element {
  return (
    <ToolbarOptionPopover<EdgeShape>
      currentValue={currentShape}
      options={EDGE_SHAPES}
      onValueChange={onShapeChange}
      tooltip="Edge Type"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
    />
  );
}
