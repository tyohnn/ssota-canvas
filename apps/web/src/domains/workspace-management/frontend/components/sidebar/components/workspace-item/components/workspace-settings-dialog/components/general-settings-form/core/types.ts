import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * GeneralSettingsForm Props (Container)
 */
export interface GeneralSettingsFormProps {
  workspace: WorkspaceWithPagesDTO;
  onClose: () => void;
}

/**
 * Workspace update form values
 */
export interface UpdateWorkspaceFormValues {
  name: string;
  description?: string;
  icon?: string;
}

/**
 * Hook return value for useGeneralSettingsForm
 *
 * Container pattern: Returns state for Props passing
 */
export interface GeneralSettingsFormHookValue {
  // Form state
  form: any; // react-hook-form UseFormReturn type
  isDirty: boolean;

  // Business State (TanStack Query)
  isUpdating?: boolean;

  // UI State
  isLoading: boolean;

  // Derived state
  isSubmitting: boolean;
  descriptionLength: number;

  // Actions
  handleSubmit: (values: UpdateWorkspaceFormValues) => Promise<void>;
  handleClose: () => void;
}
