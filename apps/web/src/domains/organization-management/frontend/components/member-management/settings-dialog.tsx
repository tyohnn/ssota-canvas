'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, UserCircle, Building2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Separator } from '@workspace/ui/components/ui/separator';
import { MemberListTable } from './member-list-table';
import { InviteMemberDialog } from './invite-member-dialog';
import { useMemberManagementContext } from '../../contexts/member-management-context';
import { useMemberManagement } from '../../hooks/use-member-management';
import { cn } from '@workspace/ui/lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

type SettingsTab = 'general' | 'members' | 'profile';

export function SettingsDialog({
  open,
  onOpenChange,
  organizationId,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('members');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { refreshOrganizationMembers } = useMemberManagementContext();
  const { canInviteMembers } = useMemberManagement();

  // Load member data when dialog opens
  useEffect(() => {
    if (open && organizationId) {
      refreshOrganizationMembers(organizationId);
    }
  }, [open, organizationId, refreshOrganizationMembers]);

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Building2 },
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'profile' as const, label: 'Profile', icon: UserCircle },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl! h-[85vh] p-0 gap-0 overflow-hidden rounded-md">
        <div className="flex h-full min-h-0">
          {/* Left Sidebar */}
          <div className="w-56 shrink-0 border-r border-border/30 bg-muted/30 p-4 flex flex-col">
            <DialogHeader className="mb-4 shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Settings
              </DialogTitle>
            </DialogHeader>
            <nav className="space-y-1 shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="h-full w-full">
              <div className="p-6 pb-8 min-h-full">
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                      Organization Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your organization's general settings.
                    </p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Coming soon...
                    </p>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">
                          Member Management
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Invite and manage organization members.
                        </p>
                      </div>
                      {canInviteMembers && (
                        <Button
                          onClick={() => setIsInviteDialogOpen(true)}
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite Member
                        </Button>
                      )}
                    </div>
                    <Separator />

                    {/* Member List */}
                    <MemberListTable />
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Profile Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your user profile.
                    </p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Coming soon...
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Member Invite Dialog */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        organizationId={organizationId}
        onSuccess={() => {
          refreshOrganizationMembers(organizationId);
        }}
      />
    </Dialog>
  );
}
