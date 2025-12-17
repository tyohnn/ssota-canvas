'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Mail } from 'lucide-react';
import type { InvitationStatus } from '../core/types';

/**
 * Header section of InvitationDetailDialog (Presentational)
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface InvitationDetailDialogHeaderProps {
  title?: string;
  className?: string;
  status: InvitationStatus;
}

const STATUS_DESCRIPTIONS: Record<InvitationStatus, string> = {
  pending: 'You can accept or reject the invitation',
  accepted: 'You have accepted the invitation',
  rejected: 'You have rejected the invitation',
  expired: 'The invitation has expired',
};

export function InvitationDetailDialogHeader({
  title = 'Workspace Invitation',
  className,
  status,
}: InvitationDetailDialogHeaderProps) {
  const description = STATUS_DESCRIPTIONS[status];

  return (
    <DialogHeader className={className}>
      <DialogTitle className="flex items-center gap-2">
        <Mail className="h-5 w-5" />
        {title}
      </DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );
}
