'use client';

import React from 'react';
import { User } from 'lucide-react';
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
import { cn } from '@workspace/ui/lib/utils';
import type {
  WorkspaceMemberDTO,
  WorkspaceInvitationPendingDTO,
} from '../../../shared/dtos';

const getRoleIcon = () => {
  return <User className="h-4 w-4" />;
};

const getRoleLabel = () => {
  return '멤버';
};

type MemberRow = {
  id: string;
  type: 'member' | 'pending';
  userId?: string;
  name: string;
  email: string;
  profileImageUrl?: string | null;
  dateLabel: string;
  inviterName?: string;
};

interface WorkspaceMemberListTableProps {
  currentMembers: WorkspaceMemberDTO[];
  pendingInvitations: WorkspaceInvitationPendingDTO[];
  isLoading?: boolean;
}

export function WorkspaceMemberListTable({
  currentMembers,
  pendingInvitations,
  isLoading = false,
}: WorkspaceMemberListTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // 통합 데이터 구성
  const allRows: MemberRow[] = [
    // 현재 멤버
    ...currentMembers.map(member => ({
      id: member.userId,
      type: 'member' as const,
      userId: member.userId,
      name: member.name,
      email: member.email,
      profileImageUrl: member.profileImageUrl,
      dateLabel: formatDate(member.joinedAt),
    })),
    // 대기 중인 초대
    ...pendingInvitations.map(invitation => ({
      id: invitation.id,
      type: 'pending' as const,
      name: invitation.invitedUserName,
      email: invitation.invitedUserEmail,
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
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 w-fit"
                    >
                      {getRoleIcon()}
                      <span>{getRoleLabel()}</span>
                    </Badge>
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
    </div>
  );
}
