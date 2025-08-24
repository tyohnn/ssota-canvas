"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/ui/breadcrumb";
import { Separator } from "@workspace/ui/components/ui/separator";
import { SidebarTrigger } from "@workspace/ui/components/ui/sidebar";
import { useOrganizationContext } from "@/domains/dashboard/context/OrganizationCotext";

export function DashboardHeader() {
  const { activeOrganization } = useOrganizationContext();
  const headerTitle = activeOrganization?.name;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">
                {headerTitle}'s Dashboard
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
