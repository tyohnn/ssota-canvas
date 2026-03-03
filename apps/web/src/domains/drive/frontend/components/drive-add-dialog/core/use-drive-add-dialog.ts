'use client';

import { useCallback } from 'react';

import {
  AudioLines,
  Image,
  Link2,
  NotebookText,
  Paperclip,
  Video,
} from 'lucide-react';

import type { DriveAddDialogProps, DriveBlockTypeTab } from './types';
import { useDriveAddDialogUI } from './use-drive-add-dialog.ui';
import { useDriveWorkspaces } from '@/domains/drive/frontend/hooks/use-drive-workspaces';
import { XTabIcon } from '../components/x-tab-icon';

const TABS = [
  { id: 'markdown' as const, label: 'Note', icon: NotebookText },
  { id: 'link' as const, label: 'Link', icon: Link2 },
  { id: 'youtube' as const, label: 'YouTube', icon: Video },
  { id: 'x' as const, label: 'X', icon: XTabIcon },
  { id: 'audio' as const, label: 'Audio', icon: AudioLines },
  { id: 'image' as const, label: 'Image', icon: Image },
  { id: 'pdf' as const, label: 'PDF', icon: Paperclip },
];

export function useDriveAddDialog({
  orgId,
  open,
  onOpenChange,
}: DriveAddDialogProps) {
  const ui = useDriveAddDialogUI();
  const { workspaces, isLoading: isLoadingWorkspaces } = useDriveWorkspaces(
    orgId,
    open
  );

  const handleClose = useCallback(() => {
    ui.reset();
    onOpenChange(false);
  }, [onOpenChange, ui.reset]);

  return {
    ...ui,
    tabs: TABS,
    workspaces,
    isLoadingWorkspaces,
    handleClose,
  };
}
