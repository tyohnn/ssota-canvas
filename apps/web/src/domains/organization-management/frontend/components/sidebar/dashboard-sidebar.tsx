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
  GraduationCap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { TutorialDialogStandalone } from '@/domains/tutorial-management/frontend/components/tutorial-dialog/tutorial-dialog-dynamic';

const GETTING_STARTED_TUTORIAL_ID = 'getting-started';

export function DashboardSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [initialTutorialId, setInitialTutorialId] = useState<string | undefined>(undefined);

  const HELP_CENTER_URL = 'https://helpcenter.ssota.ai/';
  const UPDATES_URL = 'https://feedback.ssota.ai/changelog';
  const [tutorialPrefetched, setTutorialPrefetched] = useState(false);
  const tutorialModulePrefetchedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleTutorialHover = () => {
    if (!tutorialModulePrefetchedRef.current) {
      tutorialModulePrefetchedRef.current = true;
      // Prefetch module only (no mount) - component mounts only on click
      import(
        '@/domains/tutorial-management/frontend/components/tutorial-dialog'
      );
    }
  };

  return (
    <Sidebar className="border-r-0 p-0 select-none">
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
              size="sm"
              onClick={toggleTheme}
              className="text-sidebar-foreground"
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
              size="sm"
              className="text-sidebar-foreground"
              tooltip="Templates"
              onClick={() => setIsTemplatesOpen(true)}
            >
              <Blocks />
              <span>Templates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-sidebar-foreground"
              tooltip="Updates"
              onClick={() => window.open(UPDATES_URL, '_blank', 'noopener,noreferrer')}
            >
              <RefreshCw />
              <span>Updates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-sidebar-foreground"
              tooltip="Tutorials"
              onClick={() => {
                setTutorialPrefetched(true); // Keep component mounted after first open to avoid remount issues
                setInitialTutorialId(undefined);
                setIsTutorialOpen(true);
              }}
              onMouseEnter={handleTutorialHover}
            >
              <GraduationCap />
              <span>Tutorials</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-sidebar-foreground"
              tooltip="Help center"
              onClick={() => window.open(HELP_CENTER_URL, '_blank', 'noopener,noreferrer')}
            >
              <MessageCircleQuestion />
              <span>Help center</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* Tutorial Dialog - keep mounted when prefetched to avoid remount/reopen issues */}
      {(isTutorialOpen || tutorialPrefetched) && (
        <TutorialDialogStandalone
          open={isTutorialOpen}
          onOpenChange={(open) => {
            if (!open) setInitialTutorialId(undefined);
            setIsTutorialOpen(open);
          }}
          initialTutorialId={initialTutorialId}
        />
      )}

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

    </Sidebar>
  );
}
