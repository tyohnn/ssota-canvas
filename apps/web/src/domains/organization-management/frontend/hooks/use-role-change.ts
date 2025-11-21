// apps/web/src/domains/organization-management/frontend/hooks/use-role-change.ts
'use client';

import { useState, useCallback } from 'react';
import { changeMemberRoleAction } from '../../actions/organization-management.actions';
import { MemberSummary } from '../../shared/dtos';
import { toast } from '@workspace/ui/components/ui/sonner';

export interface RoleChangeConfirmation {
  memberName: string;
  memberEmail: string;
  currentRole: 'owner' | 'admin' | 'member';
  newRole: 'admin' | 'member';
  isUpgrade: boolean; // true: 승격, false: 강등
}

export interface UseRoleChangeReturn {
  // 권한 검증 함수 (클라이언트 측)
  canChangeRole: (
    currentUserRole: 'owner' | 'admin' | 'member',
    targetMemberRole: 'owner' | 'admin' | 'member'
  ) => boolean;
  canDowngradeAdmin: (currentUserRole: 'owner' | 'admin' | 'member') => boolean;
  canUpgradeMember: (currentUserRole: 'owner' | 'admin' | 'member') => boolean;

  // UI 상태
  confirmationDialog: {
    isOpen: boolean;
    memberInfo: RoleChangeConfirmation | null;
    open: (info: RoleChangeConfirmation) => void;
    close: () => void;
  };

  // 액션
  selectRoleOption: (
    member: MemberSummary,
    newRole: 'admin' | 'member',
    currentUserRole: 'owner' | 'admin' | 'member'
  ) => void;
  confirmRoleChange: (
    organizationId: string,
    targetUserId: string,
    onSuccess?: () => void
  ) => Promise<void>;
  cancelRoleChange: () => void;

  // 상태
  isChanging: boolean;
  error: string | null;
}

export function useRoleChange(): UseRoleChangeReturn {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [memberInfo, setMemberInfo] = useState<RoleChangeConfirmation | null>(
    null
  );
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. 역할 변경 가능 여부
  const canChangeRole = useCallback(
    (
      currentUserRole: 'owner' | 'admin' | 'member',
      targetMemberRole: 'owner' | 'admin' | 'member'
    ): boolean => {
      // 일반 멤버는 권한 없음
      if (currentUserRole === 'member') return false;

      // 소유자는 항상 변경 가능 (자신 제외)
      if (currentUserRole === 'owner') return true;

      // 관리자는 멤버만 변경 가능
      if (currentUserRole === 'admin') return targetMemberRole === 'member';

      return false;
    },
    []
  );

  // 2. 관리자 다운그레이드 가능 여부
  const canDowngradeAdmin = useCallback(
    (currentUserRole: 'owner' | 'admin' | 'member'): boolean => {
      return currentUserRole === 'owner';
    },
    []
  );

  // 3. 멤버 업그레이드 가능 여부
  const canUpgradeMember = useCallback(
    (currentUserRole: 'owner' | 'admin' | 'member'): boolean => {
      return currentUserRole === 'owner' || currentUserRole === 'admin';
    },
    []
  );

  // 4. 역할 옵션 선택 (다이얼로그 열기)
  const selectRoleOption = useCallback(
    (
      member: MemberSummary,
      newRole: 'admin' | 'member',
      currentUserRole: 'owner' | 'admin' | 'member'
    ) => {
      // 클라이언트 측 검증
      if (!canChangeRole(currentUserRole, member.role)) {
        toast.error('역할 변경 권한이 없습니다');
        return;
      }

      const confirmation: RoleChangeConfirmation = {
        memberName: member.name,
        memberEmail: member.email,
        currentRole: member.role,
        newRole,
        isUpgrade: member.role === 'member' && newRole === 'admin',
      };

      setMemberInfo(confirmation);
      setIsDialogOpen(true);
      setError(null);
    },
    [canChangeRole]
  );

  // 5. 역할 변경 확정
  const confirmRoleChange = useCallback(
    async (
      organizationId: string,
      targetUserId: string,
      onSuccess?: () => void
    ) => {
      if (!memberInfo) return;

      setIsChanging(true);
      setError(null);

      try {
        await changeMemberRoleAction({
          organizationId,
          targetUserId,
          newRole: memberInfo.newRole,
        });

        toast.success(
          memberInfo.isUpgrade
            ? '멤버를 관리자로 승격했습니다'
            : '관리자를 멤버로 강등했습니다'
        );

        setIsDialogOpen(false);
        setMemberInfo(null);

        // 성공 콜백 실행
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '역할 변경에 실패했습니다';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsChanging(false);
      }
    },
    [memberInfo]
  );

  // 6. 역할 변경 취소
  const cancelRoleChange = useCallback(() => {
    setIsDialogOpen(false);
    setMemberInfo(null);
    setError(null);
  }, []);

  return {
    canChangeRole,
    canDowngradeAdmin,
    canUpgradeMember,
    confirmationDialog: {
      isOpen: isDialogOpen,
      memberInfo,
      open: (info: RoleChangeConfirmation) => {
        setMemberInfo(info);
        setIsDialogOpen(true);
        setError(null);
      },
      close: () => {
        setIsDialogOpen(false);
        setMemberInfo(null);
        setError(null);
      },
    },
    selectRoleOption,
    confirmRoleChange,
    cancelRoleChange,
    isChanging,
    error,
  };
}
