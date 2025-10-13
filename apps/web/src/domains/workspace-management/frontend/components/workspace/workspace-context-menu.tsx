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
  onOpenChange?: (open: boolean) => void; // 메뉴/다이얼로그 열림 상태 전달
  isParentHovered?: boolean; // 부모 아이템 호버 상태
}

/**
 * WorkspaceContextMenu 컴포넌트
 *
 * Workspace 헤더 삼점 메뉴
 * - 권한별 메뉴 항목 필터링
 * - Default Workspace 특별 처리
 */
export function WorkspaceContextMenu({
  workspace,
  onOpenChange,
  isParentHovered = false,
}: WorkspaceContextMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 부모에 열림 상태 전달
  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    onOpenChange?.(open || showSettings || showInvite || showArchive);
  };

  // 다이얼로그 열림 상태 변경 시 부모에 전달
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

  // TODO: 권한 체크 로직 (조직 Admin + Workspace 멤버)
  const canInviteMembers = true; // 임시로 true

  return (
    <>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent cursor-pointer',
              isMenuOpen || showSettings || showInvite || showArchive
                ? 'opacity-100'
                : isParentHovered
                  ? 'opacity-100'
                  : 'opacity-0'
            )}
            role="button"
            aria-label="워크스페이스 메뉴"
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
            워크스페이스 설정
          </DropdownMenuItem>

          {canInviteMembers && (
            <DropdownMenuItem onClick={() => handleInviteChange(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              멤버 초대
            </DropdownMenuItem>
          )}

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
        onOpenChange={handleSettingsChange}
      />

      {/* InviteMemberDialog (Scenario 3) */}
      <InviteMemberDialog
        workspaceId={workspace.workspaceId}
        workspaceName={workspace.name}
        open={showInvite}
        onOpenChange={handleInviteChange}
      />

      {/* TODO: ArchiveWorkspaceDialog */}
    </>
  );
}
