'use client';

import { DialogContent } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { CreateWorkspaceDialogHeader } from './dialog-header';
import {
  WorkspaceNameInput,
  WorkspaceDescriptionInput,
} from './workspace-form-fields';
import { CreateWorkspaceDialogFooter } from './dialog-footer';
import type { CreateWorkspaceDialogContextValue } from '../core/types';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateWorkspaceFormValues } from '../core/types';

/**
 * Main content of CreateWorkspaceDialog (Presentational)
 *
 * Combines:
 * - Header
 * - Form fields (Name + Description)
 * - Footer (Cancel + Submit)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface CreateWorkspaceDialogContentProps
  extends CreateWorkspaceDialogContextValue {
  className?: string;
  headerTitle?: string;
  headerDescription?: string;
}

export function CreateWorkspaceDialogContent({
  className = 'sm:max-w-[500px] rounded-md',
  headerTitle,
  headerDescription,
  form,
  isLoading,
  handleSubmit,
  handleCloseDialog,
}: CreateWorkspaceDialogContentProps) {
  return (
    <DialogContent className={className}>
      <CreateWorkspaceDialogHeader
        title={headerTitle}
        description={headerDescription}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Workspace Name & Icon */}
          <WorkspaceNameInput form={form} isLoading={isLoading} />

          {/* Workspace Description */}
          <WorkspaceDescriptionInput form={form} isLoading={isLoading} />

          {/* Footer Buttons */}
          <CreateWorkspaceDialogFooter
            isLoading={isLoading}
            handleCloseDialog={handleCloseDialog}
          />
        </form>
      </Form>
    </DialogContent>
  );
}
