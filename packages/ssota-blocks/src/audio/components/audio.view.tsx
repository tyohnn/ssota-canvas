'use client';

import { useCallback } from 'react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

import type { AudioViewProps } from '../logic/types';
import { AudioEmptyState } from './audio-empty-state';
import { AudioLoadingState } from './audio-loading-state';
import { AudioPlayer } from './audio-player';
import { AudioRecordDialog } from './audio-record-dialog';

/**
 * Audio View (Presentational)
 * Used in Canvas block and in add-dialog preview.
 */
export function AudioView({
  audioUrl,
  filename,
  isPlaying,
  currentTime,
  duration,
  waveformData,
  isLoading,
  hasError,
  isUploading,
  uploadErrors,
  isDragging,
  maxSizeMB,
  isRecordDialogOpen,
  isRecording,
  recordedBlob,
  audioRef,
  selected,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  openFileDialog,
  getInputProps,
  togglePlay,
  handleSeek,
  formatTime,
  handleOpenRecordDialog,
  handleCloseRecordDialog,
  handleRecordAgain,
  startRecording,
  stopRecording,
  handleSaveRecording,
}: AudioViewProps) {
  const shouldShowEmptyState = !audioUrl && !isUploading;
  const shouldShowLoadingState = !audioUrl && isUploading;
  const shouldShowPlayer = audioUrl && !shouldShowLoadingState;

  const handleBlockPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!selected) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    [selected]
  );

  return (
    <TooltipProvider>
      <Box
        className={cn(
          'w-full h-full flex flex-col relative overflow-hidden',
          'transition-[box-shadow,transform] duration-300 ease-out'
        )}
      >
        {!selected && (
          <Box
            className="absolute inset-0 z-10 cursor-default"
            onPointerDown={handleBlockPointerDown}
            onPointerDownCapture={handleBlockPointerDown}
            aria-hidden
          />
        )}
        <Box className="relative flex-1 overflow-hidden bg-muted/30 group">
          {shouldShowEmptyState && (
            <AudioEmptyState
              selected={selected}
              isDragging={isDragging}
              uploadErrors={uploadErrors}
              maxSizeMB={maxSizeMB}
              openFileDialog={openFileDialog}
              getInputProps={getInputProps}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onOpenRecordDialog={handleOpenRecordDialog}
            />
          )}

          {shouldShowLoadingState && <AudioLoadingState />}

          {shouldShowPlayer && (
            <>
              <AudioPlayer
                audioUrl={audioUrl}
                filename={filename}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                waveformData={waveformData}
                isLoading={isLoading}
                hasError={hasError}
                audioRef={audioRef}
                onTogglePlay={togglePlay}
                onSeek={handleSeek}
                formatTime={formatTime}
              />

              {isUploading && (
                <Box className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Skeleton className="w-full h-full" />
                </Box>
              )}
            </>
          )}
        </Box>

        <AudioRecordDialog
          open={isRecordDialogOpen}
          onOpenChange={() => {}}
          isRecording={isRecording}
          recordedBlob={recordedBlob}
          isUploading={isUploading}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSaveRecording={handleSaveRecording}
          onRecordAgain={handleRecordAgain}
          onClose={handleCloseRecordDialog}
        />
      </Box>
    </TooltipProvider>
  );
}
