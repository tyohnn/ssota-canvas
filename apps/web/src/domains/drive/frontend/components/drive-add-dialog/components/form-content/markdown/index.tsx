'use client';

import { MarkdownFormContent } from './markdown-form-content';
import { useMarkdownAdd } from './use-markdown-add';
import { DriveAddFormLayout } from '../drive-add-form-layout';

export interface MarkdownAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

export function MarkdownAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: MarkdownAddSectionProps) {
  const {
    markdownContent,
    setMarkdownContent,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    hasContent,
    isSubmitting,
  } = useMarkdownAdd(orgId, workspaces, onClose);

  return (
    <DriveAddFormLayout
      header={{
        title: 'Note',
        description: 'Create a note or document with rich text.',
      }}
      onCreate={submit}
      isCreateDisabled={isLoadingWorkspaces || !hasContent}
      isSubmitting={isSubmitting}
      title={title}
      onTitleChange={setTitle}
      workspaceId={workspaceId}
      onWorkspaceIdChange={setWorkspaceId}
      workspaces={workspaces}
      isLoadingWorkspaces={isLoadingWorkspaces}
    >
      <MarkdownFormContent
          content={markdownContent}
          onContentChange={setMarkdownContent}
          title={title}
          onTitleChange={setTitle}
          workspaceId={workspaceId}
          onWorkspaceIdChange={setWorkspaceId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
        />
    </DriveAddFormLayout>
  );
}
