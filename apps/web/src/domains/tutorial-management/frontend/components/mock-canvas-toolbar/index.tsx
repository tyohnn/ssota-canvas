'use client';

import { useRef } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { AddBlockButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/add-block-button';
import { FitToViewButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/fit-to-view-button';
import { HandButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/hand-button';
import { SelectButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/select-button';
import { InteractionGuard } from '../common/interaction-guard';

interface MockCanvasToolbarProps {
  onAddBlockClick?: () => void;
}

/**
 * Mock Canvas Toolbar
 *
 * Uses real view components; only the Add Block button is wrapped in
 * InteractionGuard so the step highlight appears on the plus button only.
 */
export function MockCanvasToolbar({ onAddBlockClick }: MockCanvasToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const isSelectActive = true;
  const isPanningMode = false;
  const isBlockCreationMode = false;

  return (
    <Box>
      <ToolbarContainer toolbarRef={toolbarRef}>
        <TooltipProvider>
          <SelectButton
            isActive={isSelectActive}
            onClick={() => {}}
          />
          <HandButton
            isActive={isPanningMode}
            onClick={() => {}}
          />
          <FitToViewButton onClick={() => {}} />
          <InteractionGuard selector="add-block-button">
            <AddBlockButton
              isActive={isBlockCreationMode}
              disabled={isBlockCreationMode}
              onClick={onAddBlockClick ?? (() => {})}
            />
          </InteractionGuard>
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
