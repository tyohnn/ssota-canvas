'use client';

import { useMemo } from 'react';
import { useMemberManagementContext } from '../contexts/member-management-context';

export function useMemberManagement() {
  const context = useMemberManagementContext();

  // 유틸리티 함수
  const canInviteMembers = useMemo(() => {
    const role = context.organizationMembers?.userRole;
    return role === 'owner' || role === 'admin';
  }, [context.organizationMembers?.userRole]);

  const getCurrentMembers = useMemo(() => {
    return context.organizationMembers?.currentMembers || [];
  }, [context.organizationMembers?.currentMembers]);

  const getPendingInvitations = useMemo(() => {
    return context.organizationMembers?.pendingInvitations || [];
  }, [context.organizationMembers?.pendingInvitations]);

  const isMember = (email: string): boolean => {
    return getCurrentMembers.some(m => m.email === email);
  };

  const hasPendingInvitation = (email: string): boolean => {
    return getPendingInvitations.some(i => i.inviteeEmail === email);
  };

  return {
    // 상태
    organizationMembers: context.organizationMembers,
    isLoading: context.isLoading,
    error: context.error,

    // 액션
    refreshOrganizationMembers: context.refreshOrganizationMembers,
    searchUserByEmail: context.searchUserByEmail,

    // 유틸리티
    canInviteMembers,
    getCurrentMembers,
    getPendingInvitations,
    isMember,
    hasPendingInvitation,
  };
}
