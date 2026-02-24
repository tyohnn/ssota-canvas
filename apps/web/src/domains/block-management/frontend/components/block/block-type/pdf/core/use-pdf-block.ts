'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useReactFlow } from '@xyflow/react';
import { refreshCanvasAssetAccessUrlAction } from '@/domains/storage/actions/storage.actions';
import { refreshPublishedCanvasAssetAccessUrlAction } from '@/domains/storage/actions/refresh-published-canvas-asset-access-url.action';
import type { CanvasAssetBlockType } from '@/domains/storage/actions/storage.actions';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import { ensureSourceAndJobAction } from '@/domains/source-management/actions/source/ensure-source-and-job.action';

import type { UsePdfBlockProps, UsePdfBlockReturn } from './types';

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;
const MAX_SIZE_MB = 6;
/** 1일. Signed URL 유효기간·워크스페이스 권한 회수 대응 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * PDF Block Main Hook
 *
 * - URL 변경 시 ensureSourceAndJobAction 호출 (Source + Job 연동)
 * - 파일 업로드 → Supabase Storage → properties 업데이트
 */
type PdfProperties = {
  pathUrl?: string;
  accessUrl?: string;
  accessUrlExpiresAt?: string | null;
  url?: string;
  filename?: string;
};

export function usePdfBlock(props: UsePdfBlockProps): UsePdfBlockReturn {
  const { nodeData, selected, nodeId, updateBlockTitle } = props;
  const properties = nodeData.properties as PdfProperties;
  const accessUrl = properties.accessUrl ?? properties.url ?? '';
  const pathUrl = properties.pathUrl ?? '';
  const filename = properties.filename;

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** 공개 페이지 뷰에서 refresh 시 받은 일회성 URL (DB 미갱신) */
  const [ephemeralAccessUrl, setEphemeralAccessUrl] = useState<string | null>(
    null
  );

  const fetchedForUrlRef = useRef<string | null>(null);
  const summaryReportedForBlockRef = useRef<string | null>(null);
  const hasTriedRefreshRef = useRef(false);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();
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
    if (!accessUrl || !hasValidBlockId || isOptimisticBlock) return;
    if (fetchedForUrlRef.current === accessUrl) return;
    if (readonly && publishToken) return;

    fetchedForUrlRef.current = accessUrl;
    ensureSourceAndJob(accessUrl, filename);
  }, [
    accessUrl,
    hasValidBlockId,
    isOptimisticBlock,
    filename,
    ensureSourceAndJob,
    readonly,
    publishToken,
  ]);

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
          orgId,
          workspaceId,
        });

        const accessUrlExpiresAt = new Date(
          Date.now() + ONE_DAY_MS
        ).toISOString();
        await updateProperties(
          nodeData.blockId,
          {
            pathUrl: result.path,
            accessUrl: result.url,
            accessUrlExpiresAt,
            filename: fileWithPreview.file.name,
          },
          nodeData
        );
      } catch (err) {
        console.error('[usePdfBlock] Upload failed:', err);
        setHasError(true);
        setErrorMessage('PDF upload failed');
        if (fileWithPreview.preview) {
          await updateProperties(
            nodeData.blockId,
            {
              pathUrl: '',
              accessUrl: fileWithPreview.preview,
              filename: fileWithPreview.file.name,
            },
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

  const onDocumentLoadError = useCallback(
    async (error: Error) => {
      console.error('PDF load error:', error);
      if (hasTriedRefreshRef.current || !pathUrl || !nodeData.blockId) {
        setHasError(true);
        setErrorMessage('Failed to load PDF');
        return;
      }
      hasTriedRefreshRef.current = true;
      try {
        const isPublishedView = readonly && publishToken;

        if (isPublishedView) {
          const result = await refreshPublishedCanvasAssetAccessUrlAction({
            publishToken,
            blockId: nodeData.blockId,
          });
          if (result.success && result.url) {
            setEphemeralAccessUrl(result.url);
            setHasError(false);
            setErrorMessage(null);
          } else {
            setHasError(true);
            setErrorMessage('Failed to load PDF');
          }
          return;
        }

        if (!workspaceId) {
          setHasError(true);
          setErrorMessage('Failed to load PDF');
          return;
        }
        const result = await refreshCanvasAssetAccessUrlAction(
          workspaceId,
          nodeData.blockId,
          'pdf' as CanvasAssetBlockType
        );
        if (result.success && result.url) {
          await updateProperty(
            nodeData.blockId,
            'properties.accessUrl',
            result.url,
            nodeData
          );
          setHasError(false);
          setErrorMessage(null);
        } else {
          setHasError(true);
          setErrorMessage('Failed to load PDF');
        }
      } catch {
        setHasError(true);
        setErrorMessage('Failed to load PDF');
      }
    },
    [
      nodeData.blockId,
      pathUrl,
      updateProperty,
      nodeData,
      workspaceId,
      readonly,
      publishToken,
    ]
  );

  const displayUrl = ephemeralAccessUrl ?? accessUrl;

  return {
    url: displayUrl,
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
