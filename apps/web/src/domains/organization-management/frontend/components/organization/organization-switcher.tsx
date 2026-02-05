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
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/ui/avatar';
import { ChevronDown, Plus } from 'lucide-react';
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
  const displayName = mounted
    ? selectedOrganization?.name
    : 'Select Organization';
  const displayInitial = mounted
    ? selectedOrganization?.name?.charAt(0)?.toUpperCase() || 'O'
    : 'O';

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="sm" className="w-full px-1.5">
                <Avatar className="size-5 rounded-md">
                  {selectedOrganization?.iconUrl ? (
                    <AvatarImage
                      src={selectedOrganization.iconUrl}
                      alt={selectedOrganization.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-[9px] font-semibold">
                    {displayInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium flex-1">
                  {displayName}
                </span>
                <ChevronDown className="opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-md"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations
              </DropdownMenuLabel>
              {organizations.map(org => {
                const isCurrentOrg = org.id === selectedOrganization?.id;
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => {
                      selectOrganization(org.id);
                      router.push(`/r/${org.id}`);
                    }}
                    className="gap-2 p-2"
                  >
                    <Avatar className="size-6 rounded-xs border">
                      {org.iconUrl ? (
                        <AvatarImage
                          src={org.iconUrl}
                          alt={org.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-xs text-xs font-semibold">
                        {org.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span>{org.name}</span>
                        {isCurrentOrg && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Create Organization
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
