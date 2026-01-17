/**
 * YouTube Block Editor Schema
 *
 * YouTube video embed block editor panel UI rendering schema
 */
import type { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const youtubeEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.YOUTUBE,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'YouTube video information',
      defaultCollapsed: false,
      order: 1,
      properties: ['url'],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: false,
      order: 2,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // 기본 정보
    url: {
      label: 'YouTube URL',
      inputType: 'url',
      icon: 'Link',
      description: 'YouTube video URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      order: 1,
    },
    youtubeThumbnail: {
      label: 'Thumbnail',
      inputType: 'image-upload',
      icon: 'Image',
      description: 'YouTube thumbnail image (editable after fetch)',
      placeholder: 'Upload thumbnail image',
      order: 2,
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 11,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: 'Date when the block was last updated',
      order: 12,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: 'Created By',
      inputType: 'readonly-profile',
      icon: 'User',
      description: 'User who created the block',
      order: 13,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        // UserProfile 타입: id, email, name, avatarUrl
        return value.name || value.email || 'Unknown';
      },
    },
  },
};
