'use client';

import React from 'react';
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
import { MemberRoleSelector } from './member-role-selector';
import { getRoleIcon, getRoleLabel, type MemberRow } from './member-list.types';
import { cn } from '@workspace/ui/lib/utils';

export interface MemberListTableProps {
  rows: MemberRow[];
  userRole: 'owner' | 'admin' | 'member';
  onRoleSelect: (
    member: {
      userId: string;
      name: string;
      email: string;
      profileImageUrl?: string;
      role: 'owner' | 'admin' | 'member';
      joinedAt: string;
    },
    newRole: 'admin' | 'member',
    currentUserRole: 'owner' | 'admin' | 'member'
  ) => void;
}

export function MemberListTable({
  rows,
  userRole,
  onRoleSelect,
}: MemberListTableProps) {
  return (
    <div className="w-full min-w-0">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No members.</p>
      ) : (
        <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]">
          <div className="w-full min-w-[600px] rounded-md border">
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
                {rows.map(row => (
                  <TableRow
                    key={row.id}
                    className={cn(row.type === 'pending' && 'bg-muted/30')}
                  >
                    <TableCell className="min-w-0 whitespace-normal">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          className={cn(
                            'h-9 w-9 shrink-0',
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
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              row.type === 'pending' && 'text-muted-foreground'
                            )}
                          >
                            {row.name}
                          </span>
                          <span className="text-xs text-muted-foreground break-all">
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
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.type === 'pending' ? 'secondary' : 'default'
                        }
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
        </div>
      )}
    </div>
  );
}

export function MemberListTableSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]">
        <div className="w-full min-w-[600px] rounded-md border">
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
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
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
      </div>
    </div>
  );
}
