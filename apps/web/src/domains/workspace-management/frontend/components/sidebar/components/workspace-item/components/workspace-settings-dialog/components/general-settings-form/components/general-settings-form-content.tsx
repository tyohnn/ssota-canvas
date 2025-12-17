'use client';

import { Separator } from '@workspace/ui/components/ui/separator';
import { FormLabel } from '@/components/ui/form';
import { Box } from '@workspace/ui/components/ui/box';
import { FormHeader } from './form-header';
import { WorkspaceNameField } from './workspace-name-field';
import { WorkspaceDescriptionField } from './workspace-description-field';
import { FormActions } from './form-actions';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateWorkspaceFormValues } from '../core/types';

/**
 * General Settings Form Content (Presentational)
 *
 * Layout for general settings form
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (form, state, callbacks)
 * - Storybook testable
 * - No business logic
 */

interface GeneralSettingsFormContentProps {
  form: UseFormReturn<UpdateWorkspaceFormValues>;
  isSubmitting: boolean;
  isDirty: boolean;
  descriptionLength: number;
  isDefault: boolean;
  onSubmit: (values: UpdateWorkspaceFormValues) => Promise<void>;
  onCancel: () => void;
}

export function GeneralSettingsFormContent({
  form,
  isSubmitting,
  isDirty,
  descriptionLength,
  isDefault,
  onSubmit,
  onCancel,
}: GeneralSettingsFormContentProps) {
  return (
    <Box className="space-y-6">
      <FormHeader />
      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Workspace Name & Icon */}
        <Box className="space-y-2">
          <FormLabel>
            Workspace Name <span className="text-destructive">*</span>
          </FormLabel>
          <WorkspaceNameField
            form={form}
            isSubmitting={isSubmitting}
            isDefault={isDefault}
          />
        </Box>

        {/* Workspace Description */}
        <WorkspaceDescriptionField
          form={form}
          isSubmitting={isSubmitting}
          descriptionLength={descriptionLength}
        />

        {/* Actions */}
        <FormActions
          onCancel={onCancel}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
        />
      </form>
    </Box>
  );
}
