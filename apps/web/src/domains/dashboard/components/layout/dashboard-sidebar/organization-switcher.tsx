'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { OrganizationSelector } from '@/domains/user-management/frontend/components/organization-selector';
import { useOrganization } from '@/domains/user-management/frontend/hooks/use-organization';

export function OrganizationSwitcher() {
  const router = useRouter();
  const { selectedOrganization, selectOrganization } = useOrganization();

  const handleOrganizationChange = (organizationId: string) => {
    selectOrganization(organizationId);
    
    // 선택된 조직으로 라우팅 (orgSlug 기반)
    const selectedOrg = selectedOrganization;
    if (selectedOrg) {
      // TODO: 조직 slug를 사용한 라우팅 구현 필요
      // router.push(`/${selectedOrg.slug}`);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="px-2">
          <OrganizationSelector 
            onValueChange={handleOrganizationChange}
            showRefreshButton={false}
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
