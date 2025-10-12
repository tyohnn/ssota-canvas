'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useWorkspace } from '../../hooks/use-workspace';
import type { InvitationSummaryDTO } from '../../../shared/dtos';

interface InvitationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: InvitationSummaryDTO | null;
}

/**
 * InvitationDetailDialog 컴포넌트 (Scenario 3)
 *
 * Workspace 초대 상세 및 수락/거절 모달
 * - 초대 정보 표시
 * - 수락/거절 액션
 * - toast 피드백
 */
export function InvitationDetailDialog({
  open,
  onOpenChange,
  invitation,
}: InvitationDetailDialogProps) {
  const { acceptInvitation, rejectInvitation, isLoading } = useWorkspace();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!invitation) {
    return null;
  }

  const handleAccept = async () => {
    setIsProcessing(true);
    const success = await acceptInvitation(invitation.invitationId);
    setIsProcessing(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const success = await rejectInvitation(invitation.invitationId);
    setIsProcessing(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const isPending = invitation.status === 'pending';
  const isAccepted = invitation.status === 'accepted';
  const isRejected = invitation.status === 'rejected';
  const isExpired = invitation.status === 'expired';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            워크스페이스 초대
          </DialogTitle>
          <DialogDescription>
            {isPending && '초대를 수락하거나 거절할 수 있습니다'}
            {isAccepted && '수락한 초대입니다'}
            {isRejected && '거절한 초대입니다'}
            {isExpired && '만료된 초대입니다'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 상태 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">상태:</span>
            {isPending && (
              <Badge variant="outline" className="gap-1">
                <Mail className="h-3 w-3" />
                대기 중
              </Badge>
            )}
            {isAccepted && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <CheckCircle className="h-3 w-3" />
                수락됨
              </Badge>
            )}
            {isRejected && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                거절됨
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                만료됨
              </Badge>
            )}
          </div>

          <Separator />

          {/* 워크스페이스 정보 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                {invitation.workspaceIcon ? (
                  <span className="text-2xl">{invitation.workspaceIcon}</span>
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {invitation.workspaceName}
                </h3>
                {invitation.workspaceDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {invitation.workspaceDescription}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* 초대 정보 */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">조직:</span>
                <span className="font-medium">
                  {invitation.organizationName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">초대자:</span>
                <span className="font-medium">{invitation.invitedBy}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">초대일:</span>
                <span className="font-medium">
                  {new Date(invitation.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {isPending ? (
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing || isLoading}
              >
                거절
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing || isLoading}
              >
                {isProcessing ? '처리 중...' : '수락'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
