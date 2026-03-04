'use client';

import { useMemo } from 'react';
import type { EditorPanelViewProps } from '../editor-panel-view';

export interface UseEditorPanelContractArgs {
  headerActions: EditorPanelViewProps['headerActions'];
  titleInput: EditorPanelViewProps['titleInput'];
  blockProperties: EditorPanelViewProps['blockProperties'];
  customProperties: EditorPanelViewProps['customProperties'];
  tabsSection?: EditorPanelViewProps['tabsSection'];
}

/**
 * Builds a stable EditorPanelView contract object.
 * Apps compute domain deps and pass them in this contract.
 */
export function useEditorPanelContract({
  headerActions,
  titleInput,
  blockProperties,
  customProperties,
  tabsSection,
}: UseEditorPanelContractArgs): EditorPanelViewProps {
  return useMemo(
    () => ({
      headerActions,
      titleInput,
      blockProperties,
      customProperties,
      tabsSection,
    }),
    [
      headerActions,
      titleInput,
      blockProperties,
      customProperties,
      tabsSection,
    ]
  );
}
