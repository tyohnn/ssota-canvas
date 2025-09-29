"use client";

import { useState, useEffect, ReactNode } from 'react';
import { UserManagementContext, UserManagementState, UserManagementActions } from './userManagementContext';
import {
  loginUserAction,
  logoutUserAction,
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  restoreOrganizationAction,
  transferOwnershipAction,
  inviteMemberAction,
  acceptInvitationAction,
  rejectInvitationAction,
  changeMemberRoleAction,
  removeMemberAction,
  cancelInvitationAction,
  getUserOrganizationsAction,
  getOrganizationMembersAction,
  getUserOrganizationViewAction,
  getOrganizationMemberViewAction,
  selectOrganizationAction
} from '@/server-actions/user-management/';

interface UserManagementProviderProps {
  children: ReactNode;
}

export function UserManagementProvider({ children }: UserManagementProviderProps) {
  const [state, setState] = useState<UserManagementState>({
    currentUser: null,
    organizations: [],
    memberships: [],
    userOrganizationView: null,
    organizationMemberView: null,
    isLoading: true,
    isLoggingIn: false,
    isLoggingOut: false,
    isCreatingOrganization: false,
    isInvitingMember: false,
    isLoadingView: false,
    error: null,
  });

  // Clerk 사용자 상태 감지 및 초기 데이터 로드
  useEffect(() => {
    // Clerk의 useUser() 훅을 통해 사용자 상태 감지
    // 이 부분은 실제 구현 시 Clerk의 useUser 훅을 사용해야 함
    const checkUserAndLoadData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Clerk 사용자 정보 확인 (실제 구현에서는 useUser() 사용)
        // const { user } = useUser();
        // if (!user) return;

        const userOrganizationView = await getUserOrganizationViewAction();

        setState(prev => ({
          ...prev,
          userOrganizationView: userOrganizationView,
          currentUser: userOrganizationView?.user || null,
          organizations: userOrganizationView?.organizations || [],
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '데이터 로드에 실패했습니다',
          isLoading: false,
        }));
      }
    };

    checkUserAndLoadData();
  }, []);

  const actions: UserManagementActions = {
    loginUser: async (clerkUserId, email, sessionId, loginMethod) => {
      setState(prev => ({ ...prev, isLoggingIn: true, error: null }));

      try {
        const result = await loginUserAction({ clerkUserId, email, sessionId, loginMethod });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '로그인에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoggingIn: false }));
      }
    },

    logoutUser: async (userId, sessionId) => {
      setState(prev => ({ ...prev, isLoggingOut: true, error: null }));

      try {
        const result = await logoutUserAction({ userId, sessionId });

        if (!result.success) {
          throw new Error(result.error);
        }

        setState(prev => ({
          ...prev,
          currentUser: null,
          organizations: [],
          userOrganizationView: null,
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '로그아웃에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoggingOut: false }));
      }
    },

    selectOrganization: async (organizationId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await selectOrganizationAction({ organizationId });

        if (!result.success) {
          throw new Error(result.error);
        }

        // 조직 선택 후 View 새로고침
        await actions.loadUserOrganizationView();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 전환에 실패했습니다'
        }));
        throw error;
      }
    },

    createOrganization: async (name, slug) => {
      setState(prev => ({ ...prev, isCreatingOrganization: true, error: null }));

      try {
        const result = await createOrganizationAction({ name, slug });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 생성에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isCreatingOrganization: false }));
      }
    },

    updateOrganization: async (organizationId, name, slug) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await updateOrganizationAction({ organizationId, name, slug });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 수정에 실패했습니다'
        }));
        throw error;
      }
    },

    deleteOrganization: async (organizationId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await deleteOrganizationAction({ organizationId });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 삭제에 실패했습니다'
        }));
        throw error;
      }
    },

    restoreOrganization: async (organizationId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await restoreOrganizationAction({ organizationId });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 복구에 실패했습니다'
        }));
        throw error;
      }
    },

    transferOwnership: async (organizationId, newOwnerId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await transferOwnershipAction({ organizationId, newOwnerId });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '소유권 이전에 실패했습니다'
        }));
        throw error;
      }
    },

    inviteMember: async (organizationId, email, role) => {
      setState(prev => ({ ...prev, isInvitingMember: true, error: null }));

      try {
        const result = await inviteMemberAction({ organizationId, email, role });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshOrganizationMembers(organizationId);

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '멤버 초대에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isInvitingMember: false }));
      }
    },

    acceptInvitation: async (invitationId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await acceptInvitationAction({ invitationId });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '초대 수락에 실패했습니다'
        }));
        throw error;
      }
    },

    rejectInvitation: async (invitationId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await rejectInvitationAction({ invitationId });

        if (!result.success) {
          throw new Error(result.error);
        }

        await actions.refreshUserOrganizations();

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '초대 거절에 실패했습니다'
        }));
        throw error;
      }
    },

    changeMemberRole: async (membershipId, newRole) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await changeMemberRoleAction({ membershipId, newRole });

        if (!result.success) {
          throw new Error(result.error);
        }

        // 멤버십 변경 후 현재 조직 멤버 목록 새로고침
        if (state.userOrganizationView?.currentOrganization) {
          await actions.refreshOrganizationMembers(state.userOrganizationView.currentOrganization.id);
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '역할 변경에 실패했습니다'
        }));
        throw error;
      }
    },

    removeMember: async (membershipId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await removeMemberAction({ membershipId });

        if (!result.success) {
          throw new Error(result.error);
        }

        // 멤버 제거 후 현재 조직 멤버 목록 새로고침
        if (state.userOrganizationView?.currentOrganization) {
          await actions.refreshOrganizationMembers(state.userOrganizationView.currentOrganization.id);
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '멤버 제거에 실패했습니다'
        }));
        throw error;
      }
    },

    cancelInvitation: async (membershipId) => {
      try {
        setState(prev => ({ ...prev, error: null }));

        const result = await cancelInvitationAction({ membershipId });

        if (!result.success) {
          throw new Error(result.error);
        }

        // 초대 취소 후 현재 조직 멤버 목록 새로고침
        if (state.userOrganizationView?.currentOrganization) {
          await actions.refreshOrganizationMembers(state.userOrganizationView.currentOrganization.id);
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '초대 취소에 실패했습니다'
        }));
        throw error;
      }
    },

    refreshUserOrganizations: async () => {
      try {
        const userOrganizationView = await getUserOrganizationViewAction();
        setState(prev => ({
          ...prev,
          userOrganizationView: userOrganizationView,
          currentUser: userOrganizationView?.user || null,
          organizations: userOrganizationView?.organizations || []
        }));
      } catch (error) {
        console.error('사용자 조직 목록 새로고침 실패:', error);
      }
    },

    refreshOrganizationMembers: async (organizationId) => {
      try {
        const organizationMemberView = await getOrganizationMemberViewAction(organizationId);
        setState(prev => ({
          ...prev,
          organizationMemberView: organizationMemberView
        }));
      } catch (error) {
        console.error('조직 멤버 목록 새로고침 실패:', error);
      }
    },

    loadUserOrganizationView: async () => {
      try {
        setState(prev => ({ ...prev, isLoadingView: true }));
        const userOrganizationView = await getUserOrganizationViewAction();
        setState(prev => ({
          ...prev,
          userOrganizationView: userOrganizationView,
          isLoadingView: false
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isLoadingView: false }));
        console.error('사용자 조직 View 새로고침 실패:', error);
      }
    },

    loadOrganizationMemberView: async (organizationId) => {
      try {
        setState(prev => ({ ...prev, isLoadingView: true }));
        const organizationMemberView = await getOrganizationMemberViewAction(organizationId);
        setState(prev => ({
          ...prev,
          organizationMemberView: organizationMemberView,
          isLoadingView: false
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isLoadingView: false }));
        console.error('조직 멤버 View 새로고침 실패:', error);
      }
    },

    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },
  };

  return (
    <UserManagementContext.Provider value={{ state, actions }}>
      {children}
    </UserManagementContext.Provider>
  );
}