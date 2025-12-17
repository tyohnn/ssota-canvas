import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * WorkspaceSettingsDialog Props
 */
export interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithPagesDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disableInvite?: boolean; // Hide Members tab for personal workspace
}

/**
 * Settings tab type
 */
export type SettingsTab = 'general' | 'members';

/**
 * Tab definition
 */
export interface Tab {
  id: SettingsTab;
  label: string;
  icon: any; // Lucide icon component
}
