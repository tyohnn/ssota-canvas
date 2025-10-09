'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui/dialog';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@workspace/ui/components/ui/sidebar';
import { Settings2 } from 'lucide-react';

/**
 * Renders a sidebar menu item that opens a modal dialog for workspace preferences and app settings.
 *
 * @returns A React element containing a sidebar item with a button that triggers a "Settings" dialog.
 */
export function SidebarFooterSettings() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <SidebarMenuButton
            asChild
            className="text-muted-foreground"
            tooltip="Settings"
          >
            <a href="#">
              <Settings2 />
              <span>Settings</span>
            </a>
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Workspace preferences and app settings
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
}