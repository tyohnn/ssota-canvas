'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { NodeProps } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import {
  AudioLines,
  Check,
  Mic,
  Music,
  Pause,
  Play,
  Square,
  Upload,
} from 'lucide-react';

import { LiveWaveform } from '@workspace/ui/components/eleven-labs/live-waveform';
import { AudioScrubber } from '@workspace/ui/components/eleven-labs/waveform';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { AudioBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AudioBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import { BaseBlock } from '../base-block';

/**
 * Audio Block Component
 *
 * 오디오를 재생하는 블록 컴포넌트
 */
export const AudioBlock = memo(function AudioBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as AudioBlockNodeData;
  const properties = nodeData.properties as AudioBlockProperties;

  // Properties destructuring
  const { audioUrl, title, artist, playbackRate, volume } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 400;
  const height = typeof nodeH === 'number' ? nodeH : 180;

  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Recording state
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevAudioUrlRef = useRef(audioUrl);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Hooks
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const { upload, isUploading } = useSupabaseStorage();

  // audioUrl이 변경되면 로딩 상태로 전환
  useEffect(() => {
    if (audioUrl && audioUrl !== prevAudioUrlRef.current) {
      setIsLoading(true);
      setHasError(false);
      prevAudioUrlRef.current = audioUrl;
    }
  }, [audioUrl]);

  // File upload hook (only used when no audio)
  const maxSizeMB = 50;
  const maxSize = maxSizeMB * 1024 * 1024; // 50MB

  const [
    { files, isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'audio/*',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      // Handle file upload
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview && fileWithPreview.file instanceof File) {
        try {
          // Upload to Supabase Storage
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file: fileWithPreview.file,
            blockId: nodeData.blockId,
          });

          await updateProperty(
            nodeData.blockId,
            'properties.audioUrl',
            result.url,
            nodeData
          );
        } catch (error) {
          console.error('Failed to upload audio:', error);
        }
      }
    },
  });

  // Load audio and extract waveform
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);

      // Generate waveform data (simplified - in production, use Web Audio API)
      const waveform = Array.from(
        { length: 100 },
        () => 0.2 + Math.random() * 0.6
      );
      setWaveformData(waveform);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

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
  }, [audioUrl]);

  // Apply playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Apply volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handlers
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording handlers
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('마이크 접근에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSaveRecording = useCallback(async () => {
    if (!recordedBlob) return;

    try {
      // Create a file from blob
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      // Upload to Supabase
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        blockId: nodeData.blockId,
      });

      // Update property
      await updateProperty(
        nodeData.blockId,
        'properties.audioUrl',
        result.url,
        nodeData
      );

      // Close dialog and reset state
      setIsRecordDialogOpen(false);
      setRecordedBlob(null);
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('녹음 저장에 실패했습니다.');
    }
  }, [recordedBlob, upload, updateProperty, nodeData]);

  const handleOpenRecordDialog = useCallback(() => {
    setIsRecordDialogOpen(true);
    setRecordedBlob(null);
  }, []);

  const handleCloseRecordDialog = useCallback(() => {
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setIsRecordDialogOpen(false);
    setRecordedBlob(null);
  }, [isRecording]);

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <TooltipProvider>
        <div
          className={cn(
            'w-full h-full flex flex-col relative',
            'bg-background border-2 border-border rounded-lg overflow-hidden',
            'shadow-md',
            !selected && 'hover:shadow-xl',
            selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
            selected && 'shadow-xl',
            'transition-all duration-300 ease-out'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 오디오 컨테이너 */}
          <div className="relative flex-1 overflow-hidden bg-muted/30 group">
            {!audioUrl ? (
              isUploading ? (
                <Skeleton className="absolute inset-0" />
              ) : (
                <div
                  onDragEnter={selected ? handleDragEnter : undefined}
                  onDragLeave={selected ? handleDragLeave : undefined}
                  onDragOver={selected ? handleDragOver : undefined}
                  onDrop={selected ? handleDrop : undefined}
                  data-dragging={isDragging || undefined}
                  className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center gap-4 p-6',
                    'transition-colors',
                    isDragging &&
                      'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload audio"
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
                      aria-hidden="true"
                    >
                      <Music className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {selected
                        ? '오디오를 추가하세요'
                        : '오디오를 추가하려면 블록을 선택하세요'}
                    </p>
                    {selected && (
                      <>
                        <p className="text-xs text-muted-foreground mb-3">
                          파일을 드롭하거나 아래 버튼을 사용하세요 (최대{' '}
                          {maxSizeMB}MB)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openFileDialog}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            파일 업로드
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenRecordDialog}
                            className="gap-2"
                          >
                            <Mic className="w-4 h-4" />
                            녹음하기
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  {uploadErrors.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <span>{uploadErrors[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Audio player wrapper
              <>
                {/* Hidden audio element */}
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Loading skeleton */}
                {isLoading && !hasError && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}

                {/* Audio Player Content */}
                <div
                  className={cn(
                    'absolute inset-0 flex flex-col',
                    (isLoading || hasError) && 'opacity-0',
                    'transition-opacity duration-300'
                  )}
                >
                  {/* Header */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-start gap-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={togglePlay}
                        disabled={!audioUrl || hasError || isLoading}
                        className={cn(
                          'shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                          'bg-primary hover:bg-primary/90 text-primary-foreground',
                          'transition-colors duration-200',
                          'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5" />
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {title ? (
                          <div className="text-sm font-medium text-foreground truncate">
                            {title}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-muted-foreground truncate">
                            Untitled Audio
                          </div>
                        )}
                        {artist && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {artist}
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>

                  {/* Waveform Scrubber */}
                  <div className="px-4 pb-4 flex-1 flex items-center">
                    <AudioScrubber
                      data={waveformData}
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={handleSeek}
                      showHandle={true}
                      barWidth={2}
                      barGap={1}
                      barRadius={1}
                      height={80}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 에러 오버레이 */}
                {hasError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 backdrop-blur-sm">
                    <AudioLines className="h-12 w-12 mb-2" />
                    <span className="text-sm font-medium">
                      오디오 로드 실패
                    </span>
                  </div>
                )}

                {/* 업로드 중 Skeleton Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* Recording Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={handleCloseRecordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>오디오 녹음</DialogTitle>
            <DialogDescription>
              마이크를 통해 오디오를 녹음합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Live Waveform */}
            <div className="bg-muted/30 rounded-lg p-4">
              <LiveWaveform
                active={isRecording}
                processing={false}
                height={80}
                barWidth={3}
                barGap={2}
                mode="static"
                fadeEdges={true}
                barColor="gray"
                historySize={120}
              />
            </div>

            {/* Status */}
            <div className="text-center">
              {isRecording ? (
                <p className="text-sm text-muted-foreground">
                  🔴 녹음 중... (Stop 버튼을 눌러 종료)
                </p>
              ) : recordedBlob ? (
                <p className="text-sm text-muted-foreground">
                  ✅ 녹음 완료! Save 버튼을 눌러 저장하세요
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start 버튼을 눌러 녹음을 시작하세요
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!recordedBlob ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseRecordDialog}
                  disabled={isRecording}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="gap-2"
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Start
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecordedBlob(null);
                  }}
                >
                  다시 녹음
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveRecording}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    '업로드 중...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseBlock>
  );
});
