/**
 * Note View Types
 *
 * NoteView 컴포넌트의 타입 정의
 */
import type { RefObject } from 'react';

import type { Editor } from '@tiptap/react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';

export interface NoteViewProps {
  data: BlockNodeData;
  className?: string;
  selected?: boolean;
}

export interface NoteViewUIState {
  // 편집 상태
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isDoubleClickMode: boolean;
  setIsDoubleClickMode: (mode: boolean) => void;

  // Refs
  editorContainerRef: RefObject<HTMLDivElement | null>;
  previousContentRef: RefObject<string>;
  editorReadyRef: RefObject<boolean>;
  isInitialMountRef: RefObject<boolean>;
  debounceTimerRef: RefObject<NodeJS.Timeout | null>;

  // Handlers
  handleBlockDoubleClick: (e: React.MouseEvent) => void;
  handleEditorClick: (e: React.MouseEvent) => void;
  handleEnterEditing: () => void;
  handleExitEditing: () => void;
}

export interface NoteViewBusinessLogic {
  // Content 저장
  saveContentToServer: (content: any, contentRaw?: string) => Promise<void>;
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
  };
}

export type UpdateBlockContentFunction = (input: {
  nodeId: string;
  content: unknown;
  blockData: BlockNodeData;
  contentRaw?: string;
}) => Promise<boolean>;

export interface UseNoteViewOptions {
  businessLogic?: NoteViewBusinessLogic;
  canvasMetadataOverride?: CanvasMetadata;
}

export interface UseNoteViewReturn {
  editor: Editor | null;
  uiState: NoteViewUIState;
  business: NoteViewBusinessLogic;
}
