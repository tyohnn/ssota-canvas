'use client';

import { useCallback, useMemo } from 'react';
import { useGeneralSettingsFormUI } from './use-general-settings-form.ui';
import {
  useGeneralSettingsFormBusiness,
  type GeneralSettingsFormBusinessLogic,
} from './use-general-settings-form.business';
import type {
  GeneralSettingsFormProps,
  GeneralSettingsFormHookValue,
  UpdateWorkspaceFormValues,
} from './types';

/**
 * Combined Hook for GeneralSettingsForm (Container Pattern v4.0.0)
 *
 * Integrates:
 * - UI State (from useGeneralSettingsFormUI)
 * - Business Logic (from useGeneralSettingsFormBusiness or injected)
 *
 * Supports optional business logic injection for:
 * - Testing (mock logic)
 * - Storybook (custom logic)
 * - Production (default logic)
 *
 * Returns Hook value for Container to pass as Props
 */
export function useGeneralSettingsForm(
  { workspace, onClose }: GeneralSettingsFormProps,
  businessLogic?: GeneralSettingsFormBusinessLogic
): GeneralSettingsFormHookValue {
  // UI State
  const uiState = useGeneralSettingsFormUI(workspace);

  // Business Logic
  const defaultBusiness = useGeneralSettingsFormBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Combined logic: Handle form submission
  const handleSubmit = useCallback(
    async (values: UpdateWorkspaceFormValues) => {
      uiState.setIsLoading(true);

      try {
        const result = await business.updateWorkspace({
          workspaceId: workspace.workspaceId,
          name: values.name,
          description: values.description || null,
          icon: values.icon || null,
        });

        if (result.success) {
          // Reset form with new values (don't close modal)
          uiState.form.reset(values);
        }
      } finally {
        uiState.setIsLoading(false);
      }
    },
    [workspace.workspaceId, business, uiState]
  );

  // Derived state
  const isSubmitting =
    uiState.form.formState.isSubmitting ||
    uiState.isLoading ||
    (business.isUpdating ?? false);

  const descriptionLength = uiState.form.watch('description')?.length || 0;

  // Return Hook value for Container
  return useMemo(
    () => ({
      form: uiState.form,
      isDirty: uiState.form.formState.isDirty,
      isUpdating: business.isUpdating,
      isLoading: uiState.isLoading,
      isSubmitting,
      descriptionLength,
      handleSubmit,
      handleClose: onClose,
    }),
    [uiState, business, isSubmitting, descriptionLength, handleSubmit, onClose]
  );
}
