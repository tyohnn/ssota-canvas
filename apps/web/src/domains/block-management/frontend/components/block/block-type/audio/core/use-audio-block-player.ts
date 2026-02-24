/**
 * Audio Block Player Hook
 *
 * 재생 UI 상태 및 컨트롤 전담.
 * audioUrl은 한 번 세팅되면 변경되지 않음을 전제로 함.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type ReactFlowDependencies,
  useUpdateBlockProperty,
} from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { refreshCanvasAssetAccessUrlAction } from '@/domains/storage/actions/storage.actions';
import { refreshPublishedCanvasAssetAccessUrlAction } from '@/domains/storage/actions/refresh-published-canvas-asset-access-url.action';
import type { CanvasAssetBlockType } from '@/domains/storage/actions/storage.actions';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface UseAudioBlockPlayerProps {
  audioUrl: string;
  nodeData: BlockNodeData;
  reactFlow: ReactFlowDependencies;
}

export interface UseAudioBlockPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
  waveformData: number[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 공개 페이지 refresh 시 일회성 URL 포함. 뷰에서는 이 값을 audio src로 사용 */
  effectiveAudioUrl: string;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}

export function useAudioBlockPlayer({
  audioUrl,
  nodeData,
  reactFlow,
}: UseAudioBlockPlayerProps): UseAudioBlockPlayerReturn {
  const { updateProperty } = useUpdateBlockProperty({ reactFlow });
  const { workspaceId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(!!audioUrl);
  const [hasError, setHasError] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  /** 공개 페이지 뷰에서 refresh 시 받은 일회성 URL (DB 미갱신) */
  const [ephemeralAccessUrl, setEphemeralAccessUrl] = useState<string | null>(
    null
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const hasTriedRefreshRef = useRef(false);

  const effectiveAudioUrl = ephemeralAccessUrl ?? audioUrl;

  const pathUrl = (nodeData.properties as { pathUrl?: string })?.pathUrl ?? '';

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      const durationSec = audio.duration;
      setDuration(durationSec);
      setIsLoading(false);
      setHasError(false);
      if (isFinite(durationSec) && durationSec >= 0 && nodeData.blockId) {
        updateProperty(
          nodeData.blockId,
          'properties.duration',
          durationSec,
          nodeData
        ).catch(() => {});
      }
      setWaveformData(
        Array.from({ length: 100 }, () => 0.2 + Math.random() * 0.6)
      );
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = async () => {
      if (hasTriedRefreshRef.current || !pathUrl || !nodeData.blockId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      const isPublishedView = readonly && publishToken;
      if (isPublishedView) {
        hasTriedRefreshRef.current = true;
        try {
          const result = await refreshPublishedCanvasAssetAccessUrlAction({
            publishToken,
            blockId: nodeData.blockId,
          });
          if (result.success && result.url) {
            setEphemeralAccessUrl(result.url);
            setHasError(false);
            setIsLoading(true);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        } catch {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }
      if (!workspaceId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      hasTriedRefreshRef.current = true;
      try {
        const result = await refreshCanvasAssetAccessUrlAction(
          workspaceId,
          nodeData.blockId,
          'audio' as CanvasAssetBlockType
        );
        if (result.success && result.url) {
          await updateProperty(
            nodeData.blockId,
            'properties.accessUrl',
            result.url,
            nodeData
          );
          setHasError(false);
          setIsLoading(true);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [
    audioUrl,
    nodeData,
    updateProperty,
    pathUrl,
    workspaceId,
    readonly,
    publishToken,
  ]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err =>
        console.error('Failed to play audio:', err)
      );
    }
    // isPlaying은 audio의 play/pause 이벤트로 동기화됨 (타임라인 seekTo+play 포함)
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    hasError,
    waveformData,
    audioRef,
    effectiveAudioUrl,
    togglePlay,
    handleSeek,
    formatTime,
  };
}
