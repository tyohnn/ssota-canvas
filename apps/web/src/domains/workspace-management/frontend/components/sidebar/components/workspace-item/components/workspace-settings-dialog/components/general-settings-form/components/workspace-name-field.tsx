'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IconPicker } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import { Box } from '@workspace/ui/components/ui/box';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateWorkspaceFormValues } from '../core/types';

/**
 * Workspace Name Field (Presentational)
 *
 * Icon picker + Name input combo
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (form control)
 * - Storybook testable
 */

interface WorkspaceNameFieldProps {
  form: UseFormReturn<UpdateWorkspaceFormValues>;
  isSubmitting: boolean;
  isDefault?: boolean;
}

export function WorkspaceNameField({
  form,
  isSubmitting,
  isDefault = false,
}: WorkspaceNameFieldProps) {
  return (
    <Box className="flex items-start gap-2">
      {/* Icon Picker */}
      <FormField
        control={form.control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <IconPicker value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Name Input */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                placeholder="e.g. Marketing Project"
                maxLength={100}
                disabled={isSubmitting}
                {...field}
              />
            </FormControl>
            {isDefault && (
              <p className="text-xs text-muted-foreground">
                Default workspace (cannot be deleted)
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </Box>
  );
}
