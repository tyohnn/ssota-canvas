'use client';

import * as React from 'react';
import { SidebarMenuButton } from '@workspace/ui/components/ui/sidebar';
import { Badge } from '@workspace/ui/components/ui/badge';

interface SidebarNavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
  tooltip?: string;
  className?: string;
}

/**
 * 범용 사이드바 네비게이션 버튼
 * 
 * Home, Search, Inbox, Settings 등 모든 메뉴에서 사용 가능
 * 선택적으로 뱃지 표시 가능
 * 
 * @example
 * <SidebarNavButton
 *   icon={<Home />}
 *   label="Home"
 *   onClick={handleClick}
 * />
 * 
 * @example
 * <SidebarNavButton
 *   icon={<Inbox />}
 *   label="Inbox"
 *   badge={3}
 *   tooltip="Inbox"
 *   onClick={handleClick}
 * />
 */
export function SidebarNavButton({
  icon,
  label,
  onClick,
  badge,
  tooltip,
  className,
}: SidebarNavButtonProps) {
  return (
    <SidebarMenuButton
      className={className || 'text-muted-foreground'}
      tooltip={tooltip}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge
          variant="destructive"
          className="ml-auto min-w-[1.5rem] h-5 rounded-md px-1.5 text-xs"
        >
          {badge > 9 ? '9+' : badge}
        </Badge>
      )}
    </SidebarMenuButton>
  );
}
