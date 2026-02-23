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
  /** Buffered ProseMirror step JSONs between flushes (debounce/blur). Cleared after onSaveSteps. */
  stepsBufferRef: RefObject<unknown[]>;
  /** Server-synced content_version for optimistic locking. Updated on applyBlockContentSteps success. */
  contentVersionRef: RefObject<number>;
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
   * Step 기반 저장 (ProseMirror steps)
   * debounce(500ms)·blur·compositionend 시 steps가 있으면 steps + baseVersion으로 전송.
   */
  onSaveSteps?: (steps: unknown[], baseVersion: number) => void | Promise<void>;
  /**
   * Blur 시 감사 로그만 기록 (저장과 분리). focus→blur 구간 contentRaw diff의 patch를 전달.
   */
  onBlurAudit?: (params: {
    blockId: string;
    patch: string;
  }) => void | Promise<void>;
  /** 서버와 동기화된 content_version (step 기반 저장 시 사용) */
  initialVersion?: number;
  /** step 적용 성공 시 newVersion으로 갱신할 ref (제공 시 내부 ref 대신 사용) */
  contentVersionRef?: RefObject<number>;
  /** version mismatch 시 서버 content/version으로 동기화할 핸들러 (ref로 설정) */
  onVersionMismatchRef?: RefObject<
    ((content: unknown, version: number) => void) | null
  >;
  /**
   * 이미지 업로드 콜백 (paste/drop 시)
   * File → Supabase 업로드 후 URL 반환
   */
  uploadImage?: (file: File) => Promise<string>;
}

/**
 * Math (LaTeX) 편집 중인 노드 상태
 */
export interface MathEditingState {
  pos: number;
  latex: string;
  nodeType: 'blockMath' | 'inlineMath';
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
  /** LaTeX 수식 편집 중인 노드 (null이면 편집 중 아님) */
  mathEditing: MathEditingState | null;
  /** LaTeX 편집 상태 설정 */
  setMathEditing: (state: MathEditingState | null) => void;
}

