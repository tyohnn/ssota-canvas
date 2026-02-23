import type { LucideIcon } from 'lucide-react';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import {
  AudioLines,
  Link2,
  NotebookText,
  Paperclip,
  Shapes,
  Video,
} from 'lucide-react';

export interface ToolbarBlockTypeConfig {
  blockType: BlockType;
  label: string;
  icon: LucideIcon;
}

export const TOOLBAR_BLOCK_TYPES: ToolbarBlockTypeConfig[] = [
  { blockType: 'markdown', label: 'Note', icon: NotebookText },
  { blockType: 'shape', label: 'Shape', icon: Shapes },
  { blockType: 'link', label: 'Link', icon: Link2 },
  { blockType: 'file', label: 'File', icon: Paperclip },
  { blockType: 'audio', label: 'Audio', icon: AudioLines },
];

/** Extended set including YouTube (for tutorial) */
export const TOOLBAR_BLOCK_TYPES_WITH_YOUTUBE: ToolbarBlockTypeConfig[] = [
  ...TOOLBAR_BLOCK_TYPES,
  { blockType: 'youtube', label: 'YouTube', icon: Video },
];
