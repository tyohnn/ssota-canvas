'use client';

import * as React from 'react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@workspace/ui/components/ui/sidebar';
import { Settings2 } from 'lucide-react';
import { SettingsDialog } from '../member-management/settings-dialog';
import { useOrganization } from '../../hooks/use-organization';

export function SidebarFooterSettings() {
  const [open, setOpen] = React.useState(false);
  const { selectedOrganization } = useOrganization();

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="text-muted-foreground"
          tooltip="Settings"
          onClick={() => setOpen(true)}
        >
          <a href="#">
            <Settings2 />
            <span>Settings</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {selectedOrganization && (
        <SettingsDialog
          open={open}
          onOpenChange={setOpen}
          organizationId={selectedOrganization.id}
        />
      )}
    </>
  );
}
