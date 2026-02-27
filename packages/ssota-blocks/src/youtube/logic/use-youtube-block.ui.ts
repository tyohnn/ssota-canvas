'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { YouTubePlayer, YoutubeBlockUIState } from './types';

export interface UseYoutubeBlockUIParams {
  url: string;
  isActive: boolean;
  showPlayer: boolean;
  instanceId: string;
  onProvideCallbacks?: (provide: () => Promise<Record<string, (...args: unknown[]) => void>>) => void;
  onUnmount?: () => void;
}

/**
 * YouTube Block UI Hook
 *
 * UI 상태 관리 및 UI 관련 핸들러.
 * showPlayer는 Result Injection (호출부 계산).
 * onProvideCallbacks, onUnmount는 Parameterization (동작 주입).
 */
export function useYoutubeBlockUI({
  url,
  isActive,
  showPlayer,
  instanceId,
  onProvideCallbacks,
  onUnmount,
}: UseYoutubeBlockUIParams): YoutubeBlockUIState {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevUrlRef = useRef<string>(url);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const previousPlayerStateRef = useRef<number | null>(null);
  const prevShowPlayerRef = useRef<boolean>(false);
  const showPlayerRef = useRef<boolean>(false);
  showPlayerRef.current = showPlayer;

  useEffect(() => {
    if (isActive && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, url]);

  useEffect(() => {
    if (url && url !== prevUrlRef.current) {
      setIsLoading(true);
      setHasError(false);
      setIsIframeLoading(true);
      playerRef.current = null;
      previousPlayerStateRef.current = null;
      prevShowPlayerRef.current = showPlayer;
      prevUrlRef.current = url;
    } else if (!url) {
      setIsLoading(false);
      playerRef.current = null;
      previousPlayerStateRef.current = null;
      prevShowPlayerRef.current = false;
      prevUrlRef.current = '';
    }
  }, [url, showPlayer]);

  const provideCallbacks = useCallback(async (): Promise<
    Record<string, (...args: unknown[]) => void>
  > => {
    const player = playerRef.current;
    if (!player || typeof player.seekTo !== 'function') {
      return {} as Record<string, (...args: unknown[]) => void>;
    }
    return {
      seekTo: (seconds: unknown) => {
        const p = playerRef.current;
        if (!p || typeof p.seekTo !== 'function') return;
        try {
          p.seekTo(Number(seconds), true);
          if (typeof p.playVideo === 'function') p.playVideo();
        } catch {
          // ignore
        }
      },
    };
  }, []);

  const onUnmountRef = useRef(onUnmount);
  onUnmountRef.current = onUnmount;
  const onProvideCallbacksRef = useRef(onProvideCallbacks);
  onProvideCallbacksRef.current = onProvideCallbacks;

  useEffect(() => {
    const provide = onProvideCallbacksRef.current;
    if (showPlayer && playerRef.current && provide) {
      provide(provideCallbacks);
    }
    return () => {
      onUnmountRef.current?.();
    };
  }, [showPlayer, instanceId, provideCallbacks]);

  useEffect(() => {
    if (!url) return;

    const prevShowPlayer = prevShowPlayerRef.current;
    const currentShowPlayer = showPlayer;

    if (playerRef.current && prevShowPlayer && !currentShowPlayer) {
      const player = playerRef.current;
      try {
        if (player && typeof player.getPlayerState === 'function') {
          const currentState = player.getPlayerState();
          if (currentState === 1 || currentState !== -1) {
            if (currentState === 1) {
              previousPlayerStateRef.current = currentState;
            }
            if (player && typeof player.pauseVideo === 'function') {
              player.pauseVideo();
            }
          }
        }
      } catch {
        // ignore
      }
    } else if (!prevShowPlayer && currentShowPlayer) {
      const player = playerRef.current;
      if (player && previousPlayerStateRef.current === 1) {
        try {
          if (player && typeof player.playVideo === 'function') {
            player.playVideo();
            previousPlayerStateRef.current = null;
          }
        } catch {
          previousPlayerStateRef.current = null;
        }
      }
    }

    prevShowPlayerRef.current = currentShowPlayer;
  }, [showPlayer, url]);

  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  const handlePlayerReady = useCallback(
    (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target;
      setIsIframeLoading(false);

      if (showPlayer && onProvideCallbacks) {
        onProvideCallbacks(provideCallbacks);
      }

      const player = playerRef.current;
      if (
        player &&
        showPlayerRef.current &&
        previousPlayerStateRef.current === 1
      ) {
        try {
          if (player && typeof player.playVideo === 'function') {
            player.playVideo();
            previousPlayerStateRef.current = null;
          }
        } catch {
          previousPlayerStateRef.current = null;
        }
      }
    },
    [showPlayer, onProvideCallbacks, provideCallbacks]
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftUrl(e.target.value);
    },
    []
  );

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setDraftUrl('');
        if (inputRef.current) {
          inputRef.current.blur();
        }
        return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && !draftUrl) {
        return;
      }
      e.stopPropagation();
    },
    [draftUrl]
  );

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setIsLoading(false);
      setHasError(true);
      (e.target as HTMLImageElement).style.display = 'none';
    },
    []
  );

  return {
    showPlayer,
    isLoading,
    hasError,
    draftUrl,
    isIframeLoading,
    inputRef,
    handleIframeLoad,
    handlePlayerReady,
    handleUrlChange,
    handleUrlKeyDown,
    handleImageLoad,
    handleImageError,
    setIsLoading,
    setHasError,
    setDraftUrl,
  } as YoutubeBlockUIState & {
    setIsLoading: (v: boolean) => void;
    setHasError: (v: boolean) => void;
    setDraftUrl: (v: string) => void;
  };
}
