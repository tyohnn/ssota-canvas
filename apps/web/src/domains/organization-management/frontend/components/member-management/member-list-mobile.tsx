'use client';

import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';
import { Badge } from '@workspace/ui/components/ui/badge';
import { Box } from '@workspace/ui/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { MemberRoleSelector } from './member-role-selector';
import { getRoleIcon, getRoleLabel, type MemberRow } from './member-list.types';
import { cn } from '@workspace/ui/lib/utils';

export function MemberListMobileSkeleton() {
  return (
    <Box className="space-y-3">
      {[1, 2, 3].map(i => (
        <Box key={i} className="rounded-lg border bg-card p-4">
          <Box className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Box className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </Box>
          </Box>
          <Box className="mt-3 flex items-center gap-2 border-t pt-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export interface MemberListMobileProps {
  rows: MemberRow[];
  userRole: 'owner' | 'admin' | 'member';
  onRoleSelect: (
    member: { userId: string; name: string; email: string; profileImageUrl?: string; role: 'owner' | 'admin' | 'member'; joinedAt: string },
    newRole: 'admin' | 'member',
    currentUserRole: 'owner' | 'admin' | 'member'
  ) => void;
}

export function MemberListMobile({
  rows,
  userRole,
  onRoleSelect,
}: MemberListMobileProps) {
  return (
    <Box className="space-y-3">
      {rows.map(row => (
        <Box
          key={row.id}
          className={cn(
            'rounded-lg border bg-card p-4',
            row.type === 'pending' && 'bg-muted/30'
          )}
        >
          <Box className="flex items-start gap-3">
            <Avatar
              className={cn(
                'h-10 w-10 shrink-0',
                row.type === 'pending' && 'opacity-60'
              )}
            >
              {row.profileImageUrl && (
                <AvatarImage src={row.profileImageUrl} alt={row.name} />
              )}
              <AvatarFallback>
                {row.name[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <Box className="min-w-0 flex-1 space-y-1">
              <p
                className={cn(
                  'text-sm font-medium truncate',
                  row.type === 'pending' && 'text-muted-foreground'
                )}
              >
                {row.name}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {row.type === 'pending' && row.inviterName
                  ? `Invited by ${row.inviterName}`
                  : row.email}
              </p>
            </Box>
          </Box>
          <Box className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <Box className="flex flex-wrap items-center gap-2">
              {row.type === 'member' && row.userId ? (
                <MemberRoleSelector
                  member={{
                    userId: row.userId,
                    name: row.name,
                    email: row.email,
                    profileImageUrl: row.profileImageUrl,
                    role: row.role,
                    joinedAt: '',
                  }}
                  currentUserRole={userRole}
                  onRoleSelect={newRole =>
                    onRoleSelect(
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
              <Badge
                variant={row.type === 'pending' ? 'secondary' : 'default'}
                className="w-fit"
              >
                {row.type === 'pending' ? 'Pending' : 'Active'}
              </Badge>
            </Box>
            <span className="text-xs text-muted-foreground shrink-0">
              {row.dateLabel}
            </span>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
