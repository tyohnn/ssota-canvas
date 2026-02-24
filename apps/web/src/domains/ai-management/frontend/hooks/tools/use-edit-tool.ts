'use client';

import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';
import { tiptapToMarkdown } from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AddToolOutput } from './use-render-canvasdown-tool';

function applyLineEdit(
  currentText: string,
  operation: 'replace' | 'insert' | 'delete',
  startLine: number,
  endLine?: number,
  newContent?: string
): string {
  const lines = currentText.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(
    lines.length - 1,
    endLine != null ? endLine - 1 : start
  );
  if (operation === 'replace') {
    const insertLines = (newContent ?? '').split('\n');
    lines.splice(start, end - start + 1, ...insertLines);
  } else if (operation === 'insert') {
    const insertLines = (newContent ?? '').split('\n');
    lines.splice(start, 0, ...insertLines);
  } else {
    lines.splice(start, end - start + 1);
  }
  return lines.join('\n');
}

export interface UseEditToolDeps {
  addToolOutput: AddToolOutput;
  getNode: (id: string) => Node | null;
  updateBlockContent: (params: {
    nodeId: string;
    content: unknown;
    blockData: BlockNodeData;
    contentRaw: string;
  }) => Promise<boolean>;
}

export function useEditTool({
  getNode,
  updateBlockContent,
}: Omit<UseEditToolDeps, 'addToolOutput'>) {
  return useCallback(
    async (
      addToolOutput: AddToolOutput,
      toolCallId: string,
      args: {
        blockMountId?: string;
        operation?: 'replace' | 'insert' | 'delete';
        startLine?: number;
        endLine?: number;
        newContent?: string;
      }
    ) => {
      try {
        const blockMountId = args.blockMountId as string;
        const operation = args.operation as 'replace' | 'insert' | 'delete';
        const startLine = Number(args.startLine) || 1;
        const endLine = args.endLine != null ? Number(args.endLine) : undefined;
        const newContent = args.newContent as string | undefined;

        if (!blockMountId) {
          addToolOutput({
            tool: 'edit',
            toolCallId,
            state: 'output-error',
            errorText: 'blockMountId is required',
          });
          return;
        }
        if ((operation === 'replace' || operation === 'insert') && newContent === undefined) {
          addToolOutput({
            tool: 'edit',
            toolCallId,
            state: 'output-error',
            errorText: 'newContent is required for replace and insert',
          });
          return;
        }

        const node = getNode(blockMountId);
        if (!node) {
          addToolOutput({
            tool: 'edit',
            toolCallId,
            state: 'output-error',
            errorText: `Block not found: ${blockMountId}. Use read first to ensure the block is loaded.`,
          });
          return;
        }

        const blockData = node.data as BlockNodeData;
        let currentText = '';
        if (blockData.content && typeof blockData.content === 'object') {
          try {
            currentText = tiptapToMarkdown(blockData.content as Parameters<typeof tiptapToMarkdown>[0]);
          } catch {
            currentText = '';
          }
        }

        const newText = applyLineEdit(currentText, operation, startLine, endLine, newContent);
        const content = convertMarkdownToTiptapJSON(newText);

        const ok = await updateBlockContent({
          nodeId: blockMountId,
          content,
          blockData,
          contentRaw: newText,
        });
        if (!ok) {
          addToolOutput({
            tool: 'edit',
            toolCallId,
            state: 'output-error',
            errorText: 'Failed to update block content',
          });
          return;
        }
        addToolOutput({
          tool: 'edit',
          toolCallId,
          output: { success: true, message: 'Block lines updated.' },
        });
      } catch (error) {
        console.error('[useEditTool] error:', error);
        addToolOutput({
          tool: 'edit',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [getNode, updateBlockContent]
  );
}
