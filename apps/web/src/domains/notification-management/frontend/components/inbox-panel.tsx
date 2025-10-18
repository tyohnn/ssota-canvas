'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@workspace/ui/components/ui/sheet';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { useNotification } from '../hooks/use-notification';
import { NotificationItem } from './notification-item';

interface InboxPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationRespond?: (
    invitationId: string,
    accept: boolean
  ) => Promise<void>;
  onWorkspaceInvitationRespond?: (
    invitationId: string,
    accept: boolean
  ) => Promise<void>;
}

export function InboxPanel({
  open,
  onOpenChange,
  onInvitationRespond,
  onWorkspaceInvitationRespond,
}: InboxPanelProps) {
  const { notifications, unreadCount, markAsRead, isLoading, error } =
    useNotification();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-base">
              인박스
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              알림 목록을 확인하고 관리할 수 있습니다.
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">로딩 중...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLoading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">알림이 없습니다</p>
              </div>
            )}

            {!isLoading && !error && notifications.length > 0 && (
              <ScrollArea className="h-full">
                <div>
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onInvitationRespond={onInvitationRespond}
                      onWorkspaceInvitationRespond={
                        onWorkspaceInvitationRespond
                      }
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
