'use client';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@workspace/ui/components/ui/sonner';
import { QueryProvider } from '@/lib/query-client';
import { MixpanelProvider } from '@/lib/mixpanel-provider';
import { AuthSessionMonitor } from '@/domains/auth/components/auth-session-monitor';

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
            </TooltipProvider>
          </AuthSessionMonitor>
        </MixpanelProvider>
      </NextThemesProvider>
    </QueryProvider>
  );
}
