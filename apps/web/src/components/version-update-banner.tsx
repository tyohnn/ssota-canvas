'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

const VERSION_STORAGE_KEY = 'ssota_app_version';
const CHECK_INTERVAL_MS = 60_000;

function getClientVersion(): string {
  if (typeof window === 'undefined') return 'development';
  return process.env.NEXT_PUBLIC_APP_VERSION || 'development';
}

const isDevelopment = process.env.NODE_ENV === 'development';

export function VersionUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  const checkVersion = useCallback(async () => {
    if (isDevelopment) return;
    if (typeof window === 'undefined') return;

    const clientVersion = getClientVersion();
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    // Initialize stored version on first load
    if (!storedVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, clientVersion);
      return;
    }

    try {
      const res = await fetch('/api/version');
      const { version } = (await res.json()) as { version: string };
      if (version && version !== storedVersion) {
        setShowBanner(true);
      }
    } catch {
      // Ignore fetch errors (offline, etc.)
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isDevelopment) return;

    const clientVersion = getClientVersion();
    localStorage.setItem(VERSION_STORAGE_KEY, clientVersion);

    checkVersion();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [checkVersion]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isDevelopment || !showBanner) return null;

  return (
    <Box
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg"
      role="alert"
    >
      <Box className="flex items-center gap-1.5">
        <Gift className="size-4 shrink-0 text-popover-foreground" />
        <span className="text-sm text-popover-foreground">
          New version available.
        </span>
      </Box>
      <Button
        size="sm"
        variant="default"
        className="h-6 px-2 text-xs"
        onClick={handleRefresh}
      >
        Refresh
      </Button>
    </Box>
  );
}
