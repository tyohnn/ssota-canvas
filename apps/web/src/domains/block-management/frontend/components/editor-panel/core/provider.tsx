/**
 * Editor Panel Provider
 */

'use client';

import React, { useMemo } from 'react';

import { useNodes } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { EditorPanelContext } from './context';
import { useEditorPanel } from './use-editor-panel';
import type { EditorPanelBusinessLogic } from './use-editor-panel.business';

export interface EditorPanelProviderProps {
  blockId: string;
  blockMountId: string;
  isOpen: boolean;
  onClose: () => void;
  businessLogic?: EditorPanelBusinessLogic;
  children: React.ReactNode;
}

export function EditorPanelProvider({
  blockId,
  blockMountId,
  isOpen,
  onClose,
  businessLogic,
  children,
}: EditorPanelProviderProps) {
  const nodes = useNodes();

  // React Flow Store에서 블록 데이터 읽기 (reactive)
  // ✅ blockMountId로 노드 찾기 (node.id === blockMountId)
  const blockNode = useMemo(() => {
    const node = nodes.find(node => node.id === blockMountId);
    return node;
  }, [nodes, blockMountId]);

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
      blockMountId,
      blockData,
      isOpen,
      ...editorPanel,
    }),
    [blockId, blockMountId, blockData, isOpen, editorPanel]
  );

  return (
    <EditorPanelContext.Provider value={contextValue}>
      {children}
    </EditorPanelContext.Provider>
  );
}
