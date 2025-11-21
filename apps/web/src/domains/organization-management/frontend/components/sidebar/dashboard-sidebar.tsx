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
import { useIsClient } from '@/hooks/use-is-client';

function DashboardSidebarSkeleton() {
  return (
    <aside
      className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/60 bg-muted/20 px-3 py-4 gap-4"
      aria-hidden
    >
      <div className="space-y-3">
        <div className="h-6 w-24 rounded bg-muted-foreground/20 animate-pulse" />
        <div className="h-10 rounded bg-muted-foreground/10 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-muted-foreground/20 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-9 rounded bg-muted-foreground/10 animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="mt-auto space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-9 rounded bg-muted-foreground/10 animate-pulse"
          />
        ))}
      </div>
    </aside>
  );
}

export function DashboardSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isClient = useIsClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!isClient) {
    return <DashboardSidebarSkeleton />;
  }

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
