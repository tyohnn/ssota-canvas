'use client';

import { AudioFormContent } from './audio-form-content';
import { useAudioAdd } from './use-audio-add';
import { DriveAddFormLayout } from '../drive-add-form-layout';

export interface AudioAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

export function AudioAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: AudioAddSectionProps) {
  const {
    selectedFile,
    setSelectedFile,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    isSubmitting,
  } = useAudioAdd(orgId, workspaces, onClose);

  return (
    <DriveAddFormLayout
      header={{ title: 'Audio', description: 'Upload or add an audio file.' }}
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
      <AudioFormContent
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
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
