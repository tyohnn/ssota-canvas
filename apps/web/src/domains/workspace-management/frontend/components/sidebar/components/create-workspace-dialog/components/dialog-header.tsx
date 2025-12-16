'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/**
 * Header section of CreateWorkspaceDialog
 *
 * Props are exposed for no-code tool customization
 */
interface CreateWorkspaceDialogHeaderProps {
  title?: string;
  description?: string;
  className?: string;
}

export function CreateWorkspaceDialogHeader({
  title = 'Create New Workspace',
  description = 'Create a workspace to manage pages by project, team, or topic.',
  className,
}: CreateWorkspaceDialogHeaderProps) {
  return (
    <DialogHeader className={className}>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );
}
