'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { ChevronDown, Plus } from 'lucide-react';
import { Badge } from '@workspace/ui/components/ui/badge';
import { useOrganization } from '@/domains/organization-management/frontend/hooks/use-organization';
import { CreateOrganizationDialog } from './create-organization-dialog';

export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizations, selectedOrganization, selectOrganization } =
    useOrganization();
  const [mounted, setMounted] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing a consistent state until mounted
  const displayName = mounted ? selectedOrganization?.name : '조직 선택';
  const displayInitial = mounted
    ? selectedOrganization?.name?.charAt(0)?.toUpperCase() || 'O'
    : 'O';

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-full px-1.5">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                  <span className="text-[10px] font-semibold">
                    {displayInitial}
                  </span>
                </div>
                <span className="truncate font-medium flex-1">
                  {displayName}
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
              {organizations.map(org => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => {
                    selectOrganization(org.id);
                    // URL 이동: /r/[orgId]/workspace
                    router.push(`/r/${org.id}/workspace`);
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <span className="text-xs font-semibold">
                      {org.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span>{org.name}</span>
                      {org.isDefault && org.role === 'owner' && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5"
                        >
                          기본
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  새 조직 만들기
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
