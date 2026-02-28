'use client';

import { ImageFormContent } from './image-form-content';
import { useImageAdd } from './use-image-add';
import { DriveAddFormLayout } from '../drive-add-form-layout';

export interface ImageAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

export function ImageAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: ImageAddSectionProps) {
  const {
    selectedFile,
    setSelectedFile,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    isSubmitting,
  } = useImageAdd(orgId, workspaces, onClose);

  return (
    <DriveAddFormLayout
      header={{ title: 'Image', description: 'Upload or add an image.' }}
      onCancel={onClose}
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
      <ImageFormContent
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
