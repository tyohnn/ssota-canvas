'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { MemberInvitationForm } from './member-invitation-form';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-md">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Enter an email address to invite a member to the organization.
          </DialogDescription>
        </DialogHeader>
        <MemberInvitationForm
          organizationId={organizationId}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false); // Close dialog
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
