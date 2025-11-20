'use client';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@workspace/ui/components/ui/sonner';
import { NotificationProvider } from '@/domains/notification-management/frontend/contexts/notification-context';
import { MemberManagementProvider } from '@/domains/organization-management/frontend/contexts/member-management-context';
import { QueryProvider } from '@/lib/query-client';
import { MixpanelProvider } from '@/lib/mixpanel-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <MixpanelProvider>
          <TooltipProvider>
            <NotificationProvider>
              <MemberManagementProvider>{children}</MemberManagementProvider>
            </NotificationProvider>
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </MixpanelProvider>
      </NextThemesProvider>
    </QueryProvider>
  );
}
