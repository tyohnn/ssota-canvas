import type React from 'react';

export type DriveBlockTypeTab =
  | 'link'
  | 'audio'
  | 'markdown'
  | 'pdf'
  | 'youtube'
  | 'image'
  | 'x';

export interface DriveAddDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface DriveAddDialogTab {
  id: DriveBlockTypeTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
