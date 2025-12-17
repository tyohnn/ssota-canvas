'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Box } from '@workspace/ui/components/ui/box';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateWorkspaceFormValues } from '../core/types';

/**
 * Workspace Description Field (Presentational)
 *
 * Textarea with character counter
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (form control, character count)
 * - Storybook testable
 */

interface WorkspaceDescriptionFieldProps {
  form: UseFormReturn<UpdateWorkspaceFormValues>;
  isSubmitting: boolean;
  descriptionLength: number;
}

export function WorkspaceDescriptionField({
  form,
  isSubmitting,
  descriptionLength,
}: WorkspaceDescriptionFieldProps) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Workspace Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter a brief description of the workspace"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              {...field}
            />
          </FormControl>
          <Box className="flex justify-between items-center">
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              {descriptionLength} / 500
            </p>
          </Box>
        </FormItem>
      )}
    />
  );
}
