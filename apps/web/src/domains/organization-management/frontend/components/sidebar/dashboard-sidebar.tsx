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
import { MessageCircleQuestion, Plus, RefreshCw, Blocks } from 'lucide-react';

export function DashboardSidebar() {
  return (
    <Sidebar className="border-r-0 p-0">
      <SidebarHeader>
        <Suspense fallback={<OrgWorkspacesSkeleton />}>
          <OrganizationSwitcher />
        </Suspense>
        <SidebarHeaderGroup />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add Workspace">
            <Plus className="text-muted-foreground" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <Suspense fallback={<OrgWorkspacesSkeleton />}>
                <OrgWorkspacesMenu />
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
