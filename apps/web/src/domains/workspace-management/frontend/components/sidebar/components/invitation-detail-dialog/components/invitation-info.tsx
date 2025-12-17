'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Box } from '@workspace/ui/components/ui/box';
import {
  Mail,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { InvitationSummaryDTO } from '@/domains/workspace-management/shared/dtos';
import type { InvitationStatus } from '../core/types';

/**
 * Invitation information display (Presentational)
 *
 * Shows:
 * - Status badge
 * - Workspace info
 * - Organization info
 * - Inviter info
 * - Created date
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InvitationInfoProps {
  invitation: InvitationSummaryDTO | null;
  status: InvitationStatus;
}

export function InvitationInfo({ invitation, status }: InvitationInfoProps) {
  if (!invitation) {
    return null;
  }

  return (
    <Box className="space-y-4">
      {/* 상태 뱃지 */}
      <Box className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">상태:</span>
        {status === 'pending' && (
          <Badge variant="outline" className="gap-1">
            <Mail className="h-3 w-3" />
            Pending
          </Badge>
        )}
        {status === 'accepted' && (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        )}
        {status === 'rejected' && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )}
        {status === 'expired' && (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        )}
      </Box>

      <Separator />

      {/* 워크스페이스 정보 */}
      <Box className="space-y-3">
        <Box className="flex items-start gap-3">
          <Box className="p-2 rounded-md bg-primary/10">
            {invitation.workspaceIcon ? (
              <span className="text-2xl">{invitation.workspaceIcon}</span>
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
          </Box>
          <Box className="flex-1">
            <h3 className="font-semibold text-lg">
              {invitation.workspaceName}
            </h3>
            {invitation.workspaceDescription && (
              <p className="text-sm text-muted-foreground mt-1">
                {invitation.workspaceDescription}
              </p>
            )}
          </Box>
        </Box>

        <Separator />

        {/* 초대 정보 */}
        <Box className="space-y-2 text-sm">
          <Box className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Organization:</span>
            <span className="font-medium">{invitation.organizationName}</span>
          </Box>

          <Box className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Inviter:</span>
            <span className="font-medium">{invitation.invitedBy}</span>
          </Box>

          <Box className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Invitation Date:</span>
            <span className="font-medium">
              {new Date(invitation.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
