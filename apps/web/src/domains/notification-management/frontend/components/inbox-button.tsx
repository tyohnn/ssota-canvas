'use client';

import { Inbox } from 'lucide-react';
import { SidebarNavButton } from '@/domains/organization-management/frontend/components/sidebar/sidebar-nav-button';
import { useNotificationContext } from '../contexts/notification-context';

interface InboxButtonProps {
  onClick: () => void;
}

export function InboxButton({ onClick }: InboxButtonProps) {
  const { unreadCount } = useNotificationContext();

  // 배지에 표시될 텍스트 계산
  const badgeText = unreadCount > 0 ? (unreadCount > 99 ? '+99' : unreadCount.toString()) : undefined;

  // 배지 tooltip 텍스트 계산 (콤마 구분 형식)
  const badgeTooltip = unreadCount > 0
    ? `${unreadCount.toLocaleString('en-US')} unread notifications`
    : undefined;

  return (
    <SidebarNavButton
      icon={<Inbox />}
      label="Inbox"
      badge={unreadCount}
      badgeText={badgeText}
      badgeTooltip={badgeTooltip}
      tooltip="Inbox"
      onClick={onClick}
    />
  );
}
