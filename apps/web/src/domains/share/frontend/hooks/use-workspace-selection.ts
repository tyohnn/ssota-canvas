'use client';

import { useQuery } from '@tanstack/react-query';
import { getWorkspaceSelectionAction } from '../../actions/share.actions';
import { WorkspaceSelectionViewDTO } from '../../shared/dtos';

export function useWorkspaceSelection() {
  return useQuery<WorkspaceSelectionViewDTO>({
    queryKey: ['workspace-selection'],
    queryFn: () => getWorkspaceSelectionAction(),
  });
}
