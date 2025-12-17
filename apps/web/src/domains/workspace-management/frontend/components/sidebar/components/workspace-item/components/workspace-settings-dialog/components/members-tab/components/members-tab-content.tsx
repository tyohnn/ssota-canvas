'use client';

import { Separator } from '@workspace/ui/components/ui/separator';
import { Box } from '@workspace/ui/components/ui/box';
import { MembersTabHeader } from './members-tab-header';
import { WorkspaceMemberListTable } from './workspace-member-list-table';
import type { MemberRow } from '../core/types';

/**
 * Members Tab Content (Presentational)
 *
 * Combines header and member list table
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (no Context, no Hooks)
 * - Receives transformed data (no business logic)
 * - Storybook testable
 * - Simple values (arrays, booleans)
 */

interface MembersTabContentProps {
  memberRows: MemberRow[];
  isLoading: boolean;
  disableInvite?: boolean;
  onInviteClick: () => void;
}

export function MembersTabContent({
  memberRows,
  isLoading,
  disableInvite = false,
  onInviteClick,
}: MembersTabContentProps) {
  return (
    <Box className="space-y-6">
      <MembersTabHeader
        disableInvite={disableInvite}
        onInviteClick={onInviteClick}
      />
      <Separator />
      <WorkspaceMemberListTable memberRows={memberRows} isLoading={isLoading} />
    </Box>
  );
}
