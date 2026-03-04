'use client';

import { PdfFormContent } from './pdf-form-content';
import { usePdfAdd } from './use-pdf-add';
import { DriveAddFormLayout } from '../drive-add-form-layout';

export interface PdfAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

export function PdfAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: PdfAddSectionProps) {
  const {
    selectedFile,
    setSelectedFile,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    isSubmitting,
  } = usePdfAdd(orgId, workspaces, onClose);

  return (
    <DriveAddFormLayout
      header={{ title: 'PDF', description: 'Upload or add a PDF document.' }}
      onCreate={submit}
      isCreateDisabled={isLoadingWorkspaces || !selectedFile}
      isSubmitting={isSubmitting}
      title={title}
      onTitleChange={setTitle}
      workspaceId={workspaceId}
      onWorkspaceIdChange={setWorkspaceId}
      workspaces={workspaces}
      isLoadingWorkspaces={isLoadingWorkspaces}
    >
      <PdfFormContent
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        title={title}
        onTitleChange={setTitle}
        workspaceId={workspaceId}
        onWorkspaceIdChange={setWorkspaceId}
        workspaces={workspaces}
        isLoadingWorkspaces={isLoadingWorkspaces}
        isUploading={isSubmitting}
      />
    </DriveAddFormLayout>
  );
}
