'use client';

import { useCallback, useEffect, useState } from 'react';

import { extractPlainText } from '@/domains/block-management/shared/utils/tiptap-json.utils';
import type { JSONContent } from '@tiptap/core';

import { useDriveCreateBlock } from '@/domains/drive/frontend/hooks/use-drive-create-block';

export function useMarkdownAdd(
  orgId: string,
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>,
  onClose: () => void
) {
  const createBlock = useDriveCreateBlock(orgId);

  const [markdownContent, setMarkdownContent] = useState<JSONContent | null>(null);
  const [title, setTitle] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const effectiveWorkspaceId =
    workspaceId || workspaces[0]?.workspaceId || '';

  useEffect(() => {
    if (workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0]!.workspaceId);
    }
  }, [workspaces, workspaceId]);

  const submit = useCallback(async () => {
    if (!effectiveWorkspaceId) return;
    const content = markdownContent ?? { type: 'doc', content: [] };
    await createBlock.mutateAsync({
      organizationId: orgId,
      workspaceId: effectiveWorkspaceId,
      blockType: 'markdown',
      title: title || 'Untitled',
      initialContent: content,
    });
    onClose();
  }, [
    orgId,
    markdownContent,
    title,
    effectiveWorkspaceId,
    createBlock,
    onClose,
  ]);

  const hasContent = !!extractPlainText(
    markdownContent as Record<string, unknown> | null
  ).trim();

  return {
    markdownContent,
    setMarkdownContent,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    hasContent,
    isSubmitting: createBlock.isPending,
  };
}
