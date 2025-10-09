'use client';

import React, { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Badge } from '@workspace/ui/components/ui/badge';
import { NotificationSummary } from '../../shared/dtos';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationSummary;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onInvitationRespond?: (
    invitationId: string,
    accept: boolean
  ) => Promise<void>;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onInvitationRespond,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleInvitationResponse = async (accept: boolean) => {
    if (!notification.relatedId || !onInvitationRespond) return;

    setIsProcessing(true);
    try {
      // 1. 초대 응답 처리
      await onInvitationRespond(notification.relatedId, accept);

      // 2. 알림을 자동으로 읽음 처리 (Optimistic)
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div
      className={cn(
        'relative px-6 py-4 border-b transition-colors hover:bg-accent/50',
        !notification.isRead && 'bg-blue-50/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 호버 시 액션 버튼 (우측 상단 absolute) */}
      {isHovered && !notification.isRead && (
        <div className="absolute top-3 right-4 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleMarkAsRead}
            className="h-7 w-7"
            aria-label="읽음 처리"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="pr-10">
        <div className="flex items-center gap-2 mb-1">
          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
          <h4 className="font-medium text-sm">{notification.title}</h4>
          {!notification.isRead && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] py-0 px-1.5 h-4">
              NEW
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {formatDate(notification.createdAt)}
        </p>

        {/* 초대 알림의 경우 액션 버튼 표시 */}
        {notification.type === 'invitation' && !notification.isRead && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => handleInvitationResponse(true)}
              disabled={isProcessing}
              className="h-7 text-xs px-3"
            >
              <Check className="h-3 w-3 mr-1" />
              승낙
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleInvitationResponse(false)}
              disabled={isProcessing}
              className="h-7 text-xs px-3"
            >
              <X className="h-3 w-3 mr-1" />
              거절
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
