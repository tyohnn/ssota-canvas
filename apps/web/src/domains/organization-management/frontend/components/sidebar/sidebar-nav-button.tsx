'use client';

import * as React from 'react';
import { SidebarMenuButton } from '@workspace/ui/components/ui/sidebar';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

interface SidebarNavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
  badgeText?: string; // 배지에 표시될 텍스트 (badge prop보다 우선)
  badgeTooltip?: string; // 배지 tooltip 텍스트
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
  badgeText,
  badgeTooltip,
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
      {badgeText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="default"
                className="ml-auto min-w-5 h-5 rounded-md px-0.5 text-xs"
              >
                {badgeText}
              </Badge>
            </TooltipTrigger>
            {badgeTooltip && (
              <TooltipContent side="right">
                <p>{badgeTooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </SidebarMenuButton>
  );
}
