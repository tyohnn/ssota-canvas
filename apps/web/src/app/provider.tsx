'use client';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@workspace/ui/components/ui/sonner';
import { NotificationProvider } from '@/domains/notification-management/frontend/contexts/notification-context';
import { MemberManagementProvider } from '@/domains/organization-management/frontend/contexts/member-management-context';

/**
 * Composes application-level context providers and a toaster around the provided children.
 *
 * Wraps children with theme, tooltip, notification, and member-management providers and renders a top-center toaster with rich colors and a close button.
 *
 * @returns The provider composition and toaster element that wrap the component tree
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <NotificationProvider>
          <MemberManagementProvider>{children}</MemberManagementProvider>
        </NotificationProvider>
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </NextThemesProvider>
  );
}