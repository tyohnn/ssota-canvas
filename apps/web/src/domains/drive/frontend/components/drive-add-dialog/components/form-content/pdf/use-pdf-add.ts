'use client';

import { useCallback, useEffect, useState } from 'react';

import { useDriveCreateBlock } from '@/domains/drive/frontend/hooks/use-drive-create-block';
import {
  type UploadContext,
  useDriveAssetUpload,
} from '../../../core/use-drive-asset-upload';
import { useDriveSourceRegistration } from '../../../core/use-drive-source-registration';
import { slugFromUuid } from '../../../core/utils';

export function usePdfAdd(
  orgId: string,
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>,
  onClose: () => void
) {
  const createBlock = useDriveCreateBlock(orgId);
  const { uploadForPdf, isUploading } = useDriveAssetUpload({ orgId });
  const { ensureSourceJob } = useDriveSourceRegistration();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const effectiveWorkspaceId =
    workspaceId || workspaces[0]?.workspaceId || '';

  useEffect(() => {
    if (workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0]!.workspaceId);
    }
  }, [workspaces, workspaceId]);

  useEffect(() => {
    if (selectedFile) {
      setTitle(prev => prev || selectedFile.name);
    }
  }, [selectedFile]);

  const submit = useCallback(async () => {
    if (!selectedFile || !effectiveWorkspaceId) return;
    const uploadContext: UploadContext = { workspaceId: effectiveWorkspaceId };
    const asset = await uploadForPdf(selectedFile, uploadContext);
    const result = await createBlock.mutateAsync({
      organizationId: orgId,
      workspaceId: effectiveWorkspaceId,
      blockType: 'pdf',
      title: title || selectedFile.name,
      initialProperties: asset.initialProperties,
    });
    if (result?.blockId) {
      const slug = slugFromUuid(result.blockId);
      await ensureSourceJob({
        workspaceId: effectiveWorkspaceId,
        blockId: slug,
        url: asset.url,
        sourceType: 'pdf',
      });
    }
    onClose();
  }, [
    orgId,
    selectedFile,
    title,
    effectiveWorkspaceId,
    uploadForPdf,
    createBlock,
    ensureSourceJob,
    onClose,
  ]);

  const isSubmitting = createBlock.isPending || isUploading;

  return {
    selectedFile,
    setSelectedFile,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    submit,
    isSubmitting,
  };
}
