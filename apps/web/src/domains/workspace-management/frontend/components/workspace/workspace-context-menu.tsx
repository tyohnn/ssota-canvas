'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Settings, UserPlus, Trash2 } from 'lucide-react';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';
import { WorkspaceSettingsDialog } from './workspace-settings-dialog';
import { useWorkspace } from '../../hooks/use-workspace';

interface WorkspaceContextMenuProps {
  workspace: WorkspaceWithPagesDTO;
}

/**
 * WorkspaceContextMenu 컴포넌트
 *
 * Workspace 헤더 삼점 메뉴
 * - 권한별 메뉴 항목 필터링
 * - Default Workspace 특별 처리
 */
export function WorkspaceContextMenu({ workspace }: WorkspaceContextMenuProps) {
  const { canInviteMembers } = useWorkspace();
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">워크스페이스 메뉴</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            워크스페이스 설정
          </DropdownMenuItem>

          {canInviteMembers(workspace.workspaceId) && (
            <DropdownMenuItem onClick={() => setShowInvite(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              멤버 추가
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem
                    onClick={() => setShowArchive(true)}
                    disabled={workspace.isDefault}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    워크스페이스 보관
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {workspace.isDefault && (
                <TooltipContent>
                  <p>기본 워크스페이스는 삭제할 수 없습니다</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* WorkspaceSettingsDialog */}
      <WorkspaceSettingsDialog
        workspace={workspace}
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {/* TODO: InviteMemberDialog */}
      {/* TODO: ArchiveWorkspaceDialog */}
    </>
  );
}
