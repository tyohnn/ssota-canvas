'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { InviteMemberDialogHeader } from './components/dialog-header';
import { InviteMemberDialogContent } from './components/invite-member-dialog-content';
import { InviteMemberDialogFooter } from './components/dialog-footer';
import { useInviteMemberDialog } from './core/use-invite-member-dialog';
import type { InviteMemberDialogProps } from './core/types';

/**
 * InviteMemberDialog Component (v4.0.0)
 *
 * Workspace member invitation modal following Container/Presentational pattern:
 *
 * **Architecture:**
 * - Container pattern: Hook → Props (no local Context)
 * - Presentational components: Props only (Storybook testable)
 * - Domain Hook: email search, member selection, invitation submission (shared)
 *
 * **Features:**
 * - Email search with debouncing (300ms)
 * - Multi-selection (Badge list)
 * - Invite multiple members at once
 * - Toast feedback
 * - Cache invalidation after success
 *
 * **Usage:**
 * ```tsx
 * <InviteMemberDialog
 *   workspaceId={workspaceId}
 *   workspaceName={workspaceName}
 *   open={open}
 *   onOpenChange={setOpen}
 *   showSkipButton={false}
 * />
 * ```
 *
 * @see docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md
 */
export function InviteMemberDialog(props: InviteMemberDialogProps) {
  const {
  workspaceName,
    showSkipButton,
    email,
    selectedMembers,
    searchResults,
    isSearching,
    isSubmitting,
    isLoading,
    setEmail,
    handleMemberSelect,
    handleRemoveMember,
    handleSubmit,
    handleClose,
  } = useInviteMemberDialog(props);

  return (
    <Dialog open={props.open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-md">
        <InviteMemberDialogHeader workspaceName={workspaceName} />
        <InviteMemberDialogContent
          email={email}
          selectedMembers={selectedMembers}
          searchResults={searchResults}
          isSearching={isSearching}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onMemberSelect={handleMemberSelect}
          onRemoveMember={handleRemoveMember}
        />
        <InviteMemberDialogFooter
          showSkipButton={showSkipButton}
          selectedMembersCount={selectedMembers.length}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
