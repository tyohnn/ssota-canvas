import { useCallback, useEffect } from 'react';

import { useViewport } from '@xyflow/react';

import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import type {
  BlockHeaderBusinessLogic,
  BlockHeaderHookProps,
  UseBlockHeaderReturn,
} from './types';
import { useBlockHeaderBusiness } from './use-block-header.business';
import { useBlockHeaderUI } from './use-block-header.ui';

/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useBlockHeader(
  props: BlockHeaderHookProps,
  businessLogic?: BlockHeaderBusinessLogic
): UseBlockHeaderReturn {
  // 1. Gather External Dependencies
  const { zoom } = useViewport();
  const canvasMode = useCanvasModeContext();

  // 2. UI State Hook (Designer area)
  const initialTitle = props.data.title ?? '';
  const uiState = useBlockHeaderUI(initialTitle);

  // 3. Business Logic Hook (Engineer area)
  const defaultBusiness = useBlockHeaderBusiness(props.data);
  const business = businessLogic ?? defaultBusiness;

  // 4. Visibility calculation
  // zoom 체크는 BlockToolbar에서 통합 관리
  const isVisible = props.selected && !canvasMode.isMultiSelectionMode();

  // 5. Compose Handlers
  const handleSave = useCallback(async () => {
    const trimmedTitle = uiState.title.trim();
    const success = await business.updateTitle(trimmedTitle);

    if (!success) {
      // 실패 시 원래 값으로 복원
      uiState.setTitle(initialTitle);
    } else {
      uiState.setTitle(trimmedTitle);
    }
  }, [uiState, business, initialTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        uiState.inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        uiState.setTitle(initialTitle);
        uiState.inputRef.current?.blur();
      }
    },
    [handleSave, uiState, initialTitle]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // 6. Compose and Return
  return {
    title: uiState.title,
    setTitle: uiState.setTitle,
    inputRef: uiState.inputRef,
    handleSave,
    handleKeyDown,
    handleBlur,
    isUpdating: business.isUpdating,
    isVisible,
    zoom,
  };
}
