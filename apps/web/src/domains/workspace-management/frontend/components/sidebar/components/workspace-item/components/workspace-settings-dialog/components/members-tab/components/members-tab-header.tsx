'use client';

import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Members Tab Header (Presentational)
 *
 * Displays title, description, and invite button
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (no Context, no Hooks)
 * - Storybook testable
 * - Simple callback prop
 */

interface MembersTabHeaderProps {
  disableInvite?: boolean;
  onInviteClick: () => void;
}

export function MembersTabHeader({
  disableInvite = false,
  onInviteClick,
}: MembersTabHeaderProps) {
  return (
    <Box className="flex items-center justify-between">
      <Box>
        <h2 className="text-lg font-semibold">Member Management</h2>
        <p className="text-sm text-muted-foreground">
          Invite and manage workspace members.
        </p>
      </Box>
      {!disableInvite && (
        <Button onClick={onInviteClick} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      )}
    </Box>
  );
}
