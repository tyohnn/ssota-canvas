'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateWorkspaceFormValues } from '../core/types';

/**
 * Workspace Name and Icon Input (Presentational)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface WorkspaceNameInputProps {
  className?: string;
  placeholder?: string;
  form: UseFormReturn<CreateWorkspaceFormValues>;
  isLoading: boolean;
}

export function WorkspaceNameInput({
  className,
  placeholder = 'e.g. Marketing Project',
  form,
  isLoading,
}: WorkspaceNameInputProps) {
  return (
    <div className={className}>
      <FormLabel>
        Workspace Name <span className="text-destructive">*</span>
      </FormLabel>
      <div className="flex items-start gap-2 mt-2">
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
                  placeholder={placeholder}
                  maxLength={100}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

/**
 * Workspace Description Input (Presentational)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface WorkspaceDescriptionInputProps {
  className?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  form: UseFormReturn<CreateWorkspaceFormValues>;
  isLoading: boolean;
}

export function WorkspaceDescriptionInput({
  className,
  placeholder = 'Enter a brief description of the workspace',
  rows = 3,
  maxLength = 500,
  form,
  isLoading,
}: WorkspaceDescriptionInputProps) {
  const descriptionLength = form.watch('description')?.length || 0;

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>Workspace Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={isLoading}
              {...field}
            />
          </FormControl>
          <div className="flex justify-between items-center">
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              {descriptionLength} / {maxLength}
            </p>
          </div>
        </FormItem>
      )}
    />
  );
}
