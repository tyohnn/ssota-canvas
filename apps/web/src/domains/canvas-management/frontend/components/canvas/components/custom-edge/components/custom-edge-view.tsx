import React from 'react';

import { EdgeLabelRenderer } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';

import type { CustomEdgeViewProps } from './custom-edge-view.type';
import { EdgeLabel } from './edge-label';
import { EdgePath } from './edge-path';
import { EdgeToolbar } from './edge-toolbar';

/**
 * Custom Edge View Component
 *
 * Presentational component: Main rendering component for custom edge
 * - Combines EdgePath and EdgeLabel
 * - Conditionally renders EdgeToolbar
 * - Props only, no hooks or context
 * - Storybook testable
 *
 * Pattern: View (Semantic Grouping)
 * - Props are grouped by semantic meaning (see custom-edge-view.type.ts)
 * - Improves readability and maintainability
 * - Easier to refactor and test
 */

export function CustomEdgeView({
  geometry,
  pathData,
  visual,
  label,
  toolbar,
}: CustomEdgeViewProps): React.JSX.Element {
  const { pageId } = useCanvasMetadata();

  return (
    <>
      {/* Edge Path */}
      <EdgePath
        edgeId={geometry.edgeId}
        path={pathData.edgePath}
        forceRenderKey={pathData.forceRenderKey}
        markerEnd={visual.markerEnd}
        style={{
          ...visual.style,
          strokeWidth: visual.strokeWidth,
          stroke: visual.strokeColor,
        }}
      />

      <EdgeLabelRenderer>
        {/* Edge Toolbar (above edge center, only on single selection) */}
        {toolbar.showToolbar && (
          <Box
            className="z-50"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${pathData.labelX}px, ${pathData.labelY - 20}px)`,
              pointerEvents: 'all',
            }}
          >
            <EdgeToolbar edgeId={toolbar.edgeId} pageId={pageId} />
          </Box>
        )}

        {/* Edge Label (center, visibility handled internally) */}
        <EdgeLabel
          edgeId={geometry.edgeId}
          label={label.label}
          position={{ x: pathData.labelX, y: pathData.labelY }}
          isSelected={label.isSelected}
        />
      </EdgeLabelRenderer>
    </>
  );
}
