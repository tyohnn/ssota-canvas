'use client';

import Link from 'next/link';
import { SidebarTrigger } from '@workspace/ui/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useOrganization } from '@/domains/organization-management/frontend/hooks/use-organization';

interface DriveHeaderProps {
  orgId: string;
}

/**
 * Drive page header: Org > Drive (breadcrumb). Canvas header style.
 */
export function DriveHeader({ orgId }: DriveHeaderProps) {
  const { organizations } = useOrganization();
  const organization = organizations.find(org => org.id === orgId);
  const displayName = organization?.name ?? 'Organization';
  const displayInitial = organization?.name?.charAt(0)?.toUpperCase() ?? 'O';

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3 overflow-hidden">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={orgId ? `/r/${orgId}` : '/r'}
                  className="flex items-center gap-2 truncate"
                >
                  <Avatar className="size-5 rounded-md shrink-0">
                    {organization?.iconUrl ? (
                      <AvatarImage
                        src={organization.iconUrl}
                        alt={organization.name}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-[9px] font-semibold">
                      {displayInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{displayName}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Drive</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
