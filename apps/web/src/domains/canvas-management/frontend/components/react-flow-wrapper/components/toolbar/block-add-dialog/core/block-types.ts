import {
  Circle,
  Code,
  File,
  FileText,
  Github,
  Image,
  Link,
  Map,
  MessageSquare,
  Music,
  Square,
  Video,
  Zap,
} from 'lucide-react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type { BlockTypeInfo } from './types';

/**
 * 기본 블럭 타입 목록 (Command 컴포넌트용으로 확장)
 * Block Management Domain의 SUPPORTED_BLOCK_TYPES와 동기화
 */
export const DEFAULT_BLOCK_TYPES: BlockTypeInfo[] = [
  // Basic - Most frequently used blocks
  {
    type: BlockType.MARKDOWN,
    displayName: 'Markdown',
    icon: MessageSquare,
    description: 'Rich text with markdown support',
    category: 'Basic',
  },
  {
    type: BlockType.TEXT,
    displayName: 'Sticker',
    icon: FileText,
    description: 'Quick text note',
    category: 'Basic',
    isPreparing: true,
  },
  {
    type: BlockType.SHAPE,
    displayName: 'Shape',
    icon: Square,
    description: 'Geometric shapes',
    category: 'Basic',
  },
  // Media
  {
    type: BlockType.IMAGE,
    displayName: 'Image',
    icon: Image,
    description: 'Upload or embed images',
    category: 'Media',
  },
  {
    type: BlockType.YOUTUBE,
    displayName: 'YouTube',
    icon: Video,
    description: 'Embed YouTube videos',
    category: 'Media',
  },
  {
    type: BlockType.AUDIO,
    displayName: 'Audio',
    icon: Music,
    description: 'Audio files and players',
    category: 'Media',
    isPreparing: true,
  },
  {
    type: BlockType.PDF,
    displayName: 'PDF',
    icon: FileText,
    description: 'PDF document viewer',
    category: 'Media',
    isPreparing: true,
  },
  // Content
  {
    type: BlockType.LINK,
    displayName: 'Link',
    icon: Link,
    description: 'Link preview with metadata',
    category: 'Content',
  },
  // Code
  {
    type: BlockType.PYTHON,
    displayName: 'Python Code',
    icon: Code,
    description: 'Execute Python code',
    category: 'Code',
    isPreparing: true,
  },
  // Preparing - Blocks in development
  {
    type: BlockType.PAGE_MENTION,
    displayName: 'Page Mention',
    icon: FileText,
    description: 'Reference other pages',
    isPreparing: true,
  },
  {
    type: BlockType.LATEX,
    displayName: 'LaTeX',
    icon: Code,
    description: 'Mathematical formulas',
    isPreparing: true,
  },
  {
    type: BlockType.FILE,
    displayName: 'File',
    icon: File,
    description: 'File attachment',
    isPreparing: true,
  },
  {
    type: BlockType.GITHUB_PR,
    displayName: 'GitHub PR',
    icon: Github,
    description: 'GitHub pull request preview',
    isPreparing: true,
  },
  {
    type: BlockType.REACT_COMPONENT,
    displayName: 'React Component',
    icon: Zap,
    description: 'Custom React component',
    isPreparing: true,
  },
];
