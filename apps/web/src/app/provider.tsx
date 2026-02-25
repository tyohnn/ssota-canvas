'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { Toaster } from '@workspace/ui/components/ui/sonner';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

import { VersionUpdateBanner } from '@/components/version-update-banner';
import { AuthSessionMonitor } from '@/domains/auth/components/auth-session-monitor';
import { MixpanelProvider, QueryProvider } from '@/lib';

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
          <AuthSessionMonitor>
            <TooltipProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
              <VersionUpdateBanner />
            </TooltipProvider>
          </AuthSessionMonitor>
        </MixpanelProvider>
      </NextThemesProvider>
    </QueryProvider>
  );
}
