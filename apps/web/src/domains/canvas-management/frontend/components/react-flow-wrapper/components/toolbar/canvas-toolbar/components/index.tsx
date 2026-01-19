import React from 'react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { Separator } from '@workspace/ui/components/ui/separator';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import { Box } from '@/components/ui/box';

import type { CanvasMode } from '../../../../../../hooks/mode/canvas-mode-context';
import { AddBlockButton } from './add-block-button';
import { FitToViewButton } from './fit-to-view-button';
import { HandButton } from './hand-button';
import { SelectButton } from './select-button';

export interface CanvasToolbarViewProps {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  isBlockCreationMode: boolean;
  isPanningMode: boolean;
  currentMode: CanvasMode;
  onSelectClick: () => void;
  onHandClick: () => void;
  onFitToViewClick: () => void;
  onAddBlockClick: () => void;
  readonly?: boolean;
}

/**
 * Canvas Toolbar View Component
 *
 * Presentational component: Renders the canvas toolbar
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function CanvasToolbarView({
  toolbarRef,
  isBlockCreationMode,
  isPanningMode,
  currentMode,
  onSelectClick,
  onHandClick,
  onFitToViewClick,
  onAddBlockClick,
  readonly = false,
}: CanvasToolbarViewProps) {
  const isSelectActive =
    currentMode.type === 'default' ||
    currentMode.type === 'single-selection' ||
    currentMode.type === 'multi-selection' ||
    currentMode.type === 'block-editing';

  return (
    <Box className="mt-8">
      <ToolbarContainer toolbarRef={toolbarRef}>
        <TooltipProvider>
          {/* Selection Tool */}
          <SelectButton isActive={isSelectActive} onClick={onSelectClick} />

          {/* Hand Tool - 패닝 모드 */}
          <HandButton isActive={isPanningMode} onClick={onHandClick} />

          {/* Fit to View Button */}
          <FitToViewButton onClick={onFitToViewClick} />

          {/* Add Block Button - readonly일 때 숨김 */}
          {!readonly && (
            <AddBlockButton
              isActive={isBlockCreationMode}
              disabled={isBlockCreationMode}
              onClick={onAddBlockClick}
            />
          )}
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
