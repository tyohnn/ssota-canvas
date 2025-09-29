"use client";

import { useContext } from 'react';
import { useOptimistic, useTransition } from 'react';
import { UserManagementContext } from '@/contexts/userManagementContext';
import { createOrganizationAction } from '@/server-actions/user-management/create-organization.action';

export function useUserManagement() {
  const context = useContext(UserManagementContext);

  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }

  const [isPending, startTransition] = useTransition();
  const [optimisticOrganizations, setOptimisticOrganizations] = useOptimistic(
    context.state.organizations
  );

  const createOrganization = async (name: string, slug?: string) => {
    // 1. 낙관적 업데이트할 조직 준비
    const optimisticOrganization = {
      id: `temp-${Date.now()}`,
      clerkId: `temp-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: context.state.currentUser?.id || '',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. 즉시 UI 업데이트
    setOptimisticOrganizations(prev => [...prev, optimisticOrganization]);

    // 3. 실제 서버 액션 호출
    startTransition(async () => {
      try {
        const result = await createOrganizationAction({ name, slug });

        if (!result.success) {
          // 4. 실패 시 이전 상태로 롤백
          setOptimisticOrganizations(context.state.organizations);

          throw new Error(result.error || '조직 생성에 실패했습니다');
        }

        // 5. 성공 시 관련 데이터 새로고침
        await context.actions.refreshUserOrganizations();

      } catch (error) {
        // 6. 에러 시 이전 상태로 롤백
        setOptimisticOrganizations(context.state.organizations);
        throw error;
      }
    });
  };

  return {
    ...context.state,
    organizations: optimisticOrganizations,
    createOrganization,
    isPending
  };
}