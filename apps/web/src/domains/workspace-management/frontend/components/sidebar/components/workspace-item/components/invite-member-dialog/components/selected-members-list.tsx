'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import type { OrganizationMemberSearchResultDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * Selected Members List (Presentational)
 *
 * Displays selected members as badges with remove functionality
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface SelectedMembersListProps {
  selectedMembers: OrganizationMemberSearchResultDTO[];
  onRemoveMember: (userId: string) => void;
  disabled?: boolean;
}

export function SelectedMembersList({
  selectedMembers,
  onRemoveMember,
  disabled = false,
}: SelectedMembersListProps) {
  if (selectedMembers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Members to invite ({selectedMembers.length})</Label>
      <div className="flex flex-wrap gap-2 p-3 border border-border/30 rounded-md bg-muted/30">
        {selectedMembers.map(member => (
          <Badge
            key={member.userId}
            variant="secondary"
            className="flex items-center gap-1 py-1.5 pr-1"
          >
            <Avatar className="h-4 w-4 mr-1">
              <AvatarImage src={member.avatarUrl || undefined} />
              <AvatarFallback className="text-[8px]">
                {member.name?.[0]?.toUpperCase() ||
                  member.email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{member.name || member.email}</span>
            <button
              type="button"
              onClick={() => onRemoveMember(member.userId)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
