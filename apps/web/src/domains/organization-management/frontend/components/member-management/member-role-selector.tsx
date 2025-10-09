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
  // 클라이언트 측 권한 검증
  const canChange =
    currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role === 'member');

  // 소유자 역할은 변경 불가
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
        return '소유자';
      case 'admin':
        return '관리자';
      case 'member':
        return '멤버';
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

  // 옵션별 활성화 결정
  const adminOptionDisabled = member.role === 'admin'; // 현재 역할 (체크 표시)

  const memberOptionDisabled =
    member.role === 'member' || // 현재 역할 (체크 표시)
    (currentUserRole === 'admin' && member.role === 'admin'); // 관리자는 관리자를 다운그레이드 불가

  // 변경 불가능한 경우: 일반 배지만 표시
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

  // 변경 가능한 경우: 클릭 가능한 배지 + 드롭다운
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
              <span>관리자 (Admin)</span>
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
              <span>멤버 (Member)</span>
            </div>
            {member.role === 'member' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
