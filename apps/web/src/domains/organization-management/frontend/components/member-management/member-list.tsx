'use client';

import React from 'react';
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { useMemberManagement } from '../../hooks/use-member-management';
import { useRoleChange } from '../../hooks/use-role-change';
import type { MemberRow } from './member-list.types';
import { MemberListTable, MemberListTableSkeleton } from './member-list-table';
import { MemberListMobile, MemberListMobileSkeleton } from './member-list-mobile';
import { RoleChangeConfirmationDialog } from './role-change-confirmation-dialog';

export function MemberList() {
  const isMobile = useIsMobile();
  const {
    getCurrentMembers,
    getPendingInvitations,
    isLoading,
    organizationMembers,
    refreshOrganizationMembers,
  } = useMemberManagement();
  const {
    selectRoleOption,
    confirmRoleChange,
    cancelRoleChange,
    confirmationDialog,
    isChanging,
  } = useRoleChange();

  const userRole = organizationMembers?.userRole || 'member';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const allRows: MemberRow[] = [
    ...getCurrentMembers.map(member => ({
      id: member.userId,
      type: 'member' as const,
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImageUrl: member.profileImageUrl,
      role: member.role,
      dateLabel: formatDate(member.joinedAt),
    })),
    ...getPendingInvitations.map(invitation => ({
      id: invitation.id,
      type: 'pending' as const,
      name: invitation.inviteeEmail,
      email: invitation.inviteeEmail,
      role: invitation.role,
      dateLabel: formatDate(invitation.createdAt),
      inviterName: invitation.inviterName,
    })),
  ];

  const handleRoleChangeSuccess = async () => {
    if (organizationMembers?.organizationId) {
      await refreshOrganizationMembers(organizationMembers.organizationId);
    }
  };

  const handleConfirm = async () => {
    if (
      organizationMembers?.organizationId &&
      confirmationDialog.memberInfo
    ) {
      const targetMember = getCurrentMembers.find(
        m => m.email === confirmationDialog.memberInfo?.memberEmail
      );
      if (targetMember) {
        await confirmRoleChange(
          organizationMembers.organizationId,
          targetMember.userId,
          handleRoleChangeSuccess
        );
      }
    }
  };

  if (isLoading) {
    return isMobile ? (
      <MemberListMobileSkeleton />
    ) : (
      <MemberListTableSkeleton />
    );
  }

  const commonProps = {
    rows: allRows,
    userRole,
    onRoleSelect: selectRoleOption,
  };

  return (
    <>
      {isMobile ? (
        <MemberListMobile {...commonProps} />
      ) : (
        <MemberListTable {...commonProps} />
      )}
      <RoleChangeConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        memberInfo={confirmationDialog.memberInfo}
        onConfirm={handleConfirm}
        onCancel={cancelRoleChange}
        isLoading={isChanging}
      />
    </>
  );
}
