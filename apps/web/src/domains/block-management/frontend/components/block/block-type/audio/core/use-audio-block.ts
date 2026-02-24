'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';

import { useReactFlow } from '@xyflow/react';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { fetchAudioMetadataAction } from '@/domains/audio-app-space/actions/metadata/fetch-audio-metadata.action';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AudioBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import type { UseAudioBlockProps, UseAudioBlockReturn } from './types';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;
const MAX_SIZE_MB = 50;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export function useAudioBlock(props: UseAudioBlockProps): UseAudioBlockReturn {
  const { nodeData, nodeId, selected, updateBlockTitle } = props;
  const properties = nodeData.properties as AudioBlockProperties;
  const {
    audioUrl = '',
    title = '',
    artist = '',
    playbackRate = 1.0,
    volume = 0.8,
  } = properties;

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: { getNode, updateNode },
  });
  const { upload, isUploading } = useSupabaseStorage();

  // Playback state
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const prevAudioUrlRef = useRef(audioUrl);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fetchedForUrlRef = useRef<string | null>(null);
  const summaryReportedForBlockRef = useRef<string | null>(null);

  // Metadata fetch (source/job)
  const fetchMetadata = useCallback(
    async (urlString: string) => {
      if (!urlString || !hasValidBlockId || !workspaceId || !orgId) return;

      try {
        const result = await fetchAudioMetadataAction({
          workspaceId,
          blockId: nodeData.blockId!,
          url: urlString,
          language: 'en',
        });

        if (result.success && result.data) {
          const { sourceId: newSourceId, blockUuid } = result.data;
          fetchedForUrlRef.current = urlString;

          if (newSourceId) {
            await updateProperties(
              nodeData.blockId!,
              { sourceId: newSourceId },
              nodeData
            );
          }

          if (
            newSourceId &&
            blockUuid &&
            summaryReportedForBlockRef.current !== blockUuid
          ) {
            summaryReportedForBlockRef.current = blockUuid;
            setAutoSummaryBlockId(blockUuid);
          }

          if (newSourceId && updateBlockTitle) {
            const props = nodeData.properties as AudioBlockProperties | undefined;
            const titleToSet =
              props?.title?.trim() ||
              props?.filename?.trim() ||
              'Untitled Audio';
            if (titleToSet) {
              await updateBlockTitle({
                nodeId,
                title: titleToSet,
                blockData: { ...nodeData, sourceId: newSourceId } as BlockNodeData,
              });
            }
          }
        }
      } catch (error) {
        console.error('[useAudioBlock] fetchAudioMetadata failed:', error);
      }
    },
    [
      hasValidBlockId,
      workspaceId,
      orgId,
      nodeData,
      nodeId,
      updateProperties,
      updateBlockTitle,
      setAutoSummaryBlockId,
    ]
  );

  useEffect(() => {
    if (!audioUrl) {
      prevAudioUrlRef.current = '';
      fetchedForUrlRef.current = null;
      summaryReportedForBlockRef.current = null;
      return;
    }

    const hasUrlChanged = prevAudioUrlRef.current !== audioUrl;
    const alreadyFetched = fetchedForUrlRef.current === audioUrl;

    if (hasUrlChanged) {
      fetchedForUrlRef.current = null;
      summaryReportedForBlockRef.current = null;
    }

    if (hasValidBlockId && hasUrlChanged && !alreadyFetched) {
      fetchMetadata(audioUrl);
      prevAudioUrlRef.current = audioUrl;
    } else {
      prevAudioUrlRef.current = audioUrl;
    }
  }, [audioUrl, hasValidBlockId, fetchMetadata]);

  // Reset loading when audioUrl changes
  useEffect(() => {
    if (audioUrl && audioUrl !== prevAudioUrlRef.current) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [audioUrl]);

  // File upload
  const [
    { isDragging, errors: uploadErrors },
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
    maxSize: MAX_SIZE,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview && fileWithPreview.file instanceof File) {
        try {
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
          await updateProperty(
            nodeData.blockId,
            'properties.filename',
            fileWithPreview.file.name,
            nodeData
          );
        } catch (error) {
          console.error('Failed to upload audio:', error);
        }
      }
    },
  });

  // Audio element effects
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
      const waveform = Array.from(
        { length: 100 },
        () => 0.2 + Math.random() * 0.6
      );
      setWaveformData(waveform);
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
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err =>
        console.error('Failed to play audio:', err)
      );
    }
    setIsPlaying(!isPlaying);
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
      alert('Failed to access microphone. Please check browser permissions.');
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
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        blockId: nodeData.blockId,
      });

      await updateProperty(
        nodeData.blockId,
        'properties.audioUrl',
        result.url,
        nodeData
      );
      await updateProperty(
        nodeData.blockId,
        'properties.filename',
        file.name,
        nodeData
      );

      setIsRecordDialogOpen(false);
      setRecordedBlob(null);
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording.');
    }
  }, [recordedBlob, upload, updateProperty, nodeData]);

  const handleOpenRecordDialog = useCallback(() => {
    setIsRecordDialogOpen(true);
    setRecordedBlob(null);
  }, []);

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

  return useMemo(
    (): UseAudioBlockReturn => ({
      audioUrl,
      title,
      artist,
      playbackRate,
      volume,
      isPlaying,
      currentTime,
      duration,
      isLoading,
      hasError,
      isUploading,
      uploadErrors,
      isDragging,
      waveformData,
      maxSizeMB: MAX_SIZE_MB,
      isRecordDialogOpen,
      isRecording,
      recordedBlob,
      audioRef,
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
    }),
    [
      audioUrl,
      title,
      artist,
      playbackRate,
      volume,
      isPlaying,
      currentTime,
      duration,
      isLoading,
      hasError,
      isUploading,
      uploadErrors,
      isDragging,
      waveformData,
      isRecordDialogOpen,
      isRecording,
      recordedBlob,
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
    ]
  );
}
