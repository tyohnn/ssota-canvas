'use client';

import { EmailSearchField } from './email-search-field';
import { SearchResultsList } from './search-results-list';
import { SelectedMembersList } from './selected-members-list';
import type { OrganizationMemberSearchResultDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * Invite Member Dialog Content (Presentational)
 *
 * Main content area for invite member dialog
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InviteMemberDialogContentProps {
  email: string;
  selectedMembers: OrganizationMemberSearchResultDTO[];
  searchResults: OrganizationMemberSearchResultDTO[];
  isSearching: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onMemberSelect: (member: OrganizationMemberSearchResultDTO) => void;
  onRemoveMember: (userId: string) => void;
}

export function InviteMemberDialogContent({
  email,
  selectedMembers,
  searchResults,
  isSearching,
  isSubmitting,
  isLoading,
  onEmailChange,
  onMemberSelect,
  onRemoveMember,
}: InviteMemberDialogContentProps) {
  return (
    <div className="space-y-4">
      {/* Email search field */}
      <div>
        <EmailSearchField
          email={email}
          onEmailChange={onEmailChange}
          disabled={isSubmitting || isLoading}
        />
        <SearchResultsList
          searchResults={searchResults}
          selectedMembers={selectedMembers}
          isSearching={isSearching}
          email={email}
          onMemberSelect={onMemberSelect}
        />
      </div>

      {/* Selected member list */}
      <SelectedMembersList
        selectedMembers={selectedMembers}
        onRemoveMember={onRemoveMember}
        disabled={isSubmitting || isLoading}
      />
    </div>
  );
}
