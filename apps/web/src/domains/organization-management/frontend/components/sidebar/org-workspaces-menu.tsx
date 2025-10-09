'use client';

import { Suspense } from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { useOrganization } from '../../contexts/organization-context';

interface Workspace {
  id: string;
  name: string;
  icon_name?: string;
}

export function OrgWorkspacesMenu() {
  const { organizations, selectedOrganizationId } = useOrganization();
  const activeOrganization = organizations.find(
    org => org.id === selectedOrganizationId
  );

  // TODO: Implement workspace functionality
  const activeWorkspace: Workspace | null = null;
  const orgWorkspaces: Workspace[] = [];

  return (
    <>
      {orgWorkspaces.map(ws => {
        const isActive = false; // TODO: Implement workspace active state
        return (
          <SidebarMenuItem key={ws.id}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className="text-muted-foreground hover:text-muted-foreground hover:bg-sidebar-accent/80 [&_svg]:text-muted-foreground [&_svg]:hover:text-muted-foreground"
              tooltip={ws.name}
            >
              <a href={`/r/${activeOrganization?.id}/workspace/${ws.id}`}>
                <span className="inline-flex items-center justify-center size-4 shrink-0 relative">
                  <Suspense
                    fallback={
                      <Skeleton
                        className="absolute inset-0 size-4 rounded-sm"
                        aria-hidden="true"
                      />
                    }
                  >
                    <DynamicIcon
                      className="size-4"
                      name={((ws.icon_name as string) || 'blocks') as IconName}
                    />
                  </Suspense>
                </span>
                <span>{ws.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}
