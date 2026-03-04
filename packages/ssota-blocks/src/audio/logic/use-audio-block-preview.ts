/**
 * Playback-only hook for audio preview (e.g. add dialog).
 * No domain deps: no upload, no persistence, no URL refresh.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  UseAudioBlockPreviewProps,
  UseAudioBlockPreviewReturn,
} from './types';

export function useAudioBlockPreview({
  audioUrl,
  filename,
}: UseAudioBlockPreviewProps): UseAudioBlockPreviewReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(!!audioUrl);
  const [hasError, setHasError] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      const durationSec = audio.duration;
      setDuration(durationSec);
      setIsLoading(false);
      setHasError(false);
      setWaveformData(
        Array.from({ length: 100 }, () => 0.2 + Math.random() * 0.6)
      );
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
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
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err =>
        console.error('Failed to play audio:', err)
      );
    }
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
