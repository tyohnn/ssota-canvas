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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(!!audioUrl);
  const [hasError, setHasError] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio element 이벤트 바인딩 (audioUrl 기준, url 변경 추적 없음)
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
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, nodeData, updateProperty]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err =>
        console.error('Failed to play audio:', err)
      );
    }
    setIsPlaying(prev => !prev);
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
    togglePlay,
    handleSeek,
    formatTime,
  };
}
