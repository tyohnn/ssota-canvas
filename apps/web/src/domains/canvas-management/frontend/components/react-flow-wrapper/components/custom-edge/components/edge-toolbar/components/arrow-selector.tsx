import React from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Diamond,
  Minus,
  MoveRight,
} from 'lucide-react';

import { ToolbarOptionPopover } from '@workspace/ui/components/ssota-ui/toolbar-option-popover';

import type { MarkerValue } from '../core/types';

/**
 * start = Source (엣지 시작, source node)
 * end   = Target (엣지 끝, target node)
 * React Flow path: source → target. markerStart=path 시작, markerEnd=path 끝.
 */
function getOptions(which: 'start' | 'end') {
  const arrowIcon = which === 'start' ? <ArrowLeft /> : <ArrowRight />;
  const arrowOpenIcon = which === 'start' ? <MoveRight className="rotate-180" /> : <MoveRight />;
  
  return [
    { value: 'none' as const, label: 'None', icon: <Minus /> },
    { value: 'arrow' as const, label: 'Arrow', icon: arrowIcon },
    { value: 'arrow-open' as const, label: 'Arrow Open', icon: arrowOpenIcon },
    { value: 'circle' as const, label: 'Circle', icon: <Circle className="fill-current" /> },
    { value: 'circle-open' as const, label: 'Circle Open', icon: <Circle /> },
    { value: 'diamond' as const, label: 'Diamond', icon: <Diamond className="fill-current" /> },
    { value: 'diamond-open' as const, label: 'Diamond Open', icon: <Diamond /> },
  ];
}

export interface MarkerSelectorProps {
  which: 'start' | 'end';
  value: MarkerValue;
  onChange: (value: MarkerValue) => void;
  zoom: number;
}

/**
 * Marker Selector (Source or Target)
 *
 * which="start" → Source (소스, 화살표가 나가는 쪽)
 * which="end"   → Target (타겟, 화살표가 들어가는 쪽)
 */
export function MarkerSelector({
  which,
  value,
  onChange,
  zoom,
}: MarkerSelectorProps): React.JSX.Element {
  const options = getOptions(which);
  const tooltip = which === 'start' ? 'Source' : 'Target';

  return (
    <ToolbarOptionPopover<MarkerValue>
      currentValue={value}
      options={options}
      onValueChange={onChange}
      tooltip={tooltip}
      tooltipSide="top"
      tooltipOffset={5}
      popoverSide="top"
      popoverAlign="center"
      zoom={zoom}
    />
  );
}
