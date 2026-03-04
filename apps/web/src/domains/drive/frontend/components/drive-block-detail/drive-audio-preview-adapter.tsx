'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  AudioView,
  AudioPreviewCard,
  useAudioBlockPreview,
} from '@workspace/ssota-blocks/audio';
import { refreshCanvasAssetAccessUrlAction } from '@/domains/storage/actions/storage.actions';
import { useDriveBlockInteraction } from '@/domains/drive/frontend/contexts/drive-block-interaction-context';

/** UUID to 8-char hex slug (workspace scoped) */
function uuidToSlug(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}

export interface DriveAudioPreviewAdapterProps {
  title: string | null;
  properties: Record<string, unknown>;
  blockId?: string;
  workspaceId?: string;
  /** When true, hide title row in player (e.g. grid card has its own header) */
  compact?: boolean;
}

const noop = () => {};
const noopAsync = async () => {};

/**
 * Drive audio preview: playable AudioView (same as React Flow block).
 * When blockId/workspaceId provided, refreshes access URL on load error.
 */
export function DriveAudioPreviewAdapter({
  title,
  properties,
  blockId,
  workspaceId,
  compact = false,
}: DriveAudioPreviewAdapterProps) {
  const accessUrl =
    (properties.accessUrl ?? (properties as { audioUrl?: string }).audioUrl) as
      | string
      | undefined;
  const filename = (properties.filename as string) ?? '';

  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
  const hasTriedRefreshRef = useRef(false);

  const effectiveUrl = refreshedUrl ?? accessUrl ?? '';

  const previewHook = useAudioBlockPreview({
    audioUrl: effectiveUrl,
    filename,
  });

  const driveInteraction = useDriveBlockInteraction();
  const handleSeekRef = useRef(previewHook.handleSeek);
  handleSeekRef.current = previewHook.handleSeek;
  const audioRefRef = useRef(previewHook.audioRef);
  audioRefRef.current = previewHook.audioRef;

  useEffect(() => {
    if (!blockId || !effectiveUrl || !driveInteraction) return;
    driveInteraction.registerBlockInteractions(blockId, {
      seekTo: (seconds: unknown) => {
        const s = typeof seconds === 'number' ? seconds : Number(seconds);
        if (!Number.isFinite(s)) return;
        handleSeekRef.current(s);
        audioRefRef.current?.current?.play().catch(() => {});
      },
    });
    return () => driveInteraction.unregisterBlockInteractions(blockId);
  }, [blockId, effectiveUrl, driveInteraction]);

  const handleRefreshUrl = useCallback(async () => {
    if (hasTriedRefreshRef.current || !blockId || !workspaceId) {
      return;
    }
    hasTriedRefreshRef.current = true;
    try {
      const slug = uuidToSlug(blockId);
      const result = await refreshCanvasAssetAccessUrlAction(
        workspaceId,
        slug,
        'audio'
      );
      if (result.success && result.url) {
        setRefreshedUrl(result.url);
      }
    } catch {
      // leave hasError as is
    }
  }, [blockId, workspaceId]);

  // On load error: try refresh (e.g. expired signed URL)
  useEffect(() => {
    if (previewHook.hasError && effectiveUrl) {
      handleRefreshUrl();
    }
  }, [previewHook.hasError, effectiveUrl, handleRefreshUrl]);

  // Grid/list often has no accessUrl; fetch once on mount when we have blockId + workspaceId
  const hasFetchedOnMountRef = useRef(false);
  useEffect(() => {
    if (
      hasFetchedOnMountRef.current ||
      effectiveUrl ||
      !blockId ||
      !workspaceId
    ) {
      return;
    }
    hasFetchedOnMountRef.current = true;
    handleRefreshUrl();
  }, [effectiveUrl, blockId, workspaceId, handleRefreshUrl]);

  const audioViewProps = useMemo(
    () => ({
      audioUrl: effectiveUrl,
      filename,
      ...previewHook,
      isUploading: false,
      uploadErrors: [] as string[],
      isDragging: false,
      maxSizeMB: 6,
      isRecordDialogOpen: false,
      isRecording: false,
      recordedBlob: null as Blob | null,
      selected: true,
      compact,
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
    }),
    [effectiveUrl, filename, previewHook, compact]
  );

  const containerClassName =
    'w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden [&_.nodrag]:pointer-events-auto';

  if (!effectiveUrl) {
    return (
      <Box className={containerClassName}>
        <AudioPreviewCard title={title} properties={properties} />
      </Box>
    );
  }

  return (
    <Box className={containerClassName}>
      <AudioView {...audioViewProps} />
    </Box>
  );
}
