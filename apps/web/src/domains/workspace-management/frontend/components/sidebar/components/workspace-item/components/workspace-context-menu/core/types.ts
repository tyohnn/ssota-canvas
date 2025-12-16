import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * WorkspaceContextMenu Props
 */
export interface WorkspaceContextMenuProps {
  workspace: WorkspaceWithPagesDTO;
  onOpenChange?: (open: boolean) => void; // Pass menu/dialog open state
  isParentHovered?: boolean; // Parent item hover state
  disableInvite?: boolean; // Disable invite feature (personal workspace)
}
