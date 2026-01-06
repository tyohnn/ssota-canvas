import { useCallback, useEffect, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import {
  useCanvasModeContext,
  usePreventPinchZoom,
} from '@/domains/canvas-management/frontend/hooks';

import type {
  CanvasToolbarProps,
  ModeDependencies,
  ReactFlowDependencies,
  UseCanvasToolbarReturn,
} from './types';

/**
 * Combined Hook: Canvas Toolbar Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useCanvasToolbar(
  props: CanvasToolbarProps
): UseCanvasToolbarReturn {
  // 1. Gather External Dependencies (The only place where external hooks are called)
  // Domain / Service Hooks
  const reactFlow = useReactFlow();
  const canvasMode = useCanvasModeContext();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 2. Bundle Dependencies into semantic objects
  const reactFlowDependencies: ReactFlowDependencies = {
    fitView: reactFlow.fitView,
  };

  const modeDependencies: ModeDependencies = {
    isBlockCreationMode: canvasMode.isBlockCreationMode,
    isPanningMode: canvasMode.isPanningMode,
    getCurrentMode: canvasMode.getCurrentMode,
    enterPanningMode: canvasMode.enterPanningMode,
    exitToDefaultMode: canvasMode.exitToDefaultMode,
  };

  // 3. Prevent pinch zoom on toolbar
  usePreventPinchZoom(toolbarRef);

  // 4. Compute state
  const isBlockCreationMode = modeDependencies.isBlockCreationMode();
  const isPanningMode = modeDependencies.isPanningMode();
  const currentMode = modeDependencies.getCurrentMode();

  // 5. Compose handlers
  const onSelectClick = useCallback(() => {
    modeDependencies.exitToDefaultMode();
  }, [modeDependencies]);

  const onHandClick = useCallback(() => {
    modeDependencies.enterPanningMode();
  }, [modeDependencies]);

  const onFitToViewClick = useCallback(() => {
    reactFlowDependencies.fitView({ duration: 200, padding: 0.1 });
  }, [reactFlowDependencies]);

  const onAddBlockClick = useCallback(() => {
    props.onAddBlockClick?.();
  }, [props]);

  // 6. Keyboard event handlers
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      // Ignore system shortcuts but allow Shift
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case 'KeyF':
          event.preventDefault();
          event.stopPropagation();
          onFitToViewClick();
          break;
        case 'Space':
          // Space를 누르면 패닝 모드로 전환 (임시)
          if (!isPanningMode) {
            event.preventDefault();
            event.stopPropagation();
            modeDependencies.enterPanningMode();
          }
          break;
        case 'Escape':
          // 기본 모드로 복귀 (block-editing 모드는 제외 - 에디터 패널이 처리)
          if (
            currentMode.type !== 'default' &&
            currentMode.type !== 'block-editing'
          ) {
            event.preventDefault();
            event.stopPropagation();
            modeDependencies.exitToDefaultMode();
          }
          break;
      }
    },
    [onFitToViewClick, modeDependencies, currentMode, isPanningMode]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      if (event.code === 'Space') {
        // 스페이스바를 떼면 무조건 default 모드로 (isPanningMode 체크 제거)
        // React Flow의 이벤트 핸들러가 남아있을 수 있으므로 강제로 모드 전환
        event.preventDefault();
        event.stopPropagation();
        
        if (isPanningMode) {
          modeDependencies.exitToDefaultMode();
        }
      }
    },
    [modeDependencies, isPanningMode]
  );

  // 7. Keyboard event listeners (Side effect)
  useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };
    const handleKeyUpWrapper = (event: KeyboardEvent) => {
      handleKeyUp(event);
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener('keydown', handleKeyDownWrapper, true);
    document.addEventListener('keyup', handleKeyUpWrapper, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper, true);
      document.removeEventListener('keyup', handleKeyUpWrapper, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  // 8. Compose and Return
  return {
    toolbarRef,
    isBlockCreationMode,
    isPanningMode,
    currentMode,
    onSelectClick,
    onHandClick,
    onFitToViewClick,
    onAddBlockClick,
  };
}
