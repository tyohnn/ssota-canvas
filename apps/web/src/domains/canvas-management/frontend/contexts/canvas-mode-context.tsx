'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type CanvasMode =
  | { type: 'default' } // 초기 모드
  | { type: 'block-creation'; blockType: string } // 블럭 추가 모드
  | { type: 'single-selection'; blockId: string } // 단일 선택 모드
  | { type: 'multi-selection'; blockIds: string[] } // 복수 선택 모드
  | { type: 'block-editing'; blockId: string } // 블럭 편집 모드
  | { type: 'dragging'; blockIds: string[] } // 드래그 중
  | { type: 'edge-creation'; sourceBlockId: string }; // 엣지 생성 중

interface CanvasModeContextValue {
  // 상태 읽기
  mode: CanvasMode;

  // 모드 전환
  enterBlockCreationMode: (blockType: string) => void;
  enterSingleSelectionMode: (blockId: string) => void;
  enterMultiSelectionMode: (blockIds: string[]) => void;
  enterBlockEditingMode: (blockId: string) => void;
  enterDraggingMode: (blockIds: string[]) => void;
  enterEdgeCreationMode: (sourceBlockId: string) => void;
  exitToDefaultMode: () => void;

  // 상태 읽기 헬퍼
  getCurrentMode: () => CanvasMode;
  isBlockCreationMode: () => boolean;
  isSingleSelectionMode: () => boolean;
  isMultiSelectionMode: () => boolean;
  isBlockEditingMode: () => boolean;
  isDraggingMode: () => boolean;
  isEdgeCreationMode: () => boolean;
}

const CanvasModeContext = createContext<CanvasModeContextValue | null>(null);

interface CanvasModeProviderProps {
  children: ReactNode;
}

export function CanvasModeProvider({ children }: CanvasModeProviderProps) {
  const [mode, setMode] = useState<CanvasMode>({ type: 'default' });

  // 모드 전환
  const enterBlockCreationMode = useCallback((blockType: string) => {
    setMode({ type: 'block-creation', blockType });
  }, []);

  const enterSingleSelectionMode = useCallback((blockId: string) => {
    setMode({ type: 'single-selection', blockId });
  }, []);

  const enterMultiSelectionMode = useCallback((blockIds: string[]) => {
    setMode({ type: 'multi-selection', blockIds });
  }, []);

  const enterBlockEditingMode = useCallback((blockId: string) => {
    setMode({ type: 'block-editing', blockId });
  }, []);

  const enterDraggingMode = useCallback((blockIds: string[]) => {
    setMode({ type: 'dragging', blockIds });
  }, []);

  const enterEdgeCreationMode = useCallback((sourceBlockId: string) => {
    setMode({ type: 'edge-creation', sourceBlockId });
  }, []);

  const exitToDefaultMode = useCallback(() => {
    setMode({ type: 'default' });
  }, []);

  // 상태 읽기 헬퍼
  const getCurrentMode = useCallback(() => mode, [mode]);

  const isBlockCreationMode = useCallback(
    () => mode.type === 'block-creation',
    [mode.type]
  );
  const isSingleSelectionMode = useCallback(
    () => mode.type === 'single-selection',
    [mode.type]
  );
  const isMultiSelectionMode = useCallback(
    () => mode.type === 'multi-selection',
    [mode.type]
  );
  const isBlockEditingMode = useCallback(
    () => mode.type === 'block-editing',
    [mode.type]
  );
  const isDraggingMode = useCallback(
    () => mode.type === 'dragging',
    [mode.type]
  );
  const isEdgeCreationMode = useCallback(
    () => mode.type === 'edge-creation',
    [mode.type]
  );

  const value: CanvasModeContextValue = {
    mode,
    enterBlockCreationMode,
    enterSingleSelectionMode,
    enterMultiSelectionMode,
    enterBlockEditingMode,
    enterDraggingMode,
    enterEdgeCreationMode,
    exitToDefaultMode,
    getCurrentMode,
    isBlockCreationMode,
    isSingleSelectionMode,
    isMultiSelectionMode,
    isBlockEditingMode,
    isDraggingMode,
    isEdgeCreationMode,
  };

  return (
    <CanvasModeContext.Provider value={value}>
      {children}
    </CanvasModeContext.Provider>
  );
}

export function useCanvasMode() {
  const context = useContext(CanvasModeContext);
  if (!context) {
    throw new Error('useCanvasMode must be used within a CanvasModeProvider');
  }
  return context;
}
