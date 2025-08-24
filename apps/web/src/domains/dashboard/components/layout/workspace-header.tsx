"use client";

import * as React from "react";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
} from "@workspace/ui/components/ui/breadcrumb";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useOrganizationContext } from "@/domains/dashboard/context/OrganizationCotext";

export function WorkspaceHeader({ workspaceId }: { workspaceId: string }) {
  const { setActiveWorkspace, activeOrganization, orgWorkspaces } =
    useOrganizationContext();

  // Close once on first mount for workspace routes; allow manual reopen
  const activeWorkspace = orgWorkspaces.find((ws) => ws.id === workspaceId);

  React.useEffect(() => {
    setActiveWorkspace(activeWorkspace ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerTitle = activeWorkspace?.name || "Workspace";
  const iconName = ((activeWorkspace?.icon_name as string) ||
    "presentation") as IconName;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3">
        <p>SSOTA</p>
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${activeOrganization?.slug}/${workspaceId}`}
                className="flex items-center flex-col"
              >
                <span className="inline-flex items-center gap-1.5">
                  <DynamicIcon name={iconName} className="size-4" />
                  <span>{headerTitle}</span>
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {/* Future: page-level crumb goes here */}
            {/* <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem> */}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
