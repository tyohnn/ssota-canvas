'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useReactFlow } from '@xyflow/react';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import { ensureSourceAndJobAction } from '@/domains/source-management/actions/source/ensure-source-and-job.action';

import type { UsePdfBlockProps, UsePdfBlockReturn } from './types';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;
const MAX_SIZE_MB = 50;

/**
 * PDF Block Main Hook
 *
 * - URL 변경 시 ensureSourceAndJobAction 호출 (Source + Job 연동)
 * - 파일 업로드 → Supabase Storage → properties 업데이트
 */
export function usePdfBlock(props: UsePdfBlockProps): UsePdfBlockReturn {
  const { nodeData, selected, nodeId, updateBlockTitle } = props;
  const properties = nodeData.properties as { url?: string; filename?: string };
  const { url, filename } = properties;

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchedForUrlRef = useRef<string | null>(null);
  const summaryReportedForBlockRef = useRef<string | null>(null);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: { getNode, updateNode },
  });
  const { upload, isUploading: isStorageUploading } = useSupabaseStorage();

  const ensureSourceAndJob = useCallback(
    async (urlToFetch: string, filenameToSet?: string) => {
      if (!hasValidBlockId || !workspaceId || !orgId) return;

      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      try {
        const result = await ensureSourceAndJobAction({
          workspaceId,
          blockId: nodeData.blockId!,
          url: urlToFetch,
          sourceType: 'pdf',
          language: 'en',
        });

        if (result.success && result.data) {
          const { sourceId, blockUuid } = result.data;
          await updateProperties(
            nodeData.blockId!,
            {
              ...(sourceId && { sourceId }),
              ...(filenameToSet && { filename: filenameToSet }),
            },
            nodeData
          );
          if (
            blockUuid &&
            summaryReportedForBlockRef.current !== blockUuid
          ) {
            summaryReportedForBlockRef.current = blockUuid;
            setAutoSummaryBlockId(blockUuid);
          }
          if (updateBlockTitle && filenameToSet) {
            await updateBlockTitle({
              nodeId,
              title: filenameToSet,
              blockData: { ...nodeData, sourceId },
            });
          }
        } else {
          setHasError(true);
          const errResult = result as { error?: string };
          setErrorMessage(errResult.error ?? 'Failed to link source');
        }
      } catch (err) {
        console.error('[usePdfBlock] ensureSourceAndJob failed:', err);
        setHasError(true);
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      hasValidBlockId,
      workspaceId,
      orgId,
      nodeData,
      updateProperties,
      updateBlockTitle,
      setAutoSummaryBlockId,
      nodeId,
    ]
  );

  const isOptimisticBlock = nodeId.startsWith('optimistic-');

  useEffect(() => {
    if (!url || !hasValidBlockId || isOptimisticBlock) return;
    if (fetchedForUrlRef.current === url) return;

    fetchedForUrlRef.current = url;
    ensureSourceAndJob(url, filename);
  }, [url, hasValidBlockId, isOptimisticBlock, filename, ensureSourceAndJob]);

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
    accept: 'application/pdf,.pdf',
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (!fileWithPreview?.file || !(fileWithPreview.file instanceof File))
        return;

      try {
        const result = await upload({
          bucket: StorageBucket.CANVAS_ASSETS,
          file: fileWithPreview.file,
          blockId: nodeData.blockId,
        });

        await updateProperty(
          nodeData.blockId,
          'properties.url',
          result.url,
          nodeData
        );
        await updateProperty(
          nodeData.blockId,
          'properties.filename',
          fileWithPreview.file.name,
          nodeData
        );
      } catch (err) {
        console.error('[usePdfBlock] Upload failed:', err);
        setHasError(true);
        setErrorMessage('PDF upload failed');
        if (fileWithPreview.preview) {
          await updateProperty(
            nodeData.blockId,
            'properties.url',
            fileWithPreview.preview,
            nodeData
          );
          await updateProperty(
            nodeData.blockId,
            'properties.filename',
            fileWithPreview.file.name,
            nodeData
          );
        }
      }
    },
  });

  const onDocumentLoadSuccess = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setHasError(true);
    setErrorMessage('Failed to load PDF');
  }, []);

  return {
    url: url ?? '',
    filename,
    isLoading,
    hasError,
    errorMessage,
    isUploading: isStorageUploading,
    uploadErrors,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    getInputProps: () => getInputProps() as unknown as Record<string, unknown>,
    onDocumentLoadSuccess,
    onDocumentLoadError,
  };
}
