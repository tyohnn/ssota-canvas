import React from 'react';

import { Trash2 } from 'lucide-react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Separator } from '@workspace/ui/components/ui/separator';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import type { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

import type { EdgeShape, EdgeWidth, MarkerValue } from '../core/types';
import { MarkerSelector } from './arrow-selector';
import { ColorSelector } from './color-selector';
import { ShapeSelector } from './shape-selector';
import { WidthSelector } from './width-selector';

export interface EdgeToolbarViewProps {
  edgeId: string;
  currentShape: EdgeShape;
  markerStart: MarkerValue;
  markerEnd: MarkerValue;
  currentColorToken: ColorToken;
  currentWidth: number;
  onShapeChange: (shape: EdgeShape) => Promise<void>;
  onStartMarkerChange: (value: MarkerValue) => Promise<void>;
  onEndMarkerChange: (value: MarkerValue) => Promise<void>;
  onColorChange: (colorToken: ColorToken) => Promise<void>;
  onWidthChange: (width: EdgeWidth) => Promise<void>;
  onDelete: () => Promise<void>;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  isZoomVisible: boolean;
  zoom: number;
}

/**
 * Edge Toolbar View Component
 *
 * Presentational component: Renders the entire toolbar content
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function EdgeToolbarView({
  edgeId,
  currentShape,
  markerStart,
  markerEnd,
  currentColorToken,
  currentWidth,
  onShapeChange,
  onStartMarkerChange,
  onEndMarkerChange,
  onColorChange,
  onWidthChange,
  onDelete,
  toolbarRef,
  isZoomVisible,
  zoom,
}: EdgeToolbarViewProps): React.JSX.Element | null {
  if (!isZoomVisible) {
    return null;
  }

  return (
    <ToolbarContainer
      toolbarRef={toolbarRef}
      preventDrag
      preventMouseDown
      preventClick
    >
      <TooltipProvider>
        {/* Edge shape change Popover */}
        <ShapeSelector
          currentShape={currentShape}
          onShapeChange={onShapeChange}
          zoom={zoom}
        />

        <Separator orientation="vertical" className="h-4!" />

        {/* Source marker (start of path = source node, 엣지가 나가는 쪽) */}
        <MarkerSelector
          which="start"
          value={markerStart}
          onChange={v => {
            void onStartMarkerChange(v);
          }}
          zoom={zoom}
        />

        {/* Target marker (end of path = target node, 화살촉이 있는 쪽) — 왼쪽에 배치해 엣지 방향(→)과 맞춤 */}
        <MarkerSelector
          which="end"
          value={markerEnd}
          onChange={v => {
            void onEndMarkerChange(v);
          }}
          zoom={zoom}
        />

        <Separator orientation="vertical" className="h-4!" />

        {/* Edge color change Popover */}
        <ColorSelector
          currentColor={currentColorToken}
          onColorChange={onColorChange}
          zoom={zoom}
        />


        {/* Edge width change Popover */}
        <WidthSelector
          currentWidth={currentWidth}
          onWidthChange={onWidthChange}
          zoom={zoom}
        />

        <Separator orientation="vertical" className="h-4!" />

        {/* Delete button */}
        <ToolbarIconButton
          icon={<Trash2 />}
          tooltip="Delete (⌫)"
          tooltipSide="top"
          tooltipOffset={5}
          onClick={onDelete}
          onMouseDown={e => e.stopPropagation()}
          className="size-8 p-0 transition-colors hover:bg-red-50! hover:text-red-700! [&_svg]:text-red-600 [&_svg]:hover:text-red-700"
          iconClassName="size-4"
        />
      </TooltipProvider>
    </ToolbarContainer>
  );
}
