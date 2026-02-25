'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gift } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

const VERSION_STORAGE_KEY = 'ssota_app_version';
const CHECK_INTERVAL_MS = 60_000;
const STALE_TAB_AUTO_RELOAD_MS = 30 * 60 * 1000; // 30분

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

  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isDevelopment) return;

    const clientVersion = getClientVersion();
    localStorage.setItem(VERSION_STORAGE_KEY, clientVersion);

    checkVersion();

    const handleVisibilityChange = () => {
      // 탭이 백그라운드로 갈 때: 복귀 시 경과 시간 계산을 위해 시각 저장
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      }
      // 탭이 포그라운드로 돌아올 때
      else if (document.visibilityState === 'visible') {
        const hiddenAt = hiddenAtRef.current;
        if (hiddenAt != null) {
          const awayMs = Date.now() - hiddenAt;
          // 30분 이상 비활성 상태였으면 자동 새로고침 (stale tab, 연결 끊김 등 방지)
          if (awayMs >= STALE_TAB_AUTO_RELOAD_MS) {
            window.location.reload();
            return;
          }
          hiddenAtRef.current = null; // 30분 미만이면 타이머 초기화
        }
        // 버전 체크 (새 배포 여부 확인)
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
