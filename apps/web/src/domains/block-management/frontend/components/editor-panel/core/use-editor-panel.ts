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
  const { title, setTitle, setShouldRender, setIsAnimating, inputRef } =
    uiState;

  // Business Logic
  const defaultBusiness = useEditorPanelBusiness(onClose);
  const business = businessLogic ?? defaultBusiness;
  const { onTitleSave: businessOnTitleSave, onClose: businessOnClose } =
    business;

  // Title 상태 동기화 (blockData.title이 변경되었을 때만)
  useEffect(() => {
    if (blockData) {
      const newTitle = (blockData.title as string) || '새 블럭';
      setTitle(newTitle);
    }
  }, [blockData?.title, setTitle]);

  // 슬라이드 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, setShouldRender, setIsAnimating]);

  // Title 저장 핸들러
  const handleTitleSave = useCallback(async () => {
    if (!blockData || !title.trim()) {
      return;
    }

    try {
      await businessOnTitleSave({
        blockId,
        title: title,
        blockData,
      });
    } catch (error) {
      // 에러 발생 시 원래 title로 되돌림
      setTitle((blockData.title as string) || '새 블럭');
    }
  }, [blockId, title, blockData, businessOnTitleSave, setTitle]);

  // Enter 키로 저장
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleSave();
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        setTitle((blockData?.title as string) || '새 블럭');
        inputRef.current?.blur();
      }
    },
    [handleTitleSave, blockData?.title, setTitle, inputRef]
  );

  return {
    ...uiState,
    handleTitleSave,
    handleKeyDown,
    onClose: businessOnClose,
  };
}
