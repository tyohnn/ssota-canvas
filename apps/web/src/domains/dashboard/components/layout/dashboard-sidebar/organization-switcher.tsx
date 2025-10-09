'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { ChevronDown, Plus } from 'lucide-react';
import { useOrganization } from '@/domains/organization-management/frontend/hooks/use-organization';

/**
 * Renders a sidebar dropdown that displays available organizations and lets the user select or add one.
 *
 * Selecting an organization updates the active organization via the useOrganization hook; routing to the selected organization's path is prepared but not executed.
 *
 * @returns A SidebarMenu containing a button that opens a dropdown list of organizations with items to select an organization or add a new one.
 */
export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizations, selectedOrganization, selectOrganization } =
    useOrganization();

  const handleOrganizationSelect = (organizationId: string) => {
    selectOrganization(organizationId);

    // 선택된 조직으로 라우팅 (r/ 경로 사용)
    const selectedOrg = organizations.find(
      org => org.id.value === organizationId
    );
    if (selectedOrg) {
      // TODO: 조직 slug를 사용한 라우팅 구현 필요
      // router.push(`/r/${selectedOrg.slug}`);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <span className="text-[10px] font-semibold">
                  {selectedOrganization?.name.charAt(0) || 'O'}
                </span>
              </div>
              <span className="truncate font-medium">
                {selectedOrganization?.name || '조직 선택'}
              </span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id.value}
                onClick={() => handleOrganizationSelect(org.id.value)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <span className="text-xs font-semibold">
                    {org.name.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span>{org.name}</span>
                  {org.isDefault && (
                    <span className="text-xs text-muted-foreground">
                      (기본)
                    </span>
                  )}
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}