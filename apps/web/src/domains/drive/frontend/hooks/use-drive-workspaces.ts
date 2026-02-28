'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizationWorkspacePageViewAction } from '@/domains/workspace-management/actions/workspace-navigation.actions';

export interface DriveWorkspaceOption {
  workspaceId: string;
  name: string;
  icon?: string | null;
}

export function useDriveWorkspaces(orgId: string | undefined, enabled: boolean) {
  const query = useQuery({
    queryKey: ['drive', 'workspaces', orgId],
    queryFn: async () => {
      if (!orgId) return { workspaces: [] };
      const result = await getOrganizationWorkspacePageViewAction({
        organizationId: orgId,
      });
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to load workspaces');
      }
      return result.data;
    },
    enabled: Boolean(orgId) && enabled,
  });

  const workspaces: DriveWorkspaceOption[] =
    query.data?.workspaces?.map(w => ({
      workspaceId: w.workspaceId,
      name: w.workspaceName ?? w.name ?? 'Workspace',
      icon: w.icon ?? null,
    })) ?? [];

  return { ...query, workspaces };
}
