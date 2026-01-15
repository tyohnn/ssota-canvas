'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CanvasModeContextValue } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';

import type { YouTubePlayer, YoutubeBlockUIState } from './types';

/**
 * YouTube Block UI Hook
 *
 * UI 상태 관리 및 UI 관련 핸들러를 제공합니다.
 * 비즈니스 로직 없음 - 순수 UI 상태 관리만 담당
 */
export function useYoutubeBlockUI(
  url: string,
  selected: boolean,
  blockMountId: string,
  canvasMode: CanvasModeContextValue
): YoutubeBlockUIState {
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  // Refs (showPlayer 계산 전에 선언)
  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string>(url);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const previousPlayerStateRef = useRef<number | null>(null); // showPlayer가 false가 되기 전 재생 상태 저장
  const prevShowPlayerRef = useRef<boolean>(false); // 이전 showPlayer 상태 추적
  const showPlayerRef = useRef<boolean>(false); // showPlayer의 최신 값을 ref로 추적 (handlePlayerReady에서 사용)

  // 드래그 상태 확인 (canvas mode context 사용)
  const isDragging = useMemo(() => {
    if (!canvasMode.isDraggingMode()) {
      return false;
    }
    // 현재 블록이 드래그 중인 블록 목록에 포함되어 있는지 확인
    const mode = canvasMode.getCurrentMode();
    if (mode.type === 'dragging') {
      return mode.blockIds.includes(blockMountId);
    }
    return false;
  }, [canvasMode, blockMountId]);

  // URL이 있고 선택된 상태면 항상 플레이어 표시 (드래그 중이 아닐 때만)
  const showPlayer = selected && !!url && !isDragging;

  // showPlayer의 최신 값을 ref에 동기화
  showPlayerRef.current = showPlayer;

  // 1. 처음 유튜브 블록을 만들었을 때 input에 자동 포커스 (URL 없을 때 / 복붙한거 아님)
  useEffect(() => {
    if (selected && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, url]);

  // 2. URL이 변경되면 UI 상태 초기화
  // 주의: 이 useEffect는 URL이 실제로 변경되었을 때만 실행됨
  // handleUrlSubmit에서 이미 setIsLoading(true)를 호출하므로
  // 여기서는 URL이 변경되었을 때만 loading 상태를 설정
  useEffect(() => {
    if (url && url !== prevUrlRef.current) {
      // URL이 변경되었고 메타데이터가 없으면 loading 상태 유지
      // (handleUrlSubmit에서 이미 설정했을 수 있음)
      setIsLoading(true);
      setHasError(false);
      setIsIframeLoading(true); // URL 변경 시 iframe 로딩 시작
      // URL 변경 시 플레이어 ref 및 상태 초기화 (새로운 플레이어가 준비될 때까지)
      playerRef.current = null;
      previousPlayerStateRef.current = null;
      prevShowPlayerRef.current = showPlayer; // prevShowPlayerRef도 현재 값으로 초기화
      prevUrlRef.current = url;
    } else if (!url) {
      // URL이 없으면 loading 상태 해제
      setIsLoading(false);
      playerRef.current = null;
      previousPlayerStateRef.current = null;
      prevShowPlayerRef.current = false; // URL이 없으면 showPlayer는 false
      prevUrlRef.current = '';
    }
  }, [url, showPlayer]);

  // 3. showPlayer 상태 변경 시 일시정지/재생 처리 (드래그 및 선택 해제 통합 처리)
  useEffect(() => {
    if (!url) return;

    const prevShowPlayer = prevShowPlayerRef.current;
    const currentShowPlayer = showPlayer;

    // showPlayer가 false로 변경된 경우 (드래그 시작 또는 선택 해제)
    if (playerRef.current && prevShowPlayer && !currentShowPlayer) {
      // 플레이어가 준비되어 있으면 일시정지
      const player = playerRef.current;
      if (player) {
        try {
          // getPlayerState 호출 직전에 다시 한 번 체크
          if (player && typeof player.getPlayerState === 'function') {
            const currentState = player.getPlayerState();
            // YT.PlayerState.PLAYING = 1 (재생 중)
            if (currentState === 1) {
              previousPlayerStateRef.current = currentState;
              // pauseVideo 호출 직전에 다시 한 번 체크
              if (player && typeof player.pauseVideo === 'function') {
                player.pauseVideo();
              }
            }
          }
        } catch (error) {
          // player가 준비되지 않았거나 에러 발생 시 무시
          console.warn(
            '[YouTube Block] Failed to pause video when showPlayer becomes false:',
            error
          );
        }
      }
    }
    // showPlayer가 true로 변경된 경우 (드래그 종료 또는 선택)
    else if (!prevShowPlayer && currentShowPlayer) {
      // 플레이어가 준비되어 있고 이전에 재생 중이었으면 다시 재생
      const player = playerRef.current;
      if (player && previousPlayerStateRef.current === 1) {
        try {
          // playVideo 호출 직전에 다시 한 번 체크 (비동기 타이밍 이슈 방지)
          if (player && typeof player.playVideo === 'function') {
            player.playVideo();
            previousPlayerStateRef.current = null;
          }
        } catch (error) {
          console.warn(
            '[YouTube Block] Failed to resume video when showPlayer becomes true:',
            error
          );
          // 에러 발생 시 상태 초기화
          previousPlayerStateRef.current = null;
        }
      }
      // 플레이어가 아직 준비되지 않았으면 handlePlayerReady에서 처리
    }

    // 이전 상태 업데이트
    prevShowPlayerRef.current = currentShowPlayer;
  }, [showPlayer, url]);

  /**
   * iframe 로드 완료 핸들러
   */
  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  /**
   * Player Ready 핸들러 (react-youtube의 onReady 이벤트)
   * 플레이어가 준비되면 showPlayer 상태와 이전 재생 상태를 확인하여 자동 재생
   */
  const handlePlayerReady = useCallback((event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setIsIframeLoading(false);

    // showPlayer가 true이고 이전에 재생 중이었으면 자동 재생
    // ref를 사용하여 최신 showPlayer 값 참조 (stale closure 방지)
    const player = playerRef.current;
    if (
      player &&
      showPlayerRef.current &&
      previousPlayerStateRef.current === 1
    ) {
      try {
        // playVideo 호출 직전에 다시 한 번 체크 (비동기 타이밍 이슈 방지)
        if (player && typeof player.playVideo === 'function') {
          // playVideo 호출 직전에 playerRef.current를 다시 확인
          const currentPlayer = playerRef.current;
          if (currentPlayer && typeof currentPlayer.playVideo === 'function') {
            currentPlayer.playVideo();
          }
          previousPlayerStateRef.current = null;
        }
      } catch (error) {
        console.warn(
          '[YouTube Block] Failed to auto-resume video on player ready:',
          error
        );
        previousPlayerStateRef.current = null;
      }
    }
  }, []);

  /**
   * URL 입력 변경 핸들러
   */
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftUrl(e.target.value);
    },
    []
  );

  /**
   * URL 입력 키 다운 핸들러
   * Enter 키는 메인 훅의 handleUrlSubmit에서 처리
   */
  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();

      if (e.key === 'Escape') {
        setDraftUrl('');
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
      // Enter 키는 메인 훅에서 처리 (handleUrlSubmit)
    },
    []
  );

  /**
   * 이미지 로드 핸들러
   */
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  /**
   * 이미지 에러 핸들러
   */
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
    isDragging,
    inputRef,
    prevUrlRef,
    playerRef,
    setIsLoading,
    setHasError,
    setDraftUrl,
    setIsIframeLoading,
    handleIframeLoad,
    handlePlayerReady,
    handleUrlChange,
    handleUrlKeyDown,
    handleImageLoad,
    handleImageError,
  };
}
