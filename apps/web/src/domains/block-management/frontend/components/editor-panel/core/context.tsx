/**
 * Editor Panel Context
 */

'use client';

import { createContext, useContext } from 'react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface EditorPanelContextValue {
  blockId: string;
  blockMountId: string;
  blockData: BlockNodeData | undefined;
  isOpen: boolean;

  // UI State
  isAnimating: boolean;
  shouldRender: boolean;
  title: string;
  setTitle: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;

  // Handlers
  handleTitleSave: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;

  // Tab 전환
  switchToTab: (tabId: string) => void;
  // Tab 전환 callback 등록 (내부 사용, BlockContentTabsSectionView에서만 사용)
  setTabSwitchCallback: (callback: ((tabId: string) => void) | null) => void;
}

export const EditorPanelContext = createContext<EditorPanelContextValue | null>(
  null
);

export function useEditorPanelContext() {
  const context = useContext(EditorPanelContext);
  if (!context) {
    throw new Error(
      'useEditorPanelContext must be used within EditorPanelProvider'
    );
  }
  return context;
}
