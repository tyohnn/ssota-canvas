// apps/web/src/domains/organization-management/frontend/components/member-management/role-change-confirmation-dialog.tsx

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { RoleChangeConfirmation } from '../../hooks/use-role-change';

interface RoleChangeConfirmationDialogProps {
  isOpen: boolean;
  memberInfo: RoleChangeConfirmation | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function RoleChangeConfirmationDialog({
  isOpen,
  memberInfo,
  onConfirm,
  onCancel,
  isLoading,
}: RoleChangeConfirmationDialogProps) {
  if (!memberInfo) return null;

  const roleText = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };

  const permissionMessage = memberInfo.isUpgrade
    ? 'Promoting to admin will grant invitation and management permissions.'
    : 'Demoting to member will remove management permissions.';

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to change this member's role?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 멤버 정보 */}
          <div className="space-y-1">
            <p className="text-sm font-medium">{memberInfo.memberName}</p>
            <p className="text-sm text-muted-foreground">
              {memberInfo.memberEmail}
            </p>
          </div>

          {/* 역할 변경 정보 */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="font-medium">
              {roleText[memberInfo.currentRole]}
            </span>
            <span>→</span>
            <span className="font-medium">{roleText[memberInfo.newRole]}</span>
          </div>

          {/* 권한 변경 안내 */}
          <div className="flex items-start space-x-2 rounded-md bg-blue-50 p-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">{permissionMessage}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Changing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
