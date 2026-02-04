'use client';

import { useEffect, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';
import { EditorPanelView } from '@/domains/block-management/frontend/components/editor-panel/editor-panel.view';
import { HeaderView } from '@/domains/block-management/frontend/components/editor-panel/components/header.view';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';
import { MockEditorPanelTabs } from './components/mock-editor-panel-tabs';
import { MockTitleInput } from './components/mock-title-input';
import { MockBlockPropertiesSection } from './components/mock-block-properties-section';

export interface MockEditorPanelProps {
  /** When true, panel is open (slide in); when false, panel closes (slide out). Same pattern as real app: shouldRender + isAnimating. */
  isVisible?: boolean;
}

/**
 * Mock Editor Panel for YouTube block tutorial.
 * Uses same open/close pattern as real EditorPanel: conditional render (shouldRender) + slide animation (isAnimating).
 * When closed, returns null so no DOM covers the canvas/toolbar.
 */
export function MockEditorPanel({ isVisible = true }: MockEditorPanelProps) {
  const { currentStepIndex } = useTutorialDialogContext();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <EditorPanelView
      isExpanded={false}
      isVisible={isAnimating}
      className={cn(
        isAnimating ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
        <HeaderView
          onClose={() => { }}
          isExpanded={false}
          onToggleExpand={() => { }}
        />
        <Box
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col"
          data-content-area-scroll-container="true"
        >
          <MockTitleInput />
          <MockBlockPropertiesSection />
          <MockEditorPanelTabs currentStepIndex={currentStepIndex} />
        </Box>
      </EditorPanelView>
  );
}
