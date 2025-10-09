'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { OrganizationMemberView, UserProfile } from '../../shared/dtos';
import {
  getOrganizationMembersAction,
  searchUserByEmailAction,
} from '../../actions/organization-management.actions';

interface MemberManagementContextType {
  organizationMembers: OrganizationMemberView | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganizationMembers: (organizationId: string) => Promise<void>;
  searchUserByEmail: (email: string) => Promise<UserProfile[]>;
}

const MemberManagementContext = createContext<
  MemberManagementContextType | undefined
>(undefined);

export function MemberManagementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizationMembers, setOrganizationMembers] =
    useState<OrganizationMemberView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganizationMembers = useCallback(
    async (organizationId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getOrganizationMembersAction(organizationId);
        setOrganizationMembers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load organization members'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchUserByEmail = useCallback(
    async (email: string): Promise<UserProfile[]> => {
      try {
        const data = await searchUserByEmailAction(email);
        return data;
      } catch (err) {
        console.error('Failed to search user:', err);
        return [];
      }
    },
    []
  );

  return (
    <MemberManagementContext.Provider
      value={{
        organizationMembers,
        isLoading,
        error,
        refreshOrganizationMembers,
        searchUserByEmail,
      }}
    >
      {children}
    </MemberManagementContext.Provider>
  );
}

export function useMemberManagementContext() {
  const context = useContext(MemberManagementContext);
  if (!context) {
    throw new Error(
      'useMemberManagementContext must be used within MemberManagementProvider'
    );
  }
  return context;
}
