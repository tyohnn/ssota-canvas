'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { IconPicker } from '../shared/icon-picker';
import { useWorkspace } from '../../hooks/use-workspace';
import { InviteMemberDialog } from './invite-member-dialog';

/**
 * Workspace creation form validation schema
 */
const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Please enter a workspace name')
    .max(100, 'Workspace name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  icon: z.string().optional(),
});

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * CreateWorkspaceDialog component
 *
 * Modal for creating a new Workspace
 * - react-hook-form + zod validation
 * - IconPicker integration
 * - toast feedback
 */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { createWorkspace, isLoading } = useWorkspace();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [createdWorkspace, setCreatedWorkspace] = React.useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Folder',
    },
  });

  const handleSubmit = async (values: CreateWorkspaceFormValues) => {
    const result = await createWorkspace({
      name: values.name,
      description: values.description,
      icon: values.icon,
    });

    if (result) {
      // Save workspace information
      setCreatedWorkspace({
        workspaceId: result.workspaceId,
        workspaceName: values.name,
      });

      form.reset();
      onOpenChange(false);

      // Open member invite modal
      setIsInviteDialogOpen(true);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const descriptionLength = form.watch('description')?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a workspace to manage pages by project, team, or topic.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Workspace Name & Icon */}
            <div className="space-y-2">
              <FormLabel>
                Workspace Name <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex items-start gap-2">
                {/* Icon Picker */}
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Workspace Description */}
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
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      {descriptionLength} / 500
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Member invite modal after workspace creation */}
      {createdWorkspace && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          workspaceId={createdWorkspace.workspaceId}
          workspaceName={createdWorkspace.workspaceName}
          showSkipButton={true}
          onSuccess={() => {
            setCreatedWorkspace(null);
          }}
        />
      )}
    </Dialog>
  );
}
