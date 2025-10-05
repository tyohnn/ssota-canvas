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
import { useOrganization } from '@/domains/user-management/frontend/hooks/use-organization';

export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizations, selectedOrganization, selectOrganization } =
    useOrganization();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing a consistent state until mounted
  const displayName = mounted ? selectedOrganization?.name : '조직 선택';
  const displayInitial = mounted
    ? selectedOrganization?.name?.charAt(0)?.toUpperCase() || 'O'
    : 'O';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <span className="text-[10px] font-semibold">
                  {displayInitial}
                </span>
              </div>
              <span className="truncate font-medium">{displayName}</span>
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
                key={org.id}
                onClick={() => {
                  selectOrganization(org.id);
                  // TODO: 조직 slug를 사용한 라우팅 구현 필요
                  // router.push(`/r/${org.slug}`);
                }}
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
