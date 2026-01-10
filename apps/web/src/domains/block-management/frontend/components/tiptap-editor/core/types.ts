/**
 * TipTap Editor Core Types
 *
 * 공통 TipTap Editor 훅의 타입 정의
 */
import type { RefObject } from 'react';

import type { Editor } from '@tiptap/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * TipTap Editor State
 *
 * 에디터의 내부 상태를 관리하는 ref들
 */
export interface TipTapEditorState {
  previousContentRef: RefObject<string>;
  editorReadyRef: RefObject<boolean>;
  isInitialMountRef: RefObject<boolean>;
  debounceTimerRef: RefObject<NodeJS.Timeout | null>;
  isComposingRef: RefObject<boolean>; // 한글 입력 조합 중 플래그
}

/**
 * TipTap Editor Options
 *
 * useTipTapEditor 훅의 옵션
 */
export interface TipTapEditorOptions {
  blockData: BlockNodeData;
  placeholder?: string;
  editable?: boolean;
  /**
   * Content 변경 시 호출되는 콜백
   * Optimistic update를 수행할 수 있음
   */
  onContentChange?: (content: any) => void;
  /**
   * 저장이 필요한 시점에 호출되는 콜백
   * debounce 후 또는 blur 시 호출됨
   */
  onSave?: (content: any, contentRaw?: string) => void | Promise<void>;
}

/**
 * TipTap Editor Return
 *
 * useTipTapEditor 훅의 반환값
 */
export interface UseTipTapEditorReturn {
  editor: Editor | null;
  state: TipTapEditorState;
  /**
   * 에디터 클릭 핸들러 (포커스 처리)
   */
  handleEditorClick: () => void;
}

