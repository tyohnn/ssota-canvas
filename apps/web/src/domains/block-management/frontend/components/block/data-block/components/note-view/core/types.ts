/**
 * Note View Types
 *
 * NoteView 컴포넌트의 타입 정의
 */
import type { RefObject } from 'react';

import type { Editor } from '@tiptap/react';

import type { MathEditingState } from '@/domains/block-management/frontend/components/tiptap-editor/core/types';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { CanvasMode } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';

export interface NoteViewProps {
  data: BlockNodeData;
  className?: string;
  selected?: boolean;
}

/**
 * Note View UI State Base
 *
 * useNoteViewUI가 직접 반환하는 상태
 */
export interface NoteViewUIStateBase {
  // 편집 상태
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isDoubleClickMode: boolean;
  setIsDoubleClickMode: (mode: boolean) => void;

  // Refs (note-view 전용)
  editorContainerRef: RefObject<HTMLDivElement | null>;

  // Handlers
  handleBlockDoubleClick: (e: React.MouseEvent) => void;
  handleEditorClick: (e: React.MouseEvent) => void;
  handleEnterEditing: () => void;
  handleExitEditing: () => void;
}

/**
 * Note View UI State
 *
 * useNoteView에서 반환하는 전체 UI 상태
 * useTipTapEditor의 state에서 제공되는 ref들을 포함
 */
export interface NoteViewUIState extends NoteViewUIStateBase {
  // Note: 아래 ref들은 useTipTapEditor의 state에서 제공되지만,
  // 하위 호환성을 위해 여기에도 포함됨
  previousContentRef: RefObject<string>;
  editorReadyRef: RefObject<boolean>;
  isInitialMountRef: RefObject<boolean>;
  debounceTimerRef: RefObject<NodeJS.Timeout | null>;
  isComposingRef: RefObject<boolean>; // 한글 입력 조합 중 플래그
}

export interface NoteViewBusinessLogic {
  /** Step 기반 저장 (step만 전송). 감사 로그는 blur 시 onBlurAudit으로 별도 기록. */
  saveStepsToServer: (
    steps: unknown[],
    baseVersion: number
  ) => Promise<void>;
}

export interface DomainDependencies {
  reactFlow: {
    getNode: (nodeId: string) => any;
    updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
  };
  canvasMetadata: {
    pageId?: string;
  };
  canvasMode: {
    setTextareaEditing: (editing: boolean) => void;
    mode?: CanvasMode;
  };
  /** Ref to update on CONTENT_VERSION_MISMATCH so next save uses correct baseVersion. We only update this ref (not editor content) to avoid overwriting user input. */
  contentVersionRef?: RefObject<number>;
}

export type UpdateBlockContentFunction = (input: {
  nodeId: string;
  content: unknown;
  blockData: BlockNodeData;
  contentRaw?: string;
}) => Promise<boolean>;

export type ApplyBlockContentStepsFunction = (input: {
  nodeId: string;
  steps: unknown[];
  baseVersion: number;
  blockData: BlockNodeData;
}) => Promise<
  | { ok: true; newVersion: number }
  | { ok: false; code?: string; serverVersion?: number; serverContent?: unknown }
>;

export interface UseNoteViewOptions {
  businessLogic?: NoteViewBusinessLogic;
  canvasMetadataOverride?: CanvasMetadata;
}

export interface UseNoteViewReturn {
  editor: Editor | null;
  uiState: NoteViewUIState;
  business: NoteViewBusinessLogic;
  mathEditing: MathEditingState | null;
  setMathEditing: (state: MathEditingState | null) => void;
}
