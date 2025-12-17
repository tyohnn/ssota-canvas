'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

/**
 * Invite Member Dialog Header (Presentational)
 *
 * Displays dialog title and description
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InviteMemberDialogHeaderProps {
  workspaceName: string;
}

export function InviteMemberDialogHeader({
  workspaceName,
}: InviteMemberDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        Invite Member
      </DialogTitle>
      <DialogDescription>
        Invite members to <span className="font-medium">{workspaceName}</span>{' '}
        workspace.
      </DialogDescription>
    </DialogHeader>
  );
}
