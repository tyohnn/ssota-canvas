import type { InvitationSummaryDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * InvitationDetailDialog Props
 */
export interface InvitationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: InvitationSummaryDTO | null;
}

/**
 * Invitation action type
 */
export type InvitationAction = 'accept' | 'reject';

/**
 * Invitation status enum
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/**
 * Context value for InvitationDetailDialog
 */
export interface InvitationDetailDialogContextValue {
  // Props
  invitation: InvitationSummaryDTO | null;

  // UI State
  isProcessing: boolean;

  // Business State (from TanStack Query)
  isAccepting?: boolean;
  isRejecting?: boolean;

  // Computed state
  status: InvitationStatus; // Single status enum
  isLoading: boolean; // Combined loading state

  // Actions
  handleAccept: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleClose: () => void;
}
