'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/ui/sidebar';
import { FolderOpen, Home, Settings2 } from 'lucide-react';
import { useOrganization } from '../../contexts/organization-context';
import { InboxButton } from '@/domains/notification-management/frontend/components/inbox-button';
import { InboxPanel } from '@/domains/notification-management/frontend/components/inbox-panel';
import { respondToInvitationAction } from '../../../actions/organization-management.actions';
import {
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
} from '@/domains/workspace-management/actions/workspace-member.actions';
import { toast } from '@workspace/ui/components/ui/sonner';
import { SettingsDialog } from '../member-management/settings-dialog';

export function SidebarHeaderGroup() {
  const pathname = usePathname();
  const { organizations, selectedOrganizationId, refreshOrganizations } =
    useOrganization();
  const activeOrganization = organizations.find(
    org => org.id === selectedOrganizationId
  );
  const orgId = activeOrganization?.id;
  const isHomeActive =
    orgId &&
    (pathname === `/r/${orgId}` || pathname === `/r/${orgId}/`);
  const isDriveActive =
    orgId && pathname?.startsWith(`/r/${orgId}/drive`);
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

      toast.success(accept ? 'Accepted invitation' : 'Rejected invitation', {
        description: accept
          ? 'You are now a member of the organization.'
          : 'Invitation rejected.',
      });
    } catch (error) {
      toast.error('Invitation response failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.',
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
          toast.success('Accepted workspace invitation', {
            description: 'You are now a member of the workspace.',
          });
          // TODO: Workspace 목록 새로고침 또는 해당 Workspace로 이동
          window.location.reload(); // 임시: 전체 새로고침
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await rejectWorkspaceInvitationAction({ invitationId });
        if (result.success) {
          toast.success('Rejected workspace invitation', {
            description: 'Invitation rejected.',
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      toast.error('Error processing workspace invitation', {
        description:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.',
      });
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            asChild
            isActive={!!isHomeActive}
            className="text-sidebar-foreground"
            tooltip="Home"
          >
            <a href={activeOrganization?.id ? `/r/${activeOrganization.id}` : '/r'}>
              <Home />
              <span>Home</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            asChild
            isActive={!!isDriveActive}
            className="text-sidebar-foreground"
            tooltip="Drive"
          >
            <Link
              href={
                activeOrganization?.id
                  ? `/r/${activeOrganization.id}/drive`
                  : '/r'
              }
            >
              <FolderOpen />
              <span>Drive</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <InboxButton onClick={() => setIsInboxOpen(true)} />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            className="text-sidebar-foreground"
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
