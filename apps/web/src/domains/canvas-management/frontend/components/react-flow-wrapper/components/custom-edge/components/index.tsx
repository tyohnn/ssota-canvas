import React from 'react';

import { EdgeLabelRenderer } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { EdgeLabel } from './edge-label';
import { EdgePath } from './edge-path';
import { EdgeToolbar } from './edge-toolbar';

/**
 * Custom Edge View Props
 *
 * Flat props structure for better clarity and simplicity
 */
export type CustomEdgeViewProps = {
  // Geometry
  edgeId: string;

  // Path data
  edgePath: string;
  labelX: number;
  labelY: number;
  forceRenderKey: string;

  // Visual
  strokeColor: string;
  strokeWidth: number;
  markerEnd?: string;
  style?: React.CSSProperties;

  // Label
  label: string;
  isSelected: boolean;

  // Toolbar
  showToolbar: boolean;
  toolbarEdgeId: string;
};

/**
 * Custom Edge View Component
 *
 * Presentational component: Main rendering component for custom edge
 * - Combines EdgePath and EdgeLabel
 * - Conditionally renders EdgeToolbar
 * - Props only, no hooks or context
 * - Storybook testable
 */

export function CustomEdgeView({
  edgeId,
  edgePath,
  labelX,
  labelY,
  forceRenderKey,
  strokeColor,
  strokeWidth,
  markerEnd,
  style,
  label,
  isSelected,
  showToolbar,
  toolbarEdgeId,
}: CustomEdgeViewProps): React.JSX.Element {
  const { pageId } = useCanvasMetadata();
  const { readonly } = useCanvasReadOnly();

  return (
    <>
      {/* Edge Path */}
      <EdgePath
        edgeId={edgeId}
        path={edgePath}
        forceRenderKey={forceRenderKey}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
        }}
      />

      <EdgeLabelRenderer>
        {/* Edge Toolbar (above edge center, only on single selection) - readonly일 때 숨김 */}
        {!readonly && showToolbar && (
          <Box
            className="z-50"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 20}px)`,
              pointerEvents: 'all',
            }}
          >
            <EdgeToolbar edgeId={toolbarEdgeId} pageId={pageId} />
          </Box>
        )}

        {/* Edge Label (center, visibility handled internally) */}
        <EdgeLabel
          edgeId={edgeId}
          label={label}
          position={{ x: labelX, y: labelY }}
          isSelected={isSelected}
          readonly={readonly}
        />
      </EdgeLabelRenderer>
    </>
  );
}
