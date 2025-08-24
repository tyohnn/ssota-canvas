"use client";

import { Suspense } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/ui/sidebar";
import { useOrganizationContext } from "@/domains/dashboard/context/OrganizationCotext";

export function OrgWorkspacesMenu() {
  const { activeWorkspace, orgWorkspaces, activeOrganization } =
    useOrganizationContext();

  return (
    <>
      {orgWorkspaces.map((ws) => {
        const isActive = activeWorkspace?.id === ws.id;
        return (
          <SidebarMenuItem key={ws.id}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className="text-muted-foreground hover:text-muted-foreground hover:bg-sidebar-accent/80 [&_svg]:text-muted-foreground [&_svg]:hover:text-muted-foreground"
              tooltip={ws.name}
            >
              <a href={`/${activeOrganization?.slug}/${ws.id}`}>
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
                      name={((ws.icon_name as string) || "blocks") as IconName}
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
