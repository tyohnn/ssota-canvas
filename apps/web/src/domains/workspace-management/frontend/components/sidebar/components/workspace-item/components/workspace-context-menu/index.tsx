'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Settings, UserPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceSettingsDialog } from '../workspace-settings-dialog';
import { InviteMemberDialog } from '../invite-member-dialog';
import { useWorkspaceContextMenu } from './core/use-workspace-context-menu';
import type { WorkspaceContextMenuProps } from './core/types';

/**
 * WorkspaceContextMenu Component (v4.0.0)
 *
 * Workspace header three-dot menu following Container/Presentational pattern:
 *
 * **Architecture:**
 * - Domain Hook: menu state, dialog state, parent state sync (shared)
 * - Presentational Component: UI rendering only
 *
 * **Features:**
 * - Workspace settings dialog trigger
 * - Member invitation dialog trigger
 * - Archive workspace action (disabled for default workspace)
 * - Parent hover state synchronization
 * - Permission-based menu item filtering
 *
 * **Usage:**
 * ```tsx
 * <WorkspaceContextMenu
 *   workspace={workspace}
 *   onOpenChange={setIsMenuOrDialogOpen}
 *   isParentHovered={isHovered}
 *   disableInvite={workspace.isPersonal}
 * />
 * ```
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md
 */
export function WorkspaceContextMenu(props: WorkspaceContextMenuProps) {
  const {
  workspace,
    isParentHovered,
    disableInvite,
    isMenuOpen,
    showSettings,
    showInvite,
    showArchive,
    isAnyDialogOrMenuOpen,
    handleMenuOpenChange,
    handleSettingsChange,
    handleInviteChange,
    handleArchiveChange,
  } = useWorkspaceContextMenu(props);

  return (
    <>
      <DropdownMenu onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer',
              isAnyDialogOrMenuOpen
                ? 'opacity-100'
                : isParentHovered
                  ? 'opacity-100'
                  : 'opacity-0'
            )}
            role="button"
            aria-label="Workspace menu"
            tabIndex={-1}
          >
            <MoreHorizontal
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                isAnyDialogOrMenuOpen
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem onClick={() => handleSettingsChange(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Workspace Settings
          </DropdownMenuItem>

          {/* Show invite menu for regular workspaces only */}
          {!disableInvite && (
            <>
              <DropdownMenuItem onClick={() => handleInviteChange(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem
                        onClick={() => handleArchiveChange(true)}
                        disabled={workspace.isDefault}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archive Workspace
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  {workspace.isDefault && (
                    <TooltipContent>
                      <p>Default workspace cannot be deleted</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* WorkspaceSettingsDialog */}
      <WorkspaceSettingsDialog
        workspace={workspace}
        open={showSettings}
        onOpenChange={handleSettingsChange}
        disableInvite={disableInvite}
      />

      {/* InviteMemberDialog (regular workspaces only) */}
      {!disableInvite && (
        <InviteMemberDialog
          workspaceId={workspace.workspaceId}
          workspaceName={workspace.name}
          open={showInvite}
          onOpenChange={handleInviteChange}
        />
      )}

      {/* TODO: ArchiveWorkspaceDialog */}
    </>
  );
}
