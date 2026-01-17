import React from 'react';

import { Minus } from 'lucide-react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import type { EdgeWidth, EdgeWidthOption } from '../core/types';

// Edge width definitions
const EDGE_WIDTHS: EdgeWidthOption[] = [
  {
    value: 1,
    label: 'Thin',
    icon: <Minus className="h-3 w-3" strokeWidth={1} />,
  },
  {
    value: 2,
    label: 'Medium',
    icon: <Minus className="h-3 w-3" strokeWidth={2} />,
  },
  {
    value: 3,
    label: 'Thick',
    icon: <Minus className="h-3 w-3" strokeWidth={3} />,
  },
];

export interface WidthSelectorProps {
  currentWidth: number;
  onWidthChange: (width: EdgeWidth) => void;
  zoom: number;
}

/**
 * Width Selector Component
 *
 * Presentational component: Edge width selection UI
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function WidthSelector({
  currentWidth,
  onWidthChange,
  zoom,
}: WidthSelectorProps): React.JSX.Element {
  // Custom equality check for approximate number matching
  const isEqual = (a: EdgeWidth, b: EdgeWidth): boolean => {
    return Math.abs(a - b) < 0.5;
  };

  return (
    <ToolbarOptionPopover<EdgeWidth>
      currentValue={currentWidth as EdgeWidth}
      options={EDGE_WIDTHS}
      onValueChange={onWidthChange}
      tooltip="Edge Width"
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
      isEqual={isEqual}
    />
  );
}
