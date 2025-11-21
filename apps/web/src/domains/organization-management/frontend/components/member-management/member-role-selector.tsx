// apps/web/src/domains/organization-management/frontend/components/member-management/member-role-selector.tsx

'use client';

import { Check, ChevronDown, Crown, Shield, User } from 'lucide-react';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberSummary } from '../../../shared/dtos';

interface MemberRoleSelectorProps {
  member: MemberSummary;
  currentUserRole: 'owner' | 'admin' | 'member';
  onRoleSelect: (newRole: 'admin' | 'member') => void;
}

export function MemberRoleSelector({
  member,
  currentUserRole,
  onRoleSelect,
}: MemberRoleSelectorProps) {
  // Client-side permission validation
  const canChange =
    currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role === 'member');

  // Owner role cannot be changed
  const isOwner = member.role === 'owner';

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

  const getRoleBadgeVariant = (role: 'owner' | 'admin' | 'member') => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      case 'member':
        return 'outline' as const;
    }
  };

  // Determine enabled options
  const adminOptionDisabled = member.role === 'admin'; // Current role (check mark)

  const memberOptionDisabled =
    member.role === 'member' || // Current role (check mark)
    (currentUserRole === 'admin' && member.role === 'admin'); // Admin cannot downgrade admin

  // If not changeable: show badge only
  if (!canChange || isOwner) {
    return (
      <Badge
        variant={getRoleBadgeVariant(member.role)}
        className="flex items-center gap-1 w-fit"
      >
        {getRoleIcon(member.role)}
        <span>{getRoleLabel(member.role)}</span>
      </Badge>
    );
  }

  // If changeable: clickable badge + dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant={getRoleBadgeVariant(member.role)}
          className="flex items-center gap-1 w-fit cursor-pointer hover:opacity-80 transition-opacity"
        >
          {getRoleIcon(member.role)}
          <span>{getRoleLabel(member.role)}</span>
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={adminOptionDisabled}
          onClick={() => {
            if (!adminOptionDisabled) {
              onRoleSelect('admin');
            }
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </div>
            {member.role === 'admin' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={memberOptionDisabled}
          onClick={() => {
            if (!memberOptionDisabled) {
              onRoleSelect('member');
            }
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Member</span>
            </div>
            {member.role === 'member' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
