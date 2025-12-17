'use client';

import { useState } from 'react';
import type { OrganizationMemberSearchResultDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * UI State Hook for InviteMemberDialog (Domain Level)
 *
 * Manages local UI state:
 * - Email search input
 * - Selected members list
 * - Search results
 * - Loading states (searching, submitting)
 *
 * Can be used independently in Storybook
 */
export function useInviteMemberDialogUI() {
  const [email, setEmail] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return {
    email,
    setEmail,
    selectedMembers,
    setSelectedMembers,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    setIsLoading,
  };
}

export type InviteMemberDialogUIState = ReturnType<
  typeof useInviteMemberDialogUI
>;
