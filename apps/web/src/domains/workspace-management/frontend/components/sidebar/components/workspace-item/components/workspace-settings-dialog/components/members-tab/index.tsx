'use client';

import { MembersTabContent } from './components/members-tab-content';
import { InviteDialogWrapper } from './components/invite-dialog-wrapper';
import { useMembersTab } from './core/use-members-tab';
import type { MembersTabProps } from './core/types';
import type { MembersTabBusinessLogic } from './core/use-members-tab.business';

/**
 * MembersTab Component (Container)
 *
 * Tab for managing workspace members following Container/Presentational pattern:
 *
 * **Architecture (v4.0.0):**
 * - Container pattern: Hook → Props (no local Context)
 * - Presentational components: Props only (Storybook testable)
 * - Domain Context: workspace-settings-dialog level
 *
 * **Features:**
 * - Member list display
 * - Invite button
 * - Auto-load members on mount
 *
 * **Usage:**
 * ```tsx
 * // Production
 * <MembersTab workspaceId={workspaceId} />
 *
 * // With custom business logic (testing/mock)
 * const mockBusiness = useMockMembersTabBusiness();
 * <MembersTab
 *   workspaceId={workspaceId}
 *   businessLogic={mockBusiness}
 * />
 * ```
 */
export function MembersTab({
  workspaceId,
  workspaceName,
  disableInvite,
  businessLogic,
}: MembersTabProps & {
  businessLogic?: MembersTabBusinessLogic;
}) {
  // Container: Hook으로 데이터 가져오기 (useQuery 자동 관리)
  const {
    memberRows,
    isLoadingMembersQuery,
    isInviteDialogOpen,
    refetch,
    setIsInviteDialogOpen,
  } = useMembersTab(
    { workspaceId, workspaceName, disableInvite: disableInvite ?? false },
    businessLogic
  );

  // Props로 Presentational에 전달 (이미 변환된 데이터)
  return (
    <>
      <MembersTabContent
        memberRows={memberRows}
        isLoading={isLoadingMembersQuery}
        disableInvite={disableInvite}
        onInviteClick={() => setIsInviteDialogOpen(true)}
      />
      <InviteDialogWrapper
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSuccess={refetch} // ✅ useQuery의 refetch 사용
      />
    </>
  );
}
