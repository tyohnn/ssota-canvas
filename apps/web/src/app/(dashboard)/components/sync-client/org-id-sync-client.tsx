'use client';

import { useEffect } from 'react';

import { useOrganization } from '@/domains/organization-management/frontend/hooks/use-organization';

/**
 * URL의 orgId와 OrganizationContext의 selectedOrganizationId를 동기화.
 * /r/[orgId] 진입 시 context를 URL 기준으로 업데이트.
 */
export function OrgIdSyncClient({ orgId }: { orgId: string }) {
  const { selectedOrganizationId, selectOrganization } = useOrganization();

  useEffect(() => {
    if (selectedOrganizationId !== orgId) {
      selectOrganization(orgId);
    }
  }, [orgId, selectedOrganizationId, selectOrganization]);

  return null;
}
