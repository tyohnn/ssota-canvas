"use client";

import * as React from "react";
import {
  OrgSummary,
  WorkspaceSummary,
  useOrganizationState,
} from "@/domains/dashboard/hooks/state/useOrganizationState";

type OrganizationContextValue = {
  activeOrganization: OrgSummary | null;
  activeWorkspace: WorkspaceSummary | null;
  userOrganizations: OrgSummary[];
  orgWorkspaces: WorkspaceSummary[];
  setActiveOrganization: (org: OrgSummary | null) => void;
  setActiveWorkspace: (ws: WorkspaceSummary | null) => void;
};

const OrganizationContext =
  React.createContext<OrganizationContextValue | null>(null);

export function useOrganizationContext(): OrganizationContextValue {
  const ctx = React.useContext(OrganizationContext);
  if (!ctx) {
    throw new Error(
      "useOrganizationContext must be used within OrganizationProvider"
    );
  }
  return ctx;
}

export function OrganizationProvider({
  children,
  initialOrg,
  initialUserOrganizations,
  initialWorkspace,
  initialOrgWorkspaces,
}: {
  children: React.ReactNode;
  initialOrg?: OrgSummary | null;
  initialUserOrganizations?: OrgSummary[];
  initialWorkspace?: WorkspaceSummary | null;
  initialOrgWorkspaces?: WorkspaceSummary[];
}) {
  const {
    state,
    setActiveOrganization,
    setActiveWorkspace,
    setUserOrganizations,
    setOrgWorkspaces,
  } = useOrganizationState({
    activeOrganization: initialOrg ?? null,
    activeWorkspace: initialWorkspace ?? null,
    userOrganizations: initialUserOrganizations ?? [],
    orgWorkspaces: initialOrgWorkspaces ?? [],
  });

  const value = React.useMemo<OrganizationContextValue>(
    () => ({
      activeOrganization: state.activeOrganization,
      activeWorkspace: state.activeWorkspace,
      userOrganizations: state.userOrganizations,
      orgWorkspaces: state.orgWorkspaces,
      setActiveOrganization,
      setActiveWorkspace,
      setUserOrganizations,
      setOrgWorkspaces,
    }),
    [
      state.activeOrganization,
      state.activeWorkspace,
      state.userOrganizations,
      state.orgWorkspaces,
      setActiveOrganization,
      setActiveWorkspace,
      setUserOrganizations,
      setOrgWorkspaces,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
