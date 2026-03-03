'use client';

import type { DriveBlockTypeTab } from '../../core/types';
import { LinkAddSection } from './link';
import { YoutubeAddSection } from './youtube';
import { XAddSection } from './x';
import { PdfAddSection } from './pdf';
import { AudioAddSection } from './audio';
import { ImageAddSection } from './image';
import { MarkdownAddSection } from './markdown';

export interface FormContentProps {
  activeTab: DriveBlockTypeTab;
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

export function FormContent({
  activeTab,
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: FormContentProps) {
  switch (activeTab) {
    case 'link':
      return (
        <LinkAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'youtube':
      return (
        <YoutubeAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'x':
      return (
        <XAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'pdf':
      return (
        <PdfAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'audio':
      return (
        <AudioAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'image':
      return (
        <ImageAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    case 'markdown':
      return (
        <MarkdownAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
    default:
      return (
        <MarkdownAddSection
          orgId={orgId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onClose={onClose}
        />
      );
  }
}
