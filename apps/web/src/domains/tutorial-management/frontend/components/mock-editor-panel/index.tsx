'use client';

import { useEffect, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { EditorPanelView } from '@workspace/editor-panel';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';
import { MockEditorPanelTabs } from './components/mock-editor-panel-tabs';
import { getBlockEditorSchema } from '@/domains/block-management/frontend/registries/block-editor-schema-registry';
import { TUTORIAL_MOCK_BLOCK_DATA } from '../../config/tutorial-mock-data';

export interface MockEditorPanelProps {
  /** When true, panel is open (slide in); when false, panel closes (slide out). */
  isVisible?: boolean;
}

const noop = () => {};
const noopAsync = async () => {};

/**
 * Mock Editor Panel for YouTube block tutorial.
 * Uses same open/close pattern as real EditorPanel: conditional render + slide animation.
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

  const frameClassName = cn(
    'absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl',
    'bottom-0 right-0 w-full md:w-[50%] h-full md:h-[90%] border-l border-t rounded-tl-lg',
    isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
    isAnimating ? 'pointer-events-auto' : 'pointer-events-none'
  );

  const title = TUTORIAL_MOCK_BLOCK_DATA.properties.youtubeTitle ?? 'YouTube Video';

  return (
    <div
      className={frameClassName}
      style={{
        transition:
          'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <EditorPanelView
        headerActions={{
          onClose: noop,
          isExpanded: false,
          onToggleExpand: noop,
        }}
        titleInput={{
          initialTitle: title,
          onTitleSave: noop,
          readOnly: true,
        }}
        blockProperties={{
          entityId: TUTORIAL_MOCK_BLOCK_DATA.blockId,
          entityData: TUTORIAL_MOCK_BLOCK_DATA,
          propertyUpdateDeps: {
            updateProperty: noopAsync,
            updatePropertyImmediate: noop,
          },
          deps: { getEditorSchema: getBlockEditorSchema },
          readonly: true,
        }}
        customProperties={{
          entityId: TUTORIAL_MOCK_BLOCK_DATA.blockId,
          deps: {
            resolveEntityData: () => TUTORIAL_MOCK_BLOCK_DATA,
            propertyUpdateDeps: {
              updateProperty: noopAsync,
              updatePropertyImmediate: noop,
            },
          },
          readonly: true,
        }}
        tabsSection={<MockEditorPanelTabs currentStepIndex={currentStepIndex} />}
      />
    </div>
  );
}
