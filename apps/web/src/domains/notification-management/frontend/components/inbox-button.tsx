'use client';

import { Bell } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Badge } from '@workspace/ui/components/ui/badge';
import { useNotification } from '../hooks/use-notification';

interface InboxButtonProps {
  onClick: () => void;
}

/**
 * Render an inbox button that displays the current unread notification count.
 *
 * @returns A button element containing a bell icon and, when `unreadCount > 0`, a destructive badge showing the unread count (displays `"9+"` when greater than 9).
 */
export function InboxButton({ onClick }: InboxButtonProps) {
  const { unreadCount } = useNotification();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      aria-label={`인박스 (읽지 않은 알림 ${unreadCount}개)`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}