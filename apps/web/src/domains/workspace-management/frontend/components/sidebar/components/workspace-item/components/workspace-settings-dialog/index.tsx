'use client';

import { Dialog } from '@/components/ui/dialog';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { TabNavigation } from './components/tab-navigation';
import { GeneralSettingsForm } from './components/general-settings-form';
import { MembersTab } from './components/members-tab';
import { useWorkspaceSettingsDialog } from './core/use-workspace-settings-dialog';
import type { WorkspaceSettingsDialogProps } from './core/types';

/**
 * WorkspaceSettingsDialog Component (v4.0.0)
 *
 * Modal for managing workspace settings following Container/Presentational pattern:
 *
 * **Architecture:**
 * - Domain Hook: workspace, tab navigation, dialog close (shared)
 * - Local Containers: GeneralSettingsForm, MembersTab (independent)
 * - TanStack Query for Optimistic Updates (per tab)
 *
 * **Features:**
 * - Tab-based navigation (Settings, Members)
 * - Workspace information editing (local state)
 * - Member management (local state)
 * - Toast feedback
 *
 * **Usage:**
 * ```tsx
 * <WorkspaceSettingsDialog
 *   workspace={workspace}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md
 */
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  disableInvite,
}: WorkspaceSettingsDialogProps) {
  const { activeTab, setActiveTab, tabs, handleClose } =
    useWorkspaceSettingsDialog({
      workspace,
      open,
      onOpenChange,
      disableInvite,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[600px] p-0 rounded-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Change workspace settings or manage members.
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-full">
          {/* Left Tab Navigation */}
          <div className="w-48 border-r border-border/30 bg-muted/30 p-4">
            <div className="mb-4">
              <h3 className="font-semibold text-sm px-2">Workspace Settings</h3>
            </div>
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabClick={setActiveTab}
            />
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="h-full w-full">
              <div className="p-6 pb-8 min-h-full">
                {activeTab === 'general' && (
                  <GeneralSettingsForm
                    workspace={workspace}
                    onClose={handleClose}
                  />
                )}

                {activeTab === 'members' && (
                  <MembersTab
                    workspaceId={workspace.workspaceId}
                    workspaceName={workspace.name}
                    disableInvite={disableInvite}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
