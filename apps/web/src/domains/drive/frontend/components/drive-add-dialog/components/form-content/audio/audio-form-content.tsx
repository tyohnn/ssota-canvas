'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';
import { useFileUpload } from '@workspace/ui/hooks/use-file-upload';
import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';
import { Mic, Music, Upload } from 'lucide-react';

import { Box } from '@/components/ui/box';
import {
  AudioView,
  AudioRecordDialog,
  useAudioBlockPreview,
} from '@workspace/ssota-blocks/audio';

const MAX_SIZE_MB = 6;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export interface AudioFormContentProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
}

export function AudioFormContent({
  selectedFile,
  onFileSelect,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
}: AudioFormContentProps) {
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [
    { isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept: 'audio/*',
    maxSize: MAX_SIZE,
    multiple: false,
    onFilesAdded: (addedFiles: FileWithPreview[]) => {
      const file = addedFiles[0]?.file;
      onFileSelect(file instanceof File ? file : null);
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
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
    const file = new File(
      [recordedBlob],
      `recording-${Date.now()}.webm`,
      { type: 'audio/webm' }
    );
    onFileSelect(file);
    setIsRecordDialogOpen(false);
    setRecordedBlob(null);
  }, [recordedBlob, onFileSelect]);

  const handleCloseRecordDialog = useCallback(() => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setIsRecordDialogOpen(false);
    setRecordedBlob(null);
  }, [isRecording]);

  const handleRecordAgain = useCallback(() => {
    setRecordedBlob(null);
  }, []);

  const handleRemove = useCallback(() => {
    clearFiles();
    onFileSelect(null);
  }, [clearFiles, onFileSelect]);

  const previewObjectUrl = useMemo(() => {
    if (!selectedFile) return '';
    try {
      return URL.createObjectURL(selectedFile);
    } catch {
      return '';
    }
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const previewHook = useAudioBlockPreview({
    audioUrl: previewObjectUrl,
    filename: selectedFile?.name ?? '',
  });

  const audioViewProps = useMemo(() => {
    const noop = () => {};
    const noopAsync = async () => {};
    return {
      audioUrl: previewObjectUrl,
      filename: selectedFile?.name ?? '',
      ...previewHook,
      isUploading: false,
      uploadErrors: [] as string[],
      isDragging: false,
      maxSizeMB: MAX_SIZE_MB,
      isRecordDialogOpen: false,
      isRecording: false,
      recordedBlob: null as Blob | null,
      selected: true,
      handleDragEnter: noop,
      handleDragLeave: noop,
      handleDragOver: noop,
      handleDrop: noop,
      openFileDialog: noop,
      getInputProps: () => ({}),
      handleOpenRecordDialog: noop,
      handleCloseRecordDialog: noop,
      handleRecordAgain: noop,
      startRecording: noopAsync,
      stopRecording: noop,
      handleSaveRecording: noopAsync,
    };
  }, [
    previewObjectUrl,
    selectedFile?.name,
    previewHook,
  ]);

  return (
    <>
      {selectedFile && previewObjectUrl && (
        <Box
          className={cn(
            'w-full rounded-lg border border-border overflow-hidden bg-muted/30',
            '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
          )}
          style={{ width: 350, height: 160 }}
        >
          <AudioView {...audioViewProps} />
        </Box>
      )}
      <Box className="space-y-2">
        <p className="text-sm font-medium text-foreground">Add audio</p>
        {selectedFile ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            Remove file
          </Button>
        ) : (
          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            className={cn(
              'rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center min-h-[120px] transition-colors',
              isDragging && 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
            )}
          >
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Upload audio"
            />
            <Box className="flex flex-col items-center justify-center text-center px-4 py-6">
              <Box
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
                aria-hidden
              >
                <Music className="h-5 w-5 text-muted-foreground" />
              </Box>
              <p className="text-xs text-muted-foreground mb-3">
                Drop a file or use the buttons below (max {MAX_SIZE_MB} MB)
              </p>
              <Box className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload file
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    setIsRecordDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Record
                </Button>
              </Box>
            </Box>
            {uploadErrors[0] && (
              <p className="text-xs text-destructive mt-2 px-4">
                {uploadErrors[0]}
              </p>
            )}
          </Box>
        )}
      </Box>

      <AudioRecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        isRecording={isRecording}
        recordedBlob={recordedBlob}
        isUploading={false}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSaveRecording={handleSaveRecording}
        onRecordAgain={handleRecordAgain}
        onClose={handleCloseRecordDialog}
      />
    </>
  );
}
