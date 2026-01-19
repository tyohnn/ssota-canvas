'use client';

import { Inbox } from 'lucide-react';
import { SidebarMenuButton } from '@workspace/ui/components/ui/sidebar';
import { Badge } from '@workspace/ui/components/ui/badge';
import { useNotification } from '../hooks/use-notification';

interface InboxButtonProps {
  onClick: () => void;
}

export function InboxButton({ onClick }: InboxButtonProps) {
  const { unreadCount } = useNotification();

  return (
    <SidebarMenuButton
      className="text-muted-foreground"
      tooltip="Inbox"
      onClick={onClick}
    >
      <Inbox />
      <span>Inbox</span>
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="ml-auto min-w-[1.5rem] h-5 rounded-md px-1.5 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </SidebarMenuButton>
  );
}
