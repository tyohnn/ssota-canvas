/**
 * InviteMemberDialog Props
 */
export interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  showSkipButton?: boolean; // Whether to show skip button
}
