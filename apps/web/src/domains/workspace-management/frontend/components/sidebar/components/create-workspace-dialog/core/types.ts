import type { UseFormReturn } from 'react-hook-form';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * CreateWorkspaceDialog Props
 */
export interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Workspace creation form values
 */
export interface CreateWorkspaceFormValues {
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Created workspace information for invite dialog
 */
export interface CreatedWorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
}

/**
 * Context value for CreateWorkspaceDialog
 */
export interface CreateWorkspaceDialogContextValue {
  // UI State
  isLoading: boolean;
  isInviteDialogOpen: boolean;
  createdWorkspace: CreatedWorkspaceInfo | null;

  // Business State (from TanStack Query)
  isCreating?: boolean;

  // Form state
  form: UseFormReturn<CreateWorkspaceFormValues>;

  // Actions
  setIsInviteDialogOpen: (open: boolean) => void;
  handleSubmit: (values: CreateWorkspaceFormValues) => Promise<void>;
  handleCloseDialog: () => void;
}
