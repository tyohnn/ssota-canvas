'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui/dialog';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { Home, Inbox, Search } from 'lucide-react';
import { useOrganization } from '@/domains/organization-management/frontend/contexts/organization-context';

/**
 * Renders the sidebar header group containing Home, Search, and Inbox controls.
 *
 * Renders a Home link (targeting /r/{activeOrganization?.id}), a Search button that opens a search dialog, and an Inbox button that opens an inbox dialog. The component derives the active organization from the organization context and manages local open state for the dialogs.
 *
 * @returns A React element containing the sidebar header group with Home, Search, and Inbox controls.
 */
export function SidebarHeaderGroup() {
  const { organizations, selectedOrganizationId } = useOrganization();
  const activeOrganization = organizations.find(
    org => org.id === selectedOrganizationId
  );
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isInboxOpen, setIsInboxOpen] = React.useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="text-muted-foreground"
          tooltip="Home"
        >
          <a href={`/r/${activeOrganization?.id}`}>
            <Home />
            <span>Home</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <SidebarMenuButton
              className="text-muted-foreground"
              tooltip="Search"
            >
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search</DialogTitle>
              <DialogDescription>Type to search...</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Dialog open={isInboxOpen} onOpenChange={setIsInboxOpen}>
          <DialogTrigger asChild>
            <SidebarMenuButton
              className="text-muted-foreground"
              tooltip="Inbox"
            >
              <Inbox />
              <span>Inbox</span>
            </SidebarMenuButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inbox</DialogTitle>
              <DialogDescription>Your recent notifications</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}