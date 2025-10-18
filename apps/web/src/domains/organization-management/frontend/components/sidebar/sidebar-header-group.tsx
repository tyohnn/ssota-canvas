'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui/dialog';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { Home, Inbox, Search, Settings2 } from 'lucide-react';
import { useOrganization } from '../../contexts/organization-context';
import { InboxPanel } from '@/domains/notification-management/frontend/components/inbox-panel';
import { respondToInvitationAction } from '../../../actions/organization-management.actions';
import {
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
} from '@/domains/workspace-management/actions/workspace-management.actions';
import { toast } from '@workspace/ui/components/ui/sonner';
import { SettingsDialog } from '../member-management/settings-dialog';

export function SidebarHeaderGroup() {
  const { organizations, selectedOrganizationId, refreshOrganizations } =
    useOrganization();
  const activeOrganization = organizations.find(
    org => org.id === selectedOrganizationId
  );
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isInboxOpen, setIsInboxOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleInvitationRespond = async (
    invitationId: string,
    accept: boolean
  ) => {
    try {
      await respondToInvitationAction({ invitationId, accept });

      // 초대 승낙 시 조직 목록 새로고침
      if (accept) {
        await refreshOrganizations();
      }

      toast.success(accept ? '초대를 수락했습니다' : '초대를 거절했습니다', {
        description: accept
          ? '조직 멤버로 추가되었습니다.'
          : '초대가 거절되었습니다.',
      });
    } catch (error) {
      toast.error('초대 응답 실패', {
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
      });
    }
  };

  const handleWorkspaceInvitationRespond = async (
    invitationId: string,
    accept: boolean
  ) => {
    try {
      if (accept) {
        const result = await acceptWorkspaceInvitationAction({ invitationId });
        if (result.success) {
          toast.success('Workspace 초대를 수락했습니다', {
            description: 'Workspace 멤버로 추가되었습니다.',
          });
          // TODO: Workspace 목록 새로고침 또는 해당 Workspace로 이동
          window.location.reload(); // 임시: 전체 새로고침
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await rejectWorkspaceInvitationAction({ invitationId });
        if (result.success) {
          toast.success('Workspace 초대를 거절했습니다', {
            description: '초대가 거절되었습니다.',
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      toast.error('Workspace 초대 처리 중 오류가 발생했습니다', {
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
      });
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="text-muted-foreground"
            tooltip="Home"
          >
            <a href={`/r/${activeOrganization?.id}`}>
              <Home />
              <span>Home</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <SidebarMenuButton
                className="text-muted-foreground"
                tooltip="Search"
              >
                <Search />
                <span>Search</span>
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Search</DialogTitle>
                <DialogDescription>Type to search...</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-muted-foreground"
            tooltip="Inbox"
            onClick={() => setIsInboxOpen(true)}
          >
            <Inbox />
            <span>Inbox</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-muted-foreground"
            tooltip="Settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings2 />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <InboxPanel
        open={isInboxOpen}
        onOpenChange={setIsInboxOpen}
        onInvitationRespond={handleInvitationRespond}
        onWorkspaceInvitationRespond={handleWorkspaceInvitationRespond}
      />
      {activeOrganization && (
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          organizationId={activeOrganization.id}
        />
      )}
    </>
  );
}
