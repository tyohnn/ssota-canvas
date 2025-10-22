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
          <DialogTitle>새 멤버 초대</DialogTitle>
          <DialogDescription>
            이메일 주소를 입력하여 조직에 멤버를 초대하세요.
          </DialogDescription>
        </DialogHeader>
        <MemberInvitationForm
          organizationId={organizationId}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false); // 다이얼로그 닫기
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
