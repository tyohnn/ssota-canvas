'use client';

import { Box } from '@/components/ui/box';
import { AdvancedSettingsAccordionControlled } from './advanced-settings-accordion-controlled';
import { DriveAddFormHeader } from './drive-add-form-header';

export interface DriveAddFormLayoutProps {
  header: { title: string; description: string };
  onCancel: () => void;
  onCreate: () => void;
  isCreateDisabled: boolean;
  isSubmitting: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  children: React.ReactNode;
}

export function DriveAddFormLayout({
  header,
  onCancel,
  onCreate,
  isCreateDisabled,
  isSubmitting,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
  children,
}: DriveAddFormLayoutProps) {
  return (
    <Box className="relative flex flex-col">
      <DriveAddFormHeader
        title={header.title}
        description={header.description}
        onCancel={onCancel}
        onCreate={onCreate}
        isCreateDisabled={isCreateDisabled}
        isSubmitting={isSubmitting}
      />
      <Box className="flex flex-col gap-4 p-6">
        {children}
        <AdvancedSettingsAccordionControlled
          title={title}
          onTitleChange={onTitleChange}
          workspaceId={workspaceId}
          onWorkspaceIdChange={onWorkspaceIdChange}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
        />
      </Box>
    </Box>
  );
}
