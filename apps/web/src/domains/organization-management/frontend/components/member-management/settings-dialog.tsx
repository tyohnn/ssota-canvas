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

  // Dialog가 열릴 때 멤버 데이터 로드
  useEffect(() => {
    if (open && organizationId) {
      refreshOrganizationMembers(organizationId);
    }
  }, [open, organizationId, refreshOrganizationMembers]);

  const tabs = [
    { id: 'general' as const, label: '기본', icon: Building2 },
    { id: 'members' as const, label: '멤버', icon: Users },
    { id: 'profile' as const, label: '프로필', icon: UserCircle },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl !h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full min-h-0">
          {/* 좌측 사이드바 */}
          <div className="w-56 flex-shrink-0 border-r bg-muted/30 p-4 flex flex-col">
            <DialogHeader className="mb-4 flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                설정
              </DialogTitle>
            </DialogHeader>
            <nav className="space-y-1 flex-shrink-0">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    activeTab === tab.id && 'bg-background shadow-sm'
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* 우측 콘텐츠 영역 */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="h-full w-full">
              <div className="p-6 pb-8 min-h-full">
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">조직 설정</h2>
                    <p className="text-sm text-muted-foreground">
                      조직의 기본 설정을 관리합니다.
                    </p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">준비 중...</p>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">멤버 관리</h2>
                        <p className="text-sm text-muted-foreground">
                          조직 멤버를 초대하고 관리합니다.
                        </p>
                      </div>
                      {canInviteMembers && (
                        <Button
                          onClick={() => setIsInviteDialogOpen(true)}
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          멤버 초대
                        </Button>
                      )}
                    </div>
                    <Separator />

                    {/* 멤버 목록 */}
                    <MemberListTable />
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">프로필 설정</h2>
                    <p className="text-sm text-muted-foreground">
                      사용자 프로필을 관리합니다.
                    </p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">준비 중...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* 멤버 초대 다이얼로그 */}
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
