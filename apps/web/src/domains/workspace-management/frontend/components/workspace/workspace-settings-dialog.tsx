'use client';

import React, { useEffect, useState } from 'react';
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
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Settings, Users, UserPlus } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { IconPicker } from '../shared/icon-picker';
import { WorkspaceMemberListTable } from './workspace-member-list-table';
import { InviteMemberDialog } from './invite-member-dialog';
import { useWorkspace } from '../../hooks/use-workspace';
import type {
  WorkspaceWithPagesDTO,
  WorkspaceMemberView,
} from '@/domains/workspace-management/shared/dtos';

/**
 * Workspace update form validation schema
 */
const updateWorkspaceSchema = z.object({
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

type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceSchema>;
type SettingsTab = 'general' | 'members';

interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithPagesDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disableInvite?: boolean; // Hide Members tab for personal workspace
}

/**
 * WorkspaceSettingsDialog component (tab structure)
 *
 * Workspace settings management
 * - Settings tab: Edit workspace information
 * - Members tab: Member list and invitations
 */
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  disableInvite = false,
}: WorkspaceSettingsDialogProps) {
  const {
    updateWorkspaceInfo,
    getWorkspaceMembers,
    canInviteMembers,
    isLoading,
  } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [memberView, setMemberView] = useState<WorkspaceMemberView | null>(
    null
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const form = useForm<UpdateWorkspaceFormValues>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || '',
      icon: workspace.icon || 'Folder',
    },
  });

  // Reset form when workspace prop changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: workspace.name,
        description: workspace.description || '',
        icon: workspace.icon || 'Folder',
      });
      // Always initialize to general tab when modal opens
      setActiveTab('general');
    }
  }, [workspace, open, form]);

  // Load member list when dialog opens
  useEffect(() => {
    if (open && activeTab === 'members' && !disableInvite) {
      loadMemberView();
    }
  }, [open, activeTab, workspace.workspaceId, disableInvite]);

  const loadMemberView = async () => {
    setIsLoadingMembers(true);
    const result = await getWorkspaceMembers(workspace.workspaceId);
    setMemberView(result);
    setIsLoadingMembers(false);
  };

  const handleInviteSuccess = () => {
    setIsInviteDialogOpen(false);
    loadMemberView(); // Refresh member list
  };

  const handleSubmit = async (values: UpdateWorkspaceFormValues) => {
    const success = await updateWorkspaceInfo({
      workspaceId: workspace.workspaceId,
      name: values.name,
      description: values.description || null,
      icon: values.icon || null,
    });

    if (success) {
      // Reset form only without closing modal (allow switching to other tabs)
      form.reset(values);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const isDirty = form.formState.isDirty;
  const descriptionLength = form.watch('description')?.length || 0;

  // Hide Members tab for personal workspace
  const tabs = [
    { id: 'general' as const, label: 'Settings', icon: Settings },
    ...(disableInvite
      ? []
      : [{ id: 'members' as const, label: 'Members', icon: Users }]),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] h-[600px] p-0 rounded-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Workspace Settings</DialogTitle>
            <DialogDescription>
              Change workspace settings or manage members.
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-full">
            {/* Left Tab Navigation */}
            <div className="w-48 border-r border-border/30 bg-muted/30 p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-sm px-2">
                  Workspace Settings
                </h3>
              </div>
              <div className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                        activeTab === tab.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="h-full w-full">
                <div className="p-6 pb-8 min-h-full">
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold">
                          General Settings
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Edit workspace name, description, and icon.
                        </p>
                      </div>
                      <Separator />

                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handleSubmit)}
                          className="space-y-4"
                        >
                          {/* Workspace Name & Icon */}
                          <div className="space-y-2">
                            <FormLabel>
                              Workspace Name{' '}
                              <span className="text-destructive">*</span>
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
                                    {workspace.isDefault && (
                                      <p className="text-xs text-muted-foreground">
                                        Default workspace (cannot be deleted)
                                      </p>
                                    )}
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

                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onOpenChange(false)}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={!isDirty || isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}

                  {activeTab === 'members' && !disableInvite && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">
                            Member Management
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Invite and manage workspace members.
                          </p>
                        </div>
                        {canInviteMembers(workspace.workspaceId) && (
                          <Button
                            onClick={() => setIsInviteDialogOpen(true)}
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Invite Member
                          </Button>
                        )}
                      </div>
                      <Separator />

                      {/* Member List */}
                      <WorkspaceMemberListTable
                        currentMembers={memberView?.currentMembers || []}
                        pendingInvitations={
                          memberView?.pendingInvitations || []
                        }
                        isLoading={isLoadingMembers}
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Invite Dialog */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        workspaceId={workspace.workspaceId}
        workspaceName={workspace.name}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
}
