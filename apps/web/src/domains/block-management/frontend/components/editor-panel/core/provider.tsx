/**
 * Editor Panel Provider
 */

'use client';

import { useMemo } from 'react';
import { useNodes } from '@xyflow/react';
import { EditorPanelContext } from './context';
import { useEditorPanel } from './use-editor-panel';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { EditorPanelBusinessLogic } from './use-editor-panel.business';

export interface EditorPanelProviderProps {
  blockId: string;
  isOpen: boolean;
  onClose: () => void;
  businessLogic?: EditorPanelBusinessLogic;
  children: React.ReactNode;
}

export function EditorPanelProvider({
  blockId,
  isOpen,
  onClose,
  businessLogic,
  children,
}: EditorPanelProviderProps) {
  const nodes = useNodes();

  // React Flow Store에서 블록 데이터 읽기 (reactive)
  const blockNode = useMemo(() => {
    const node = nodes.find(node => node.id === blockId);
    return node;
  }, [nodes, blockId]);
  const blockData = blockNode?.data as BlockNodeData | undefined;

  // Combined hook
  const editorPanel = useEditorPanel(
    blockId,
    isOpen,
    blockData,
    onClose,
    businessLogic
  );

  const contextValue = useMemo(
    () => ({
      blockId,
      blockData,
      isOpen,
      ...editorPanel,
    }),
    [blockId, blockData, isOpen, editorPanel]
  );

  return (
    <EditorPanelContext.Provider value={contextValue}>
      {children}
    </EditorPanelContext.Provider>
  );
}
