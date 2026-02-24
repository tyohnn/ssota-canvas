'use client';

import { useRef } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { Separator } from '@workspace/ui/components/ui/separator';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { ToolbarBlockTypeConfig } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/core/toolbar-block-types';
import { BlockTypeToolbarButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/block-type-toolbar-button';
import {
  TOOLBAR_BLOCK_TYPES,
  TOOLBAR_BLOCK_TYPES_WITH_YOUTUBE,
} from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/core/toolbar-block-types';
import { FitToViewButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/fit-to-view-button';
import { HandButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/hand-button';
import { SelectButton } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/components/select-button';
import { InteractionGuard } from '../common/interaction-guard';

interface MockCanvasToolbarProps {
  onAddBlockTypeClick?: (blockType: BlockType) => void;
  /** When true, includes YouTube button (for youtube-block tutorial) */
  includeYoutube?: boolean;
}

/**
 * Mock Canvas Toolbar
 *
 * Uses same block type buttons as real CanvasToolbar.
 * Note (markdown) button is wrapped in InteractionGuard for tutorial step targeting.
 */
export function MockCanvasToolbar({
  onAddBlockTypeClick,
  includeYoutube = false,
}: MockCanvasToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const isSelectActive = true;
  const isPanningMode = false;
  const isBlockCreationMode = false;
  const handler = onAddBlockTypeClick ?? (() => {});
  const blockTypes: ToolbarBlockTypeConfig[] = includeYoutube
    ? TOOLBAR_BLOCK_TYPES_WITH_YOUTUBE
    : TOOLBAR_BLOCK_TYPES;

  return (
    <Box>
      <ToolbarContainer toolbarRef={toolbarRef}>
        <TooltipProvider>
          <SelectButton isActive={isSelectActive} onClick={() => {}} />
          <HandButton isActive={isPanningMode} onClick={() => {}} />
          <FitToViewButton onClick={() => {}} />
          <Separator orientation="vertical" className="h-4!" />
          {blockTypes.map(({ blockType, label, icon: Icon }) => {
            const button = (
              <BlockTypeToolbarButton
                key={blockType}
                blockType={blockType}
                icon={<Icon className="h-4 w-4" />}
                label={label}
                onClick={handler}
                isActive={isBlockCreationMode}
                disabled={isBlockCreationMode}
              />
            );
            const tutorialSelectors: Record<string, string> = {
              markdown: 'block-type-markdown',
              youtube: 'block-type-youtube',
            };
            const selector = tutorialSelectors[blockType];
            return selector ? (
              <InteractionGuard key={blockType} selector={selector}>
                {button}
              </InteractionGuard>
            ) : (
              button
            );
          })}
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
