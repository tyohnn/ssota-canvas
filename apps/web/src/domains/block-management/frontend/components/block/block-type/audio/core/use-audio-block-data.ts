/**
 * Audio Block Data Hook
 *
 * 업로드, 녹음, 초기 메타데이터 페치 전담.
 * URL은 초기 세팅 시에만 결정되며 이후 변경되지 않음을 전제로 함.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { fetchAudioMetadataAction } from '@/domains/audio-app-space/actions/metadata/fetch-audio-metadata.action';
import {
  type ReactFlowDependencies,
  useUpdateBlockProperty,
} from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { AudioBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import type { UpdateBlockTitleFn } from './types';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;
const MAX_SIZE_MB = 50;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export interface UseAudioBlockDataProps {
  nodeData: BlockNodeData;
  nodeId: string;
  updateBlockTitle?: UpdateBlockTitleFn;
  reactFlow: ReactFlowDependencies;
}

export interface UseAudioBlockDataReturn {
  audioUrl: string;
  filename: string;
  maxSizeMB: number;
  isUploading: boolean;
  uploadErrors: string[];
  isDragging: boolean;
  isRecordDialogOpen: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: () => object;
  handleOpenRecordDialog: () => void;
  handleCloseRecordDialog: () => void;
  handleRecordAgain: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleSaveRecording: () => Promise<void>;
}

export function useAudioBlockData({
  nodeData,
  nodeId,
  updateBlockTitle,
  reactFlow,
}: UseAudioBlockDataProps): UseAudioBlockDataReturn {
  const properties = nodeData.properties as AudioBlockProperties;
  const audioUrl = properties?.audioUrl ?? '';
  const filename = properties?.filename ?? '';

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { updateProperties } = useUpdateBlockProperty({ reactFlow });
  const { upload, isUploading } = useSupabaseStorage();

  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasInitialFetchDoneRef = useRef(false);
  const summaryReportedForBlockRef = useRef<string | null>(null);

  // 초기 세팅: audioUrl이 설정된 후 메타데이터 페치 (1회만, url 변경 로직 없음)
  useEffect(() => {
    if (!audioUrl || !hasValidBlockId || !workspaceId || !orgId) return;
    if (hasInitialFetchDoneRef.current) return;

    hasInitialFetchDoneRef.current = true;

    (async () => {
      try {
        const result = await fetchAudioMetadataAction({
          workspaceId,
          blockId: nodeData.blockId!,
          url: audioUrl
        });

        if (!result.success || !result.data) return;
        const { sourceId: newSourceId, blockUuid } = result.data;

        if (newSourceId) {
          await updateProperties(
            nodeData.blockId!,
            { sourceId: newSourceId },
            nodeData
          );

          if (
            blockUuid &&
            summaryReportedForBlockRef.current !== blockUuid
          ) {
            summaryReportedForBlockRef.current = blockUuid;
            setAutoSummaryBlockId(blockUuid);
          }

          if (updateBlockTitle && properties?.filename?.trim()) {
            await updateBlockTitle({
              nodeId,
              title: properties.filename.trim(),
              blockData: { ...nodeData, sourceId: newSourceId } as BlockNodeData,
            });
          }
        }
      } catch (err) {
        console.error('[useAudioBlockData] fetchMetadata failed:', err);
      }
    })();
  }, [
    audioUrl,
    hasValidBlockId,
    workspaceId,
    orgId,
    nodeData,
    nodeId,
    updateProperties,
    updateBlockTitle,
    setAutoSummaryBlockId,
    properties?.filename,
  ]);

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
            orgId,
            workspaceId,
          });
          await updateProperties(
            nodeData.blockId,
            {
              audioUrl: result.url,
              filename: fileWithPreview.file.name,
              fileSize: fileWithPreview.file.size,
            },
            nodeData
          );
        } catch (error) {
          console.error('Failed to upload audio:', error);
        }
      }
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
        orgId,
        workspaceId,
      });

      await updateProperties(
        nodeData.blockId,
        {
          audioUrl: result.url,
          filename: file.name,
          fileSize: recordedBlob.size,
        },
        nodeData
      );

      setIsRecordDialogOpen(false);
      setRecordedBlob(null);
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording.');
    }
  }, [recordedBlob, upload, updateProperties, nodeData, orgId, workspaceId]);

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

  return {
    audioUrl,
    filename,
    maxSizeMB: MAX_SIZE_MB,
    isUploading,
    uploadErrors,
    isDragging,
    isRecordDialogOpen,
    isRecording,
    recordedBlob,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    getInputProps,
    handleOpenRecordDialog,
    handleCloseRecordDialog,
    handleRecordAgain,
    startRecording,
    stopRecording,
    handleSaveRecording,
  };
}
