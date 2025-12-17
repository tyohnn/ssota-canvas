'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { OrganizationMemberSearchResultDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * Search Results List (Presentational)
 *
 * Displays search results for organization members
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface SearchResultsListProps {
  searchResults: OrganizationMemberSearchResultDTO[];
  selectedMembers: OrganizationMemberSearchResultDTO[];
  isSearching: boolean;
  email: string;
  onMemberSelect: (member: OrganizationMemberSearchResultDTO) => void;
}

export function SearchResultsList({
  searchResults,
  selectedMembers,
  isSearching,
  email,
  onMemberSelect,
}: SearchResultsListProps) {
  // Show search results
  if (searchResults.length > 0) {
    return (
      <Card className="mt-2 p-2 max-h-[200px] overflow-y-auto">
        <div className="space-y-1">
          {searchResults.map(member => {
            const isAlreadySelected = selectedMembers.some(
              m => m.userId === member.userId
            );
            const isDisabled =
              member.isAlreadyMember ||
              member.hasPendingInvitation ||
              isAlreadySelected;

            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => !isDisabled && onMemberSelect(member)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                  isDisabled && 'opacity-50 cursor-not-allowed bg-muted'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatarUrl || undefined} />
                  <AvatarFallback>
                    {member.name?.[0]?.toUpperCase() ||
                      member.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {member.name || member.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                {member.isAlreadyMember && (
                  <Badge variant="secondary" className="text-xs">
                    Member
                  </Badge>
                )}
                {member.hasPendingInvitation && (
                  <Badge variant="outline" className="text-xs">
                    Invited
                  </Badge>
                )}
                {isAlreadySelected && (
                  <Badge variant="outline" className="text-xs">
                    Selected
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  // Show searching state
  if (isSearching) {
    return <p className="text-sm text-muted-foreground mt-2">Searching...</p>;
  }

  // Show no results message
  if (email.length >= 3 && searchResults.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground mt-2">
        <Mail className="h-4 w-4 mr-2" />
        <p>No members found matching "{email}"</p>
      </div>
    );
  }

  return null;
}
