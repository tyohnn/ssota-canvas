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
  /** When provided, shows Org > Drive > block title (Drive links to list). */
  blockTitle?: string | null;
}

const ORG_TITLE_MAX_LEN = 14;
const BLOCK_TITLE_MAX_LEN = 24;

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

/**
 * Drive page header: Org > Drive (breadcrumb). On detail: Org > Drive > block title.
 * Single line with horizontal scroll; org title truncated at 10 chars, block title at 14.
 */
export function DriveHeader({ orgId, blockTitle }: DriveHeaderProps) {
  const { organizations } = useOrganization();
  const organization = organizations.find(org => org.id === orgId);
  const displayName = organization?.name ?? 'Organization';
  const displayInitial = organization?.name?.charAt(0)?.toUpperCase() ?? 'O';
  const orgTitle = truncate(displayName, ORG_TITLE_MAX_LEN);
  const titleText =
    blockTitle != null ? truncate(blockTitle || 'Untitled', BLOCK_TITLE_MAX_LEN) : null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
        <Breadcrumb className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BreadcrumbList className="flex-nowrap gap-1.5 sm:gap-2.5 whitespace-nowrap">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link
                  href={orgId ? `/r/${orgId}` : '/r'}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Avatar className="size-5 shrink-0 rounded-md">
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
                  <span>{orgTitle}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="shrink-0">
              {blockTitle != null ? (
                <BreadcrumbLink asChild>
                  <Link
                    href={orgId ? `/r/${orgId}/drive` : '/r/drive'}
                    className="text-sm font-medium"
                  >
                    Drive
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Drive</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {titleText != null && (
              <>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbPage title={blockTitle || 'Untitled'}>{titleText}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
