/**
 * Editor Panel Combined Hook
 *
 * UI + Business 로직 통합
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useEditorPanelUI } from './use-editor-panel.ui';
import {
  useEditorPanelBusiness,
  type EditorPanelBusinessLogic,
} from './use-editor-panel.business';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export function useEditorPanel(
  blockId: string,
  isOpen: boolean,
  blockData: BlockNodeData | undefined,
  onClose: () => void,
  businessLogic?: EditorPanelBusinessLogic
) {
  // UI State
  const uiState = useEditorPanelUI();

  // Business Logic
  const defaultBusiness = useEditorPanelBusiness(onClose);
  const business = businessLogic ?? defaultBusiness;

  // Title 상태 동기화
  useEffect(() => {
    if (blockData) {
      uiState.setTitle((blockData.title as string) || '새 블럭');
    }
  }, [blockData, uiState]);

  // 슬라이드 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      uiState.setShouldRender(true);
      const timer = setTimeout(() => {
        uiState.setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      uiState.setIsAnimating(false);
      const timer = setTimeout(() => {
        uiState.setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, uiState]);

  // Title 저장 핸들러
  const handleTitleSave = useCallback(async () => {
    if (!blockData || !uiState.title.trim()) {
      return;
    }

    try {
      await business.onTitleSave({
        blockId,
        title: uiState.title,
        blockData,
      });
    } catch (error) {
      // 에러 발생 시 원래 title로 되돌림
      uiState.setTitle((blockData.title as string) || '새 블럭');
    }
  }, [blockId, uiState, blockData, business]);

  // Enter 키로 저장
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleSave();
        uiState.inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        uiState.setTitle((blockData?.title as string) || '새 블럭');
        uiState.inputRef.current?.blur();
      }
    },
    [handleTitleSave, blockData, uiState]
  );

  return {
    ...uiState,
    handleTitleSave,
    handleKeyDown,
    onClose: business.onClose,
  };
}
