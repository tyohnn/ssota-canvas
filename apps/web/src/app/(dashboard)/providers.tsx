'use client';

import { UIPreferencesProvider } from '@/contexts/ui-preferences-context';
import { NotificationProvider } from '@/domains/notification-management/frontend/contexts/notification-context';
import { MemberManagementProvider } from '@/domains/organization-management/frontend/contexts/member-management-context';

/**
 * Dashboard-specific Providers
 *
 * 인증된 사용자만 접근하는 Dashboard 영역에서만 사용하는 Provider들
 * - NotificationProvider: 알림 관리
 * - MemberManagementProvider: 멤버 관리
 * - UIPreferencesProvider: UI 설정 (마우스 감도 등)
 */
export function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIPreferencesProvider>
      <NotificationProvider>
        <MemberManagementProvider>{children}</MemberManagementProvider>
      </NotificationProvider>
    </UIPreferencesProvider>
  );
}
