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
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
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

  // Get current user role
  const userRole = organizationMembers?.userRole || 'member';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  // Combine all rows
  const allRows: MemberRow[] = [
    // Current members
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
    // Pending invitations
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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

  // Role change success handler
  const handleRoleChangeSuccess = async () => {
    if (organizationMembers?.organizationId) {
      await refreshOrganizationMembers(organizationMembers.organizationId);
    }
  };

  return (
    <div>
      {allRows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No members.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
                            ? `Invited by ${row.inviterName}`
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
                      {row.type === 'pending' ? 'Pending' : 'Active'}
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

      {/* Role change confirmation dialog */}
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
