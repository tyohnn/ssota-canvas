'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
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
import type { MemberRow } from '../core/types';

const getRoleIcon = () => {
  return <User className="h-4 w-4" />;
};

const getRoleLabel = () => {
  return 'Member';
};

/**
 * Workspace Member List Table (Presentational)
 *
 * Pure presentational component for rendering member/invitation list
 *
 * Follows v4.0.0 guidelines:
 * - Props only (no Context, no Hooks, no business logic)
 * - Receives transformed data (MemberRow[])
 * - Storybook testable
 */
interface WorkspaceMemberListTableProps {
  memberRows: MemberRow[];
  isLoading?: boolean;
}

export function WorkspaceMemberListTable({
  memberRows,
  isLoading = false,
}: WorkspaceMemberListTableProps) {
  if (isLoading) {
    return (
      <Box className="rounded-md border">
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
      </Box>
    );
  }

  return (
    <Box>
      {memberRows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No members.</p>
      ) : (
        <Box className="rounded-md border">
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
              {memberRows.map(row => (
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
        </Box>
      )}
    </Box>
  );
}
