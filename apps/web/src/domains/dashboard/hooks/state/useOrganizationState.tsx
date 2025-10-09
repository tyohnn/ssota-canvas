'use client';

import * as React from 'react';

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  organization_id: string | null;
  icon_name?: string | null;
};

export type OrganizationState = {
  activeOrganization: OrgSummary | null;
  activeWorkspace: WorkspaceSummary | null;
  userOrganizations: OrgSummary[];
  orgWorkspaces: WorkspaceSummary[];
};

export type OrganizationAction =
  | { type: 'SET_ACTIVE_ORGANIZATION'; payload: OrgSummary | null }
  | { type: 'SET_ACTIVE_WORKSPACE'; payload: WorkspaceSummary | null }
  | { type: 'SET_USER_ORGANIZATIONS'; payload: OrgSummary[] }
  | { type: 'SET_ORG_WORKSPACES'; payload: WorkspaceSummary[] };

const initialState: OrganizationState = {
  activeOrganization: null,
  activeWorkspace: null,
  userOrganizations: [],
  orgWorkspaces: [],
};

/**
 * Update organization-related state by applying the provided action.
 *
 * Applies the action's payload to the corresponding field of the organization state:
 * - 'SET_ACTIVE_ORGANIZATION' updates `activeOrganization`
 * - 'SET_ACTIVE_WORKSPACE' updates `activeWorkspace`
 * - 'SET_USER_ORGANIZATIONS' updates `userOrganizations`
 * - 'SET_ORG_WORKSPACES' updates `orgWorkspaces`
 *
 * @param state - The current organization state
 * @param action - The action describing which state slice to update and its payload
 * @returns The new OrganizationState with the action's payload applied to the appropriate field
 */
function organizationReducer(
  state: OrganizationState,
  action: OrganizationAction
): OrganizationState {
  switch (action.type) {
    case 'SET_ACTIVE_ORGANIZATION': {
      return {
        ...state,
        activeOrganization: action.payload,
      };
    }
    case 'SET_ACTIVE_WORKSPACE': {
      return { ...state, activeWorkspace: action.payload };
    }
    case 'SET_USER_ORGANIZATIONS': {
      return { ...state, userOrganizations: action.payload };
    }
    case 'SET_ORG_WORKSPACES': {
      return { ...state, orgWorkspaces: action.payload };
    }
    default:
      return state;
  }
}

/**
 * Manages organization and workspace state with setters for each piece of the state.
 *
 * @param preloaded - Partial initial state to merge with the default initial organization state
 * @returns An object containing:
 *  - `state`: the current OrganizationState,
 *  - `setActiveOrganization`: sets the active organization or `null`,
 *  - `setActiveWorkspace`: sets the active workspace or `null`,
 *  - `setUserOrganizations`: replaces the user's organization list,
 *  - `setOrgWorkspaces`: replaces the organization's workspace list
 */
export function useOrganizationState(preloaded?: Partial<OrganizationState>): {
  state: OrganizationState;
  setActiveOrganization: (org: OrgSummary | null) => void;
  setActiveWorkspace: (ws: WorkspaceSummary | null) => void;
  setUserOrganizations: (orgs: OrgSummary[]) => void;
  setOrgWorkspaces: (ws: WorkspaceSummary[]) => void;
} {
  const [state, dispatch] = React.useReducer(organizationReducer, {
    ...initialState,
    ...preloaded,
  });

  const setActiveOrganization = React.useCallback((org: OrgSummary | null) => {
    dispatch({ type: 'SET_ACTIVE_ORGANIZATION', payload: org });
  }, []);

  const setActiveWorkspace = React.useCallback(
    (ws: WorkspaceSummary | null) => {
      dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: ws });
    },
    []
  );

  const setUserOrganizations = React.useCallback((orgs: OrgSummary[]) => {
    dispatch({ type: 'SET_USER_ORGANIZATIONS', payload: orgs });
  }, []);

  const setOrgWorkspaces = React.useCallback((ws: WorkspaceSummary[]) => {
    dispatch({ type: 'SET_ORG_WORKSPACES', payload: ws });
  }, []);

  return {
    state,
    setActiveOrganization,
    setActiveWorkspace,
    setUserOrganizations,
    setOrgWorkspaces,
  };
}