'use client';

import { Dialog } from '@/components/ui/dialog';
import { CreateWorkspaceDialogContent } from './components/dialog-content';
import { InviteDialogWrapper } from './components/invite-dialog-wrapper';
import { useCreateWorkspaceDialog } from './core/use-create-workspace-dialog';
import type { CreateWorkspaceDialogProps } from './core/types';
import type { CreateWorkspaceBusinessLogic } from './core/use-create-workspace-dialog.business';

/**
 * CreateWorkspaceDialog Component (v4.0.0)
 *
 * Modal for creating a new Workspace following Container/Presentational pattern:
 *
 * **Architecture:**
 * - Container pattern: Hook → Props (no local Context)
 * - Presentational components: Props only (Storybook testable)
 * - UI/Business logic separation
 * - TanStack Query for Optimistic Updates
 *
 * **Features:**
 * - react-hook-form + zod validation
 * - IconPicker integration
 * - Toast feedback
 * - Auto-opens invite dialog after creation
 *
 * **Usage:**
 * ```tsx
 * // Production
 * <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
 *
 * // With custom business logic (testing/mock)
 * const mockBusiness = useMockCreateWorkspaceBusiness();
 * <CreateWorkspaceDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   businessLogic={mockBusiness}
 * />
 * ```
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md
 */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  businessLogic,
}: CreateWorkspaceDialogProps & {
  businessLogic?: CreateWorkspaceBusinessLogic;
}) {
  // Container: Hook으로 데이터 가져오기
  const dialogState = useCreateWorkspaceDialog(
    { open, onOpenChange },
    businessLogic
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Main dialog content */}
      <CreateWorkspaceDialogContent {...dialogState} />

      {/* Invite member dialog (opens after workspace creation) */}
      <InviteDialogWrapper
        isInviteDialogOpen={dialogState.isInviteDialogOpen}
        setIsInviteDialogOpen={dialogState.setIsInviteDialogOpen}
        createdWorkspace={dialogState.createdWorkspace}
      />
    </Dialog>
  );
}
