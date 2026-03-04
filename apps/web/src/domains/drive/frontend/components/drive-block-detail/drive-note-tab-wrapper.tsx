/**
 * Drive Note Tab Wrapper
 *
 * Standalone note tab for Drive. Injects workspaceId and a no-op React Flow
 * adapter so useBlockNoteTiptap / useMarkdownContentSection work without Canvas.
 */

'use client';

import { useRef } from 'react';
import type { Node } from '@xyflow/react';

import { NoteTabView } from '@workspace/editor-panel';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { useMarkdownContentSection } from '@/domains/block-management/frontend/components/block/block-type/note-section/core/use-markdown-content-section';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface DriveNoteTabWrapperProps {
  blockId: string;
  blockData: DriveBlockData;
  orgId: string;
}

function createStandaloneReactFlowAdapter(
  blockData: BlockNodeData
): {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
} {
  return {
    getNode: (nodeId: string): Node | undefined =>
      nodeId === blockData.blockMountId
        ? ({
          id: nodeId,
          position: { x: 0, y: 0 },
          data: blockData,
        } as Node)
        : undefined,
    updateNode: (_nodeId: string, _options: { data: BlockNodeData }) => {
      // No-op: Drive has no React Flow store. Server save + query invalidation.
    },
  };
}

export function DriveNoteTabWrapper({
  blockId,
  blockData,
  orgId,
}: DriveNoteTabWrapperProps) {
  const contentVersionRef = useRef<number>(blockData.contentVersion ?? 0);
  const reactFlow = createStandaloneReactFlowAdapter(blockData);

  const { editor, handleEditorClick, mathEditing, setMathEditing } =
    useMarkdownContentSection({
      blockData,
      readonly: false,
      dependencies: {
        reactFlow,
        contentVersionRef,
        canvasMetadata: {
          pageId: '',
          orgId,
          workspaceId: blockData.workspaceId,
        },
      },
    });

  const editorContent =
    editor ? (
      <TipTapEditor
        editor={editor}
        editable
        onClick={handleEditorClick}
        mathEditing={mathEditing}
        onMathEditingChange={setMathEditing}
        placeholderClassName="tiptap-editor-panel"
        placeholderStyleTarget="tiptap-editor-panel"
        className={`
          [&_.ProseMirror]:min-h-[200px]
          [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_h1]:my-4
          [&_.ProseMirror_h2]:my-3
          [&_.ProseMirror_ul]:my-2
          [&_.ProseMirror_ol]:my-2
          [&_.ProseMirror_li]:my-1
          [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0
          [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:my-3
          [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4
        `}
      />
    ) : null;

  return (
    <NoteTabView
      editorContent={editorContent}
      readonly={false}
      onEditorClick={handleEditorClick}
    />
  );
}
