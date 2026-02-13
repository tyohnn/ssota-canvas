'use client';

import React, { type ReactNode, createContext, useContext } from 'react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import { useCanvasMode } from './use-canvas-mode';

/**
 * Enter Block Editing Mode Options
 *
 * 에디터 패널을 열 때 전달할 수 있는 옵션
 */
export interface EnterBlockEditingOptions {
  tab?: string;
  tabOptions?: Record<string, any>;
}

export type CanvasMode =
  | { type: 'default' } // 초기 모드
  | { type: 'panning' } // 패닝(Hand Tool) 모드
  | { type: 'block-creation'; blockType: BlockType } // 블럭 추가 모드
  | { type: 'single-selection'; blockMountId: string } // 단일 선택 모드 (캔버스 노드 = block_mounts.id)
  | { type: 'multi-selection'; blockMountIds: string[] } // 복수 선택 모드
  | {
    type: 'block-editing';
    blockId: string;
    blockMountId: string;
    initialTab?: {
      tab: string;
      tabOptions?: Record<string, any>;
    };
  } // 블럭 편집 모드
  | { type: 'dragging'; blockMountIds: string[] } // 드래그 중
  | { type: 'edge-creation'; sourceBlockId: string }; // 엣지 생성 중

export interface CanvasModeContextValue {
  // 상태 읽기
  mode: CanvasMode;
  isTextareaEditing: boolean;

  // 모드 전환
  enterPanningMode: () => void;
  enterBlockCreationMode: (blockType: BlockType) => void;
  enterSingleSelectionMode: (blockMountId: string) => void;
  enterMultiSelectionMode: (blockMountIds: string[]) => void;
  enterBlockEditingMode: (
    blockId: string,
    blockMountId: string,
    options?: EnterBlockEditingOptions
  ) => void;
  /** block-editing 모드일 때 initialTab.tabOptions를 병합 업데이트. blockId/blockMountId가 주어지면 해당 블록일 때만 적용 */
  updateBlockEditingTabOptions: (
    partial: Record<string, unknown>,
    opts?: { blockId?: string; blockMountId?: string }
  ) => void;
  enterDraggingMode: (blockMountIds: string[]) => void;
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
