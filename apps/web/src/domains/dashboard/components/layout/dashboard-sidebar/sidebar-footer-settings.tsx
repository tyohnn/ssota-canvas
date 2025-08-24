"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/ui/dialog";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/ui/sidebar";
import { Settings2 } from "lucide-react";

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
