'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { SidebarHeaderGroup } from './sidebar-header-group';
import { OrganizationSwitcher } from '../organization/organization-switcher';
import { WorkspaceSidebarContent } from '@/domains/workspace-management/frontend/components/sidebar';
import {
  MessageCircleQuestion,
  Plus,
  RefreshCw,
  Blocks,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function DashboardSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar className="border-r-0 p-0">
      <SidebarHeader>
        <OrganizationSwitcher />
        <SidebarHeaderGroup />
      </SidebarHeader>

      <SidebarContent>
        <WorkspaceSidebarContent />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Theme Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              className="text-muted-foreground"
              tooltip={mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {!mounted ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>
                {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground"
              tooltip="Templates"
              onClick={() => setIsTemplatesOpen(true)}
            >
              <Blocks />
              <span>Templates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground"
              tooltip="Updates"
              onClick={() => setIsUpdatesOpen(true)}
            >
              <RefreshCw />
              <span>Updates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-muted-foreground"
              tooltip="Help"
              onClick={() => setIsHelpOpen(true)}
            >
              <MessageCircleQuestion />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* Templates Dialog */}
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Templates</DialogTitle>
            <DialogDescription>
              Browse and use templates to quickly set up your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">🚧 Preparing...</p>
            <p className="text-xs text-muted-foreground mt-2">
              This feature is under development
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Updates Dialog */}
      <Dialog open={isUpdatesOpen} onOpenChange={setIsUpdatesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Updates</DialogTitle>
            <DialogDescription>
              Stay up to date with the latest features and improvements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">🚧 Preparing...</p>
            <p className="text-xs text-muted-foreground mt-2">
              This feature is under development
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get help and learn how to use SSOTA effectively.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">🚧 Preparing...</p>
            <p className="text-xs text-muted-foreground mt-2">
              This feature is under development
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
