'use client';

import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { logBlockUpdatedAuditAction } from '@/domains/block-management/actions/block/log-block-updated-audit.action';
import { useTipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor/core/use-tiptap-editor';
import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import type { TipTapEditorState } from '@/domains/block-management/frontend/components/tiptap-editor/core/types';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { Node } from '@xyflow/react';

export type BlockNoteTiptapReactFlow = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export interface UseBlockNoteTiptapParams {
  blockData: BlockNodeData;
  reactFlow: BlockNoteTiptapReactFlow;
  editable: boolean;
  placeholder?: string;
  contentVersionRef?: RefObject<number>;
  /** Optional callback after optimistic update (e.g. blockContentChange for Note View). */
  onContentChangeSideEffect?: () => void;
  /** 테스트 시 mock 주입용. 미제공 시 useCanvasMetadata() 사용 */
  canvasMetadata?: CanvasMetadata;
}

export interface UseBlockNoteTiptapReturn {
  editor: ReturnType<typeof useTipTapEditor>['editor'];
  state: TipTapEditorState;
  handleEditorClick: () => void;
}

/**
 * Shared block-note Tiptap hook: wires useUpdateBlockContent, saveStepsToServer (with version mismatch handling), and useTipTapEditor.
 * Used by both Note View (canvas) and Note Section (editor tab) so Tiptap connection logic lives in one place.
 */
export function useBlockNoteTiptap(
  params: UseBlockNoteTiptapParams
): UseBlockNoteTiptapReturn {
  const {
    blockData,
    reactFlow,
    editable,
    placeholder = 'Click to add note...',
    contentVersionRef: contentVersionRefParam,
    onContentChangeSideEffect,
    canvasMetadata: canvasMetadataOverride,
  } = params;
  const canvasMetadata = canvasMetadataOverride ?? useCanvasMetadata();
  const { workspaceId } = canvasMetadata;

  const internalContentVersionRef = useRef<number>(
    blockData.contentVersion ?? 0
  );
  const contentVersionRef = contentVersionRefParam ?? internalContentVersionRef;

  const { applyBlockContentSteps } = useUpdateBlockContent({
    reactFlow,
    contentVersionRef,
  });

  const saveStepsToServer = useCallback(
    async (steps: unknown[], baseVersion: number) => {
      if (!applyBlockContentSteps || !blockData.blockId) return;

      try {
        const latestNode = reactFlow.getNode(blockData.blockMountId);
        const latestBlockData =
          (latestNode?.data as BlockNodeData) || blockData;

        const result = await applyBlockContentSteps({
          nodeId: blockData.blockMountId,
          steps,
          baseVersion,
          blockData: latestBlockData,
        });

        if (
          !result.ok &&
          result.code === 'CONTENT_VERSION_MISMATCH' &&
          typeof result.serverVersion === 'number' &&
          contentVersionRef?.current !== undefined
        ) {
          contentVersionRef.current = result.serverVersion;
        }
      } catch (error) {
        console.error('[BlockNoteTiptap] Failed to apply steps:', error);
      }
    },
    [blockData, reactFlow, applyBlockContentSteps, contentVersionRef]
  );

  const { editor, state, handleEditorClick } = useTipTapEditor({
    blockData,
    placeholder,
    editable,
    onContentChange: content => {
      const updatedData = { ...blockData, content };
      reactFlow.updateNode(blockData.blockMountId, { data: updatedData });
      onContentChangeSideEffect?.();
    },
    onSaveSteps: saveStepsToServer,
    onBlurAudit: async ({ blockId, patch }) => {
      if (workspaceId) {
        await logBlockUpdatedAuditAction({ workspaceId, blockId, patch });
      }
    },
    initialVersion:
      contentVersionRef?.current ?? blockData.contentVersion ?? 0,
    contentVersionRef,
  });

  return {
    editor,
    state,
    handleEditorClick,
  };
}
