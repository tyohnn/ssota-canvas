'use client';

import React from 'react';
import { Crown, Shield, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/ui/table';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';
import { Badge } from '@workspace/ui/components/ui/badge';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useMemberManagement } from '../../hooks/use-member-management';
import { useRoleChange } from '../../hooks/use-role-change';
import { MemberRoleSelector } from './member-role-selector';
import { RoleChangeConfirmationDialog } from './role-change-confirmation-dialog';
import { cn } from '@workspace/ui/lib/utils';

const getRoleIcon = (role: 'owner' | 'admin' | 'member') => {
  switch (role) {
    case 'owner':
      return <Crown className="h-4 w-4" />;
    case 'admin':
      return <Shield className="h-4 w-4" />;
    case 'member':
      return <User className="h-4 w-4" />;
  }
};

const getRoleLabel = (role: 'owner' | 'admin' | 'member') => {
  switch (role) {
    case 'owner':
      return '소유자';
    case 'admin':
      return '관리자';
    case 'member':
      return '멤버';
  }
};

type MemberRow = {
  id: string;
  type: 'member' | 'pending';
  userId?: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role: 'owner' | 'admin' | 'member';
  dateLabel: string;
  inviterName?: string;
};

export function MemberListTable() {
  const {
    getCurrentMembers,
    getPendingInvitations,
    isLoading,
    organizationMembers,
    refreshOrganizationMembers,
  } = useMemberManagement();

  const {
    selectRoleOption,
    confirmRoleChange,
    cancelRoleChange,
    confirmationDialog,
    isChanging,
  } = useRoleChange();

  // 현재 사용자 역할 가져오기
  const userRole = organizationMembers?.userRole || 'member';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // 통합 데이터 구성
  const allRows: MemberRow[] = [
    // 현재 멤버
    ...getCurrentMembers.map(member => ({
      id: member.userId,
      type: 'member' as const,
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImageUrl: member.profileImageUrl,
      role: member.role,
      dateLabel: formatDate(member.joinedAt),
    })),
    // 대기 중인 초대
    ...getPendingInvitations.map(invitation => ({
      id: invitation.id,
      type: 'pending' as const,
      name: invitation.inviteeEmail,
      email: invitation.inviteeEmail,
      role: invitation.role,
      dateLabel: formatDate(invitation.createdAt),
      inviterName: invitation.inviterName,
    })),
  ];

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>날짜</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map(i => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 역할 변경 성공 핸들러
  const handleRoleChangeSuccess = async () => {
    if (organizationMembers?.organizationId) {
      await refreshOrganizationMembers(organizationMembers.organizationId);
    }
  };

  return (
    <div>
      {allRows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">멤버가 없습니다.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>날짜</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map(row => (
                <TableRow
                  key={row.id}
                  className={cn(row.type === 'pending' && 'bg-muted/30')}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={cn(
                          'h-9 w-9',
                          row.type === 'pending' && 'opacity-60'
                        )}
                      >
                        {row.profileImageUrl && (
                          <AvatarImage
                            src={row.profileImageUrl}
                            alt={row.name}
                          />
                        )}
                        <AvatarFallback>
                          {row.name[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            row.type === 'pending' && 'text-muted-foreground'
                          )}
                        >
                          {row.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {row.type === 'pending' && row.inviterName
                            ? `${row.inviterName}님이 초대`
                            : row.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.type === 'member' && row.userId ? (
                      <MemberRoleSelector
                        member={{
                          userId: row.userId,
                          name: row.name,
                          email: row.email,
                          profileImageUrl: row.profileImageUrl,
                          role: row.role,
                          joinedAt: '', // Not needed for role selector
                        }}
                        currentUserRole={userRole}
                        onRoleSelect={newRole =>
                          selectRoleOption(
                            {
                              userId: row.userId!,
                              name: row.name,
                              email: row.email,
                              profileImageUrl: row.profileImageUrl,
                              role: row.role,
                              joinedAt: '',
                            },
                            newRole,
                            userRole
                          )
                        }
                      />
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit opacity-60"
                      >
                        {getRoleIcon(row.role)}
                        <span>{getRoleLabel(row.role)}</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.type === 'pending' ? 'secondary' : 'default'}
                      className="w-fit"
                    >
                      {row.type === 'pending' ? '대기 중' : '활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.dateLabel}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 역할 변경 확인 다이얼로그 */}
      <RoleChangeConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        memberInfo={confirmationDialog.memberInfo}
        onConfirm={async () => {
          if (
            organizationMembers?.organizationId &&
            confirmationDialog.memberInfo
          ) {
            // memberInfo에서 userId를 찾아야 합니다
            const targetMember = getCurrentMembers.find(
              m => m.email === confirmationDialog.memberInfo?.memberEmail
            );
            if (targetMember) {
              await confirmRoleChange(
                organizationMembers.organizationId,
                targetMember.userId,
                handleRoleChangeSuccess
              );
            }
          }
        }}
        onCancel={cancelRoleChange}
        isLoading={isChanging}
      />
    </div>
  );
}
