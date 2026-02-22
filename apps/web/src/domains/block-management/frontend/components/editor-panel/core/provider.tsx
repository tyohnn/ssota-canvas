/**
 * Editor Panel Provider
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useNodes } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

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

  // Canvas Mode Context
  const canvasMode = useCanvasModeContext();

  // Tab 전환 함수 관리 (ref 사용하여 최신 값 보장)
  const tabSwitchCallbackRef = React.useRef<((tabId: string) => void) | null>(
    null
  );
  const [tabSwitchCallback, setTabSwitchCallback] = useState<
    ((tabId: string) => void) | null
  >(null);

  // Tab 전환 함수 (Context에 제공)
  const switchToTab = useCallback((tabId: string) => {
    // ref를 통해 최신 callback 사용
    if (tabSwitchCallbackRef.current) {
      tabSwitchCallbackRef.current(tabId);
    } else {
      console.warn(
        '[EditorPanel] Tab switch callback not registered yet. Tab ID:',
        tabId
      );
    }
  }, []);

  // Tab switch callback 업데이트 시 ref도 업데이트
  React.useEffect(() => {
    tabSwitchCallbackRef.current = tabSwitchCallback;
  }, [tabSwitchCallback]);

  // initialTab 옵션 처리 (Canvas Mode에서 전달된 탭 전환 요청)
  // tab이 빈 문자열이면 스킵 (updateBlockEditingTabOptions로 tabOptions만 업데이트할 때
  // initialTab이 tab:''로 생성되어 의도치 않게 note 탭으로 전환되는 것 방지)
  useEffect(() => {
    if (
      isOpen &&
      canvasMode.mode.type === 'block-editing' &&
      canvasMode.mode.blockId === blockId &&
      canvasMode.mode.initialTab
    ) {
      const { tab } = canvasMode.mode.initialTab;
      if (!tab) return;

      // 약간의 지연 후 탭 전환 (탭이 mount될 시간 확보)
      const timeoutId = setTimeout(() => {
        switchToTab(tab);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, canvasMode.mode, blockId, switchToTab]);

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
      switchToTab,
      setTabSwitchCallback,
    }),
    [blockId, blockMountId, blockData, isOpen, editorPanel, switchToTab]
  );

  return (
    <EditorPanelContext.Provider value={contextValue}>
      {children}
    </EditorPanelContext.Provider>
  );
}
