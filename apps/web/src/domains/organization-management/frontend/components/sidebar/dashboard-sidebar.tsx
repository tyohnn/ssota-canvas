'use client';

import { Suspense } from 'react';
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
import { SidebarHeaderGroup } from './sidebar-header-group';
import { OrgWorkspacesSkeleton } from './org-workspaces-skeleton';
import { OrgWorkspacesMenu } from './org-workspaces-menu';
import { OrganizationSwitcher } from '../organization/organization-switcher';
import { WorkspaceSidebarContent } from '@/domains/workspace-management/frontend/components/sidebar/workspace-sidebar-content';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar className="border-r-0 p-0">
      <SidebarHeader>
        <Suspense fallback={<OrgWorkspacesSkeleton />}>
          <OrganizationSwitcher />
        </Suspense>
        <SidebarHeaderGroup />
      </SidebarHeader>

      <SidebarContent>
        {/* Workspace Management Domain: Workspace-Page 트리 */}
        <WorkspaceSidebarContent />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Theme Toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              className="text-muted-foreground"
              tooltip={
                mounted && theme === 'dark' ? '라이트 모드' : '다크 모드'
              }
            >
              {!mounted ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>
                {mounted && theme === 'dark' ? '라이트 모드' : '다크 모드'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-muted-foreground"
              tooltip="Templates"
            >
              <a href="#">
                <Blocks />
                <span>Templates</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-muted-foreground"
              tooltip="Updates"
            >
              <a href="#">
                <RefreshCw />
                <span>Updates</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-muted-foreground"
              tooltip="Help"
            >
              <a href="#">
                <MessageCircleQuestion />
                <span>Help</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
