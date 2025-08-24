"use client";

import * as React from "react";

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
  | { type: "SET_ACTIVE_ORGANIZATION"; payload: OrgSummary | null }
  | { type: "SET_ACTIVE_WORKSPACE"; payload: WorkspaceSummary | null }
  | { type: "SET_USER_ORGANIZATIONS"; payload: OrgSummary[] }
  | { type: "SET_ORG_WORKSPACES"; payload: WorkspaceSummary[] };

const initialState: OrganizationState = {
  activeOrganization: null,
  activeWorkspace: null,
  userOrganizations: [],
  orgWorkspaces: [],
};

function organizationReducer(
  state: OrganizationState,
  action: OrganizationAction
): OrganizationState {
  switch (action.type) {
    case "SET_ACTIVE_ORGANIZATION": {
      return {
        ...state,
        activeOrganization: action.payload,
      };
    }
    case "SET_ACTIVE_WORKSPACE": {
      return { ...state, activeWorkspace: action.payload };
    }
    case "SET_USER_ORGANIZATIONS": {
      return { ...state, userOrganizations: action.payload };
    }
    case "SET_ORG_WORKSPACES": {
      return { ...state, orgWorkspaces: action.payload };
    }
    default:
      return state;
  }
}

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
    dispatch({ type: "SET_ACTIVE_ORGANIZATION", payload: org });
  }, []);

  const setActiveWorkspace = React.useCallback(
    (ws: WorkspaceSummary | null) => {
      dispatch({ type: "SET_ACTIVE_WORKSPACE", payload: ws });
    },
    []
  );

  const setUserOrganizations = React.useCallback((orgs: OrgSummary[]) => {
    dispatch({ type: "SET_USER_ORGANIZATIONS", payload: orgs });
  }, []);

  const setOrgWorkspaces = React.useCallback((ws: WorkspaceSummary[]) => {
    dispatch({ type: "SET_ORG_WORKSPACES", payload: ws });
  }, []);

  return {
    state,
    setActiveOrganization,
    setActiveWorkspace,
    setUserOrganizations,
    setOrgWorkspaces,
  };
}
