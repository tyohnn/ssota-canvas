'use client';

import React, { type ReactNode, createContext, useContext } from 'react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import { useCanvasMode } from './use-canvas-mode';

export type CanvasMode =
  | { type: 'default' } // 초기 모드
  | { type: 'panning' } // 패닝(Hand Tool) 모드
  | { type: 'block-creation'; blockType: BlockType } // 블럭 추가 모드
  | { type: 'single-selection'; blockId: string } // 단일 선택 모드
  | { type: 'multi-selection'; blockIds: string[] } // 복수 선택 모드
  | { type: 'block-editing'; blockId: string } // 블럭 편집 모드
  | { type: 'dragging'; blockIds: string[] } // 드래그 중
  | { type: 'edge-creation'; sourceBlockId: string }; // 엣지 생성 중

export interface CanvasModeContextValue {
  // 상태 읽기
  mode: CanvasMode;
  isTextareaEditing: boolean;

  // 모드 전환
  enterPanningMode: () => void;
  enterBlockCreationMode: (blockType: BlockType) => void;
  enterSingleSelectionMode: (blockId: string) => void;
  enterMultiSelectionMode: (blockIds: string[]) => void;
  enterBlockEditingMode: (blockId: string) => void;
  enterDraggingMode: (blockIds: string[]) => void;
  enterEdgeCreationMode: (sourceBlockId: string) => void;
  exitToDefaultMode: () => void;

  // Textarea 편집 상태 제어
  setTextareaEditing: (editing: boolean) => void;

  // 상태 읽기 헬퍼
  getCurrentMode: () => CanvasMode;
  isPanningMode: () => boolean;
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
  const value = useCanvasMode();

  return (
    <CanvasModeContext.Provider value={value}>
      {children}
    </CanvasModeContext.Provider>
  );
}

export function useCanvasModeContext() {
  const context = useContext(CanvasModeContext);
  if (!context) {
    throw new Error('useCanvasMode must be used within a CanvasModeProvider');
  }
  return context;
}
