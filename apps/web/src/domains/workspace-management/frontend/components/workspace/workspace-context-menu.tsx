'use client';

import React, { useState } from 'react';
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
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';
import { WorkspaceSettingsDialog } from './workspace-settings-dialog';
import { InviteMemberDialog } from './invite-member-dialog';

interface WorkspaceContextMenuProps {
  workspace: WorkspaceWithPagesDTO;
  onOpenChange?: (open: boolean) => void; // Pass menu/dialog open state
  isParentHovered?: boolean; // Parent item hover state
  disableInvite?: boolean; // Disable invite feature (personal workspace)
}

/**
 * WorkspaceContextMenu component
 *
 * Workspace header three-dot menu
 * - Filter menu items by permission
 * - Special handling for default workspace
 * - Restrict invites for personal workspace
 */
export function WorkspaceContextMenu({
  workspace,
  onOpenChange,
  isParentHovered = false,
  disableInvite = false,
}: WorkspaceContextMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Pass open state to parent
  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    onOpenChange?.(open || showSettings || showInvite || showArchive);
  };

  // Pass dialog open state to parent
  const handleSettingsChange = (open: boolean) => {
    setShowSettings(open);
    onOpenChange?.(open || isMenuOpen || showInvite || showArchive);
  };

  const handleInviteChange = (open: boolean) => {
    setShowInvite(open);
    onOpenChange?.(open || isMenuOpen || showSettings || showArchive);
  };

  const handleArchiveChange = (open: boolean) => {
    setShowArchive(open);
    onOpenChange?.(open || isMenuOpen || showSettings || showInvite);
  };

  return (
    <>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer',
              isMenuOpen || showSettings || showInvite || showArchive
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
                isMenuOpen || showSettings || showInvite || showArchive
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
