'use client';

import { Dialog } from '@/components/ui/dialog';
import { InvitationDetailDialogContent } from './components/dialog-content';
import { useInvitationDetailDialog } from './core/use-invitation-detail-dialog';
import type { InvitationDetailDialogProps } from './core/types';
import type { InvitationDetailBusinessLogic } from './core/use-invitation-detail-dialog.business';

/**
 * InvitationDetailDialog Component (v4.0.0)
 *
 * Modal for viewing and accepting/rejecting workspace invitations following Container/Presentational pattern:
 *
 * **Architecture:**
 * - Container pattern: Hook → Props (no local Context)
 * - Presentational components: Props only (Storybook testable)
 * - UI/Business logic separation
 * - TanStack Query for Optimistic Updates
 *
 * **Features:**
 * - Invitation information display
 * - Accept/Reject actions
 * - Toast feedback
 * - Status badges
 *
 * **Usage:**
 * ```tsx
 * // Production
 * <InvitationDetailDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   invitation={invitation}
 * />
 *
 * // With custom business logic (testing/mock)
 * const mockBusiness = useMockInvitationDetailBusiness();
 * <InvitationDetailDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   invitation={invitation}
 *   businessLogic={mockBusiness}
 * />
 * ```
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md
 */
export function InvitationDetailDialog({
  open,
  onOpenChange,
  invitation,
  businessLogic,
}: InvitationDetailDialogProps & {
  businessLogic?: InvitationDetailBusinessLogic;
}) {
  // Don't render if no invitation
  if (!invitation) {
    return null;
  }

  // Container: Hook으로 데이터 가져오기
  const dialogState = useInvitationDetailDialog(
    { open, onOpenChange, invitation },
    businessLogic
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <InvitationDetailDialogContent {...dialogState} />
    </Dialog>
  );
}
